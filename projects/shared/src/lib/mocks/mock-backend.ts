/**
 * Backend simulado en memoria.
 *
 * Reproduce el comportamiento del futuro API Spring Boot: mismas rutas,
 * mismos DTOs, mismos códigos de error. La UI nunca sabe que está hablando
 * con un mock porque siempre pasa por `HttpClient`.
 *
 * Ver `docs/API-ENDPOINTS.md` para el contrato completo.
 */
import { Injectable, signal } from '@angular/core';
import {
  AuthResponseDto,
  CalificacionDto,
  CambiarEstadoViajeRequestDto,
  CancelacionResponseDto,
  CancelarViajeRequestDto,
  ConductorDto,
  CrearCalificacionRequestDto,
  CrearSolicitudRequestDto,
  DisponibilidadRequestDto,
  DisponibilidadResponseDto,
  EstimacionTarifaRequestDto,
  EstimacionTarifaResponseDto,
  LoginRequestDto,
  LugarDto,
  OfertaViajeDto,
  PageDto,
  PasajeroDto,
  RegistroConductorRequestDto,
  RegistroPasajeroRequestDto,
  ResumenConductorDto,
  SolicitudViajeDto,
  TarifaDto,
  UbicacionConductorResponseDto,
  ViajeDto,
  ViajeHistorialDto,
} from '../dto/api.dto';
import {
  CategoriaVehiculo,
  Coordenada,
  EstadoConductor,
  EstadoViaje,
} from '../domain/models';
import { distanciaKm, duracionMin, generarRuta, interpolar, puntoEnRuta } from '../core/geo.util';
import {
  CATALOGO_CATEGORIAS,
  CENTRO_CIUDAD,
  CONDUCTORES_CERCANOS,
  CONDUCTOR_DEMO,
  HISTORIAL_CONDUCTOR,
  HISTORIAL_PASAJERO,
  LUGARES,
  PASAJERO_DEMO,
} from './mock-data';

export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Duración (ms) de cada fase del viaje simulado. */
const FASE = {
  BUSQUEDA: 6000,
  EN_CAMINO: 26000,
  ESPERA_EN_PUNTO: 10000,
  EN_CURSO: 40000,
  OFERTA_VALIDA: 20000,
  NUEVA_OFERTA: 9000,
};

interface FaseViaje {
  desde: number;
  autoAvance: boolean;
  origenConductor: Coordenada;
}

const ahora = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const round100 = (n: number) => Math.round(n / 100) * 100;

@Injectable({ providedIn: 'root' })
export class MockBackend {
  private readonly viajes = new Map<string, ViajeDto>();
  private readonly solicitudes = new Map<string, SolicitudViajeDto>();
  private readonly fases = new Map<string, FaseViaje>();
  private readonly calificaciones: CalificacionDto[] = [];
  private historialPasajero: ViajeHistorialDto[] = [...HISTORIAL_PASAJERO];
  private historialConductor: ViajeHistorialDto[] = [...HISTORIAL_CONDUCTOR];

  private pasajero: PasajeroDto = structuredClone(PASAJERO_DEMO);
  private conductor: ConductorDto = structuredClone(CONDUCTOR_DEMO);

  /** Estado del conductor logueado (HU-02). */
  readonly estadoConductor = signal<EstadoConductor>('DESCONECTADO');
  private disponibleDesde = 0;
  private ofertaActual: OfertaViajeDto | null = null;
  private ofertaCreadaEn = 0;
  private ultimaOfertaCerradaEn = 0;
  private solicitudesRechazadas = 0;
  private solicitudesRecibidas = 0;

  // ============================================================
  // Router del mock
  // ============================================================
  handle(method: string, path: string, body: unknown, params: Record<string, string>): unknown {
    const url = path.replace(/^\/api/, '');
    const seg = url.split('?')[0].split('/').filter(Boolean);
    const r = `${method} /${seg.join('/')}`;

    // --- Identidad ------------------------------------------------
    if (r === 'POST /auth/login') return this.login(body as LoginRequestDto);
    if (r === 'POST /auth/registro/pasajero')
      return this.registroPasajero(body as RegistroPasajeroRequestDto);
    if (r === 'POST /auth/registro/conductor')
      return this.registroConductor(body as RegistroConductorRequestDto);
    if (r === 'GET /usuarios/me') return this.perfil(params['rol']);
    if (r === 'PUT /usuarios/me') return this.actualizarPerfil(body as Record<string, unknown>, params['rol']);

    // --- Geografía -------------------------------------------------
    if (r === 'GET /lugares') return this.buscarLugares(params['q'] ?? '');

    // --- Tarifas ---------------------------------------------------
    if (r === 'POST /tarifas/estimacion')
      return this.estimarTarifa(body as EstimacionTarifaRequestDto);

    // --- Emparejamiento --------------------------------------------
    if (r === 'POST /solicitudes') return this.crearSolicitud(body as CrearSolicitudRequestDto);
    if (method === 'GET' && seg[0] === 'solicitudes' && seg.length === 2)
      return this.obtenerSolicitud(seg[1]);
    if (method === 'DELETE' && seg[0] === 'solicitudes' && seg.length === 2)
      return this.cancelarSolicitud(seg[1]);
    if (method === 'POST' && seg[0] === 'solicitudes' && seg[2] === 'aceptar')
      return this.aceptarSolicitud(seg[1]);
    if (method === 'POST' && seg[0] === 'solicitudes' && seg[2] === 'rechazar')
      return this.rechazarSolicitud(seg[1]);
    if (r === 'GET /conductores/me/solicitudes') return this.solicitudesEntrantes();

    // --- Conductores -------------------------------------------------
    if (r === 'PUT /conductores/me/disponibilidad')
      return this.cambiarDisponibilidad(body as DisponibilidadRequestDto);
    if (r === 'GET /conductores/me/resumen') return this.resumenConductor();
    if (r === 'POST /conductores/me/ubicacion') return { registradoEn: ahora() };

    // --- Viajes ---------------------------------------------------------
    if (method === 'GET' && seg[0] === 'viajes' && seg.length === 1)
      return this.historial(params['rol'] ?? 'PASAJERO', Number(params['page'] ?? 0));
    if (r === 'GET /viajes/activo') return this.viajeActivo(params['rol'] ?? 'PASAJERO');
    if (method === 'GET' && seg[0] === 'viajes' && seg.length === 2) return this.obtenerViaje(seg[1]);
    if (method === 'GET' && seg[0] === 'viajes' && seg[2] === 'ubicacion-conductor')
      return this.ubicacionConductor(seg[1]);
    if (method === 'POST' && seg[0] === 'viajes' && seg[2] === 'estado')
      return this.cambiarEstadoViaje(seg[1], body as CambiarEstadoViajeRequestDto);
    if (method === 'POST' && seg[0] === 'viajes' && seg[2] === 'cancelacion')
      return this.cancelarViaje(seg[1], body as CancelarViajeRequestDto);
    if (method === 'POST' && seg[0] === 'viajes' && seg[2] === 'calificacion')
      return this.calificar(seg[1], body as CrearCalificacionRequestDto, params['rol'] ?? 'PASAJERO');

    throw new MockHttpError(404, 'RUTA_NO_ENCONTRADA', `Mock sin ruta para ${method} ${path}`);
  }

  // ============================================================
  // Identidad
  // ============================================================
  private login(req: LoginRequestDto): AuthResponseDto {
    if (!req?.email || !req?.password) {
      throw new MockHttpError(400, 'CREDENCIALES_INVALIDAS', 'Email y contraseña son obligatorios');
    }
    if (req.password.length < 4) {
      throw new MockHttpError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos');
    }
    const usuario = req.rol === 'CONDUCTOR' ? this.conductor : this.pasajero;
    return {
      accessToken: `mock.jwt.${uid('tk')}`,
      refreshToken: uid('rt'),
      expiresIn: 3600,
      usuario: { ...usuario, email: req.email },
    };
  }

  private registroPasajero(req: RegistroPasajeroRequestDto): AuthResponseDto {
    if (!req.email?.includes('@')) {
      throw new MockHttpError(422, 'EMAIL_INVALIDO', 'El correo no tiene un formato válido');
    }
    this.pasajero = {
      ...this.pasajero,
      id: uid('pas'),
      nombre: req.nombre,
      apellido: req.apellido,
      email: req.email,
      telefono: req.telefono,
      viajesRealizados: 0,
      calificacionPromedio: 5,
      fechaRegistro: ahora(),
    };
    return {
      accessToken: `mock.jwt.${uid('tk')}`,
      refreshToken: uid('rt'),
      expiresIn: 3600,
      usuario: this.pasajero,
    };
  }

  private registroConductor(req: RegistroConductorRequestDto): AuthResponseDto {
    this.conductor = {
      ...this.conductor,
      id: uid('con'),
      nombre: req.nombre,
      apellido: req.apellido,
      email: req.email,
      telefono: req.telefono,
      licencia: req.licencia,
      vehiculo: { ...req.vehiculo, id: uid('veh') },
      estado: 'DESCONECTADO',
      viajesCompletados: 0,
      calificacionPromedio: 5,
      documentosVerificados: false,
      fechaRegistro: ahora(),
    };
    return {
      accessToken: `mock.jwt.${uid('tk')}`,
      refreshToken: uid('rt'),
      expiresIn: 3600,
      usuario: this.conductor,
    };
  }

  private perfil(rol?: string): PasajeroDto | ConductorDto {
    return rol === 'CONDUCTOR' ? this.conductor : this.pasajero;
  }

  private actualizarPerfil(body: Record<string, unknown>, rol?: string): PasajeroDto | ConductorDto {
    if (rol === 'CONDUCTOR') {
      this.conductor = { ...this.conductor, ...(body as Partial<ConductorDto>) };
      return this.conductor;
    }
    this.pasajero = { ...this.pasajero, ...(body as Partial<PasajeroDto>) };
    return this.pasajero;
  }

  // ============================================================
  // Geografía y tarifas
  // ============================================================
  private buscarLugares(q: string): LugarDto[] {
    const texto = q.trim().toLowerCase();
    if (!texto) return LUGARES.slice(0, 6);
    return LUGARES.filter(
      (l) =>
        l.nombre.toLowerCase().includes(texto) || l.direccion.toLowerCase().includes(texto),
    );
  }

  private tarifaPara(
    categoria: CategoriaVehiculo,
    km: number,
    min: number,
    multiplicador = 1,
  ): TarifaDto {
    const cat = CATALOGO_CATEGORIAS.find((c) => c.categoria === categoria) ?? CATALOGO_CATEGORIAS[0];
    const subtotal = cat.tarifaBase + km * cat.costoPorKm + min * cat.costoPorMinuto;
    const recargo = subtotal * (multiplicador - 1);
    const total = round100(subtotal + recargo);
    return {
      moneda: 'COP',
      total,
      minimoEstimado: round100(total * 0.92),
      maximoEstimado: round100(total * 1.12),
      categoria: cat.categoria,
      calculadaEn: ahora(),
      desglose: {
        tarifaBase: cat.tarifaBase,
        costoPorKm: cat.costoPorKm,
        costoPorMinuto: cat.costoPorMinuto,
        distanciaKm: Number(km.toFixed(2)),
        duracionMin: min,
        subtotal: round100(subtotal),
        multiplicadorDemanda: multiplicador,
        recargoDemanda: round100(recargo),
        descuento: 0,
        total,
      },
    };
  }

  private estimarTarifa(req: EstimacionTarifaRequestDto): EstimacionTarifaResponseDto {
    if (!req?.origen || !req?.destino) {
      throw new MockHttpError(400, 'ORIGEN_DESTINO_REQUERIDOS', 'Origen y destino son obligatorios');
    }
    const km = Math.max(0.8, distanciaKm(req.origen, req.destino) * 1.28);
    const min = duracionMin(km);
    const hora = new Date().getHours();
    const multiplicador = hora >= 17 && hora <= 19 ? 1.25 : 1;
    return {
      distanciaKm: Number(km.toFixed(2)),
      duracionMin: min,
      opciones: CATALOGO_CATEGORIAS.map((c) => ({
        categoria: c.categoria,
        nombre: c.nombre,
        descripcion: c.descripcion,
        capacidad: c.capacidad,
        icono: c.icono,
        etaMinutos: c.etaMinutos,
        tarifa: this.tarifaPara(c.categoria, km, min, multiplicador),
      })),
    };
  }

  // ============================================================
  // Emparejamiento (HU-01, HU-03, HU-04)
  // ============================================================
  private crearSolicitud(req: CrearSolicitudRequestDto): SolicitudViajeDto {
    if (!req?.origen || !req?.destino) {
      throw new MockHttpError(400, 'ORIGEN_DESTINO_REQUERIDOS', 'Origen y destino son obligatorios');
    }
    const activo = [...this.viajes.values()].find((v) => this.esActivo(v.estado));
    if (activo) {
      throw new MockHttpError(409, 'VIAJE_ACTIVO_EXISTENTE', 'Ya tienes un viaje en curso');
    }
    const km = Math.max(0.8, distanciaKm(
      { lat: req.origen.lat, lng: req.origen.lng },
      { lat: req.destino.lat, lng: req.destino.lng },
    ) * 1.28);
    const solicitud: SolicitudViajeDto = {
      id: uid('sol'),
      pasajeroId: this.pasajero.id,
      origen: req.origen,
      destino: req.destino,
      categoria: req.categoria,
      metodoPago: req.metodoPago,
      notaParaConductor: req.notaParaConductor,
      estado: 'BUSCANDO',
      tarifaEstimada: this.tarifaPara(req.categoria, km, duracionMin(km)),
      creadaEn: ahora(),
    };
    this.solicitudes.set(solicitud.id, solicitud);
    return solicitud;
  }

  /** HU-03: el emparejamiento se resuelve solo tras `FASE.BUSQUEDA`. */
  private obtenerSolicitud(id: string): SolicitudViajeDto {
    const solicitud = this.solicitudes.get(id);
    if (!solicitud) throw new MockHttpError(404, 'SOLICITUD_NO_ENCONTRADA', 'Solicitud no encontrada');
    if (solicitud.estado !== 'BUSCANDO') return solicitud;

    const transcurrido = Date.now() - new Date(solicitud.creadaEn).getTime();
    if (transcurrido < FASE.BUSQUEDA) return solicitud;

    const conductor = CONDUCTORES_CERCANOS.find((c) => c.vehiculo.categoria === solicitud.categoria)
      ?? CONDUCTORES_CERCANOS[0];
    const viaje = this.crearViaje(solicitud, conductor, true);
    solicitud.estado = 'ACEPTADA';
    solicitud.conductorCandidatoId = conductor.id;
    solicitud.viajeId = viaje.id;
    return solicitud;
  }

  /** Bandeja de solicitudes entrantes del conductor (HU-04). */
  private solicitudesEntrantes(): OfertaViajeDto[] {
    if (this.estadoConductor() !== 'DISPONIBLE') return [];
    const t = Date.now();

    if (this.ofertaActual && t - this.ofertaCreadaEn > FASE.OFERTA_VALIDA) {
      this.ofertaActual = null;
      this.ultimaOfertaCerradaEn = t;
    }
    if (!this.ofertaActual && t - Math.max(this.ultimaOfertaCerradaEn, this.disponibleDesde) > FASE.NUEVA_OFERTA) {
      this.ofertaActual = this.generarOferta();
      this.ofertaCreadaEn = t;
      this.solicitudesRecibidas++;
    }
    if (!this.ofertaActual) return [];
    return [
      {
        ...this.ofertaActual,
        expiraEnSegundos: Math.max(
          0,
          Math.round((FASE.OFERTA_VALIDA - (t - this.ofertaCreadaEn)) / 1000),
        ),
      },
    ];
  }

  private generarOferta(): OfertaViajeDto {
    const pool = LUGARES.filter((l) => l.tipo !== 'casa');
    const origen = pool[Math.floor(Math.random() * pool.length)];
    let destino = pool[Math.floor(Math.random() * pool.length)];
    if (destino.id === origen.id) destino = LUGARES[0];

    const posConductor = this.conductor.ubicacionActual ?? CENTRO_CIUDAD;
    const kmOrigen = Math.max(0.4, distanciaKm(posConductor, { lat: origen.lat, lng: origen.lng }));
    const kmViaje = Math.max(
      0.9,
      distanciaKm({ lat: origen.lat, lng: origen.lng }, { lat: destino.lat, lng: destino.lng }) * 1.28,
    );
    const min = duracionMin(kmViaje);
    const solicitudId = uid('sol');
    const nombres = ['Valentina R.', 'Camilo S.', 'Laura M.', 'Diego T.', 'Sara P.'];

    const solicitud: SolicitudViajeDto = {
      id: solicitudId,
      pasajeroId: uid('pas'),
      origen,
      destino,
      categoria: this.conductor.vehiculo.categoria,
      metodoPago: Math.random() > 0.5 ? 'TARJETA' : 'EFECTIVO',
      estado: 'OFRECIDA',
      tarifaEstimada: this.tarifaPara(this.conductor.vehiculo.categoria, kmViaje, min),
      creadaEn: ahora(),
      conductorCandidatoId: this.conductor.id,
    };
    this.solicitudes.set(solicitudId, solicitud);

    return {
      solicitudId,
      pasajero: {
        id: solicitud.pasajeroId,
        nombre: nombres[Math.floor(Math.random() * nombres.length)],
        calificacionPromedio: Number((4.4 + Math.random() * 0.6).toFixed(2)),
      },
      origen,
      destino,
      distanciaHastaOrigenKm: Number(kmOrigen.toFixed(2)),
      minutosHastaOrigen: duracionMin(kmOrigen, 30),
      distanciaViajeKm: Number(kmViaje.toFixed(2)),
      duracionViajeMin: min,
      tarifa: solicitud.tarifaEstimada,
      metodoPago: solicitud.metodoPago,
      expiraEnSegundos: Math.round(FASE.OFERTA_VALIDA / 1000),
    };
  }

  private aceptarSolicitud(id: string): ViajeDto {
    const solicitud = this.solicitudes.get(id);
    if (!solicitud) throw new MockHttpError(404, 'SOLICITUD_NO_ENCONTRADA', 'Solicitud no encontrada');
    if (solicitud.estado === 'ACEPTADA' && solicitud.viajeId) {
      return this.viajes.get(solicitud.viajeId)!;
    }
    if (this.ofertaActual?.solicitudId !== id) {
      throw new MockHttpError(410, 'SOLICITUD_EXPIRADA', 'La solicitud ya fue tomada por otro conductor');
    }
    const oferta = this.ofertaActual;
    this.ofertaActual = null;
    this.ultimaOfertaCerradaEn = Date.now();
    this.estadoConductor.set('OCUPADO');
    this.conductor = { ...this.conductor, estado: 'OCUPADO' };

    const viaje = this.crearViaje(solicitud, this.conductor, false, oferta.pasajero.nombre);
    solicitud.estado = 'ACEPTADA';
    solicitud.viajeId = viaje.id;
    return viaje;
  }

  /** HU-10: cancelación del pasajero antes de tener conductor asignado. */
  private cancelarSolicitud(id: string): { solicitudId: string; estado: string } {
    const solicitud = this.solicitudes.get(id);
    if (!solicitud)
      throw new MockHttpError(404, 'SOLICITUD_NO_ENCONTRADA', 'Solicitud no encontrada');
    if (solicitud.estado === 'ACEPTADA')
      throw new MockHttpError(
        409,
        'SOLICITUD_YA_ACEPTADA',
        'Ya hay un conductor asignado; cancela el viaje en su lugar',
      );
    solicitud.estado = 'CANCELADA';
    return { solicitudId: id, estado: 'CANCELADA' };
  }

  private rechazarSolicitud(id: string): { solicitudId: string; estado: string } {
    if (this.ofertaActual?.solicitudId === id) {
      this.ofertaActual = null;
      this.ultimaOfertaCerradaEn = Date.now();
    }
    const solicitud = this.solicitudes.get(id);
    if (solicitud) solicitud.estado = 'RECHAZADA';
    this.solicitudesRechazadas++;
    return { solicitudId: id, estado: 'RECHAZADA' };
  }

  // ============================================================
  // Conductores (HU-02)
  // ============================================================
  private cambiarDisponibilidad(req: DisponibilidadRequestDto): DisponibilidadResponseDto {
    if (req.estado !== 'DISPONIBLE' && req.estado !== 'DESCONECTADO') {
      throw new MockHttpError(400, 'ESTADO_INVALIDO', 'Estado de disponibilidad no soportado');
    }
    if (req.estado === 'DESCONECTADO' && [...this.viajes.values()].some((v) => this.esActivo(v.estado))) {
      throw new MockHttpError(409, 'VIAJE_ACTIVO_EXISTENTE', 'No puedes desconectarte con un viaje activo');
    }
    this.estadoConductor.set(req.estado);
    this.conductor = { ...this.conductor, estado: req.estado, ubicacionActual: req.ubicacion };
    this.disponibleDesde = Date.now();
    this.ofertaActual = null;
    return { conductorId: this.conductor.id, estado: req.estado, actualizadoEn: ahora() };
  }

  private resumenConductor(): ResumenConductorDto {
    const completadosHoy = this.historialConductor.filter(
      (v) => v.estado === 'FINALIZADO' && Date.now() - new Date(v.fecha).getTime() < 86400000,
    );
    const total = this.solicitudesRecibidas || 1;
    return {
      conductorId: this.conductor.id,
      estado: this.estadoConductor(),
      viajesHoy: completadosHoy.length,
      gananciasHoy: completadosHoy.reduce((s, v) => s + v.total, 0),
      gananciasSemana: this.historialConductor
        .filter((v) => v.estado === 'FINALIZADO')
        .reduce((s, v) => s + v.total, 0),
      horasEnLinea: Number((this.disponibleDesde ? (Date.now() - this.disponibleDesde) / 3600000 : 0).toFixed(2)),
      calificacionPromedio: this.conductor.calificacionPromedio,
      tasaAceptacion: Number(((total - this.solicitudesRechazadas) / total).toFixed(2)),
    };
  }

  // ============================================================
  // Viajes (HU-05, HU-06, HU-07, HU-10)
  // ============================================================
  private crearViaje(
    solicitud: SolicitudViajeDto,
    conductor: ConductorDto,
    autoAvance: boolean,
    nombrePasajero = `${this.pasajero.nombre} ${this.pasajero.apellido}`,
  ): ViajeDto {
    const origen: Coordenada = { lat: solicitud.origen.lat, lng: solicitud.origen.lng };
    const destino: Coordenada = { lat: solicitud.destino.lat, lng: solicitud.destino.lng };
    const ruta = generarRuta(origen, destino);
    const km = solicitud.tarifaEstimada.desglose.distanciaKm;
    const posConductor = conductor.ubicacionActual ?? CENTRO_CIUDAD;

    const viaje: ViajeDto = {
      id: uid('via'),
      solicitudId: solicitud.id,
      pasajero: {
        id: solicitud.pasajeroId,
        nombre: nombrePasajero,
        calificacionPromedio: this.pasajero.calificacionPromedio,
      },
      conductor: {
        id: conductor.id,
        nombre: `${conductor.nombre} ${conductor.apellido}`,
        calificacionPromedio: conductor.calificacionPromedio,
        telefono: conductor.telefono,
        vehiculo: conductor.vehiculo,
      },
      origen: solicitud.origen,
      destino: solicitud.destino,
      estado: 'CONDUCTOR_ASIGNADO',
      tarifa: solicitud.tarifaEstimada,
      metodoPago: solicitud.metodoPago,
      distanciaKm: km,
      duracionMin: solicitud.tarifaEstimada.desglose.duracionMin,
      ruta,
      ubicacionConductor: posConductor,
      etaMinutos: duracionMin(distanciaKm(posConductor, origen), 30),
      historial: [
        { estado: 'BUSCANDO_CONDUCTOR', ocurridoEn: solicitud.creadaEn, descripcion: 'Buscando conductor cercano' },
        { estado: 'CONDUCTOR_ASIGNADO', ocurridoEn: ahora(), descripcion: 'Conductor asignado al viaje' },
      ],
      creadoEn: ahora(),
    };
    this.viajes.set(viaje.id, viaje);
    this.fases.set(viaje.id, { desde: Date.now(), autoAvance, origenConductor: posConductor });
    return viaje;
  }

  private obtenerViaje(id: string): ViajeDto {
    const viaje = this.viajes.get(id);
    if (!viaje) throw new MockHttpError(404, 'VIAJE_NO_ENCONTRADO', `No existe el viaje ${id}`);
    this.avanzar(viaje);
    return viaje;
  }

  private viajeActivo(rol: string): ViajeDto | null {
    const viaje = [...this.viajes.values()].find((v) => this.esActivo(v.estado));
    if (!viaje) return null;
    void rol;
    this.avanzar(viaje);
    return viaje;
  }

  private esActivo(estado: EstadoViaje): boolean {
    return estado !== 'FINALIZADO' && estado !== 'CANCELADO';
  }

  /** Motor de simulación: mueve el viaje en el tiempo y recalcula la posición. */
  private avanzar(viaje: ViajeDto): void {
    const fase = this.fases.get(viaje.id);
    if (!fase || !this.esActivo(viaje.estado)) return;
    const t = Date.now() - fase.desde;
    const origen: Coordenada = { lat: viaje.origen.lat, lng: viaje.origen.lng };

    if (fase.autoAvance) {
      if (viaje.estado === 'CONDUCTOR_ASIGNADO' && t > 1500) {
        this.transicionar(viaje, 'CONDUCTOR_EN_CAMINO', 'El conductor va en camino al punto de recogida');
      } else if (viaje.estado === 'CONDUCTOR_EN_CAMINO' && t > FASE.EN_CAMINO) {
        this.transicionar(viaje, 'CONDUCTOR_LLEGO', 'El conductor llegó al punto de recogida');
      } else if (viaje.estado === 'CONDUCTOR_LLEGO' && t > FASE.ESPERA_EN_PUNTO) {
        this.transicionar(viaje, 'EN_CURSO', 'Viaje iniciado');
      } else if (viaje.estado === 'EN_CURSO' && t > FASE.EN_CURSO) {
        this.finalizar(viaje);
        return;
      }
    }

    const fase2 = this.fases.get(viaje.id)!;
    const t2 = Date.now() - fase2.desde;

    if (viaje.estado === 'CONDUCTOR_EN_CAMINO') {
      const p = Math.min(1, t2 / FASE.EN_CAMINO);
      viaje.ubicacionConductor = interpolar(fase2.origenConductor, origen, p);
      viaje.etaMinutos = Math.max(1, Math.round((1 - p) * duracionMin(
        distanciaKm(fase2.origenConductor, origen), 30,
      )));
    } else if (viaje.estado === 'CONDUCTOR_LLEGO') {
      viaje.ubicacionConductor = origen;
      viaje.etaMinutos = 0;
    } else if (viaje.estado === 'EN_CURSO') {
      const p = Math.min(1, t2 / FASE.EN_CURSO);
      viaje.ubicacionConductor = puntoEnRuta(viaje.ruta, p);
      viaje.etaMinutos = Math.max(1, Math.round((1 - p) * viaje.duracionMin));
    }
  }

  private transicionar(viaje: ViajeDto, estado: EstadoViaje, descripcion: string): void {
    viaje.estado = estado;
    viaje.historial.push({ estado, ocurridoEn: ahora(), descripcion });
    const fase = this.fases.get(viaje.id)!;
    this.fases.set(viaje.id, {
      ...fase,
      desde: Date.now(),
      origenConductor: viaje.ubicacionConductor ?? fase.origenConductor,
    });
  }

  private finalizar(viaje: ViajeDto): void {
    viaje.estado = 'FINALIZADO';
    viaje.finalizadoEn = ahora();
    viaje.ubicacionConductor = { lat: viaje.destino.lat, lng: viaje.destino.lng };
    viaje.etaMinutos = 0;
    viaje.historial.push({ estado: 'FINALIZADO', ocurridoEn: ahora(), descripcion: 'Viaje finalizado' });
    this.estadoConductor.set(this.estadoConductor() === 'OCUPADO' ? 'DISPONIBLE' : this.estadoConductor());
    this.registrarEnHistorial(viaje);
  }

  private registrarEnHistorial(viaje: ViajeDto): void {
    const base: ViajeHistorialDto = {
      id: viaje.id,
      fecha: viaje.finalizadoEn ?? ahora(),
      origen: viaje.origen.nombre,
      destino: viaje.destino.nombre,
      estado: viaje.estado,
      total: viaje.tarifa.total,
      contraparteNombre: viaje.conductor?.nombre ?? 'Conductor',
      categoria: viaje.tarifa.categoria,
    };
    this.historialPasajero = [base, ...this.historialPasajero.filter((v) => v.id !== viaje.id)];
    this.historialConductor = [
      { ...base, contraparteNombre: viaje.pasajero.nombre },
      ...this.historialConductor.filter((v) => v.id !== viaje.id),
    ];
  }

  private ubicacionConductor(viajeId: string): UbicacionConductorResponseDto {
    const viaje = this.obtenerViaje(viajeId);
    if (!viaje.ubicacionConductor) {
      throw new MockHttpError(409, 'SIN_CONDUCTOR_ASIGNADO', 'El viaje todavía no tiene conductor');
    }
    return {
      viajeId,
      ubicacion: viaje.ubicacionConductor,
      etaMinutos: viaje.etaMinutos ?? 0,
      estado: viaje.estado,
      actualizadoEn: ahora(),
    };
  }

  private cambiarEstadoViaje(id: string, req: CambiarEstadoViajeRequestDto): ViajeDto {
    const viaje = this.obtenerViaje(id);
    const transiciones: Record<CambiarEstadoViajeRequestDto['accion'], [EstadoViaje[], EstadoViaje, string]> = {
      CONFIRMAR_LLEGADA: [['CONDUCTOR_ASIGNADO', 'CONDUCTOR_EN_CAMINO'], 'CONDUCTOR_LLEGO', 'El conductor llegó al punto de recogida'],
      INICIAR_VIAJE: [['CONDUCTOR_LLEGO'], 'EN_CURSO', 'Viaje iniciado'],
      FINALIZAR_VIAJE: [['EN_CURSO'], 'FINALIZADO', 'Viaje finalizado'],
    };
    const [permitidos, destino, descripcion] = transiciones[req.accion];
    if (!permitidos.includes(viaje.estado)) {
      throw new MockHttpError(
        409,
        'TRANSICION_INVALIDA',
        `No se puede aplicar ${req.accion} sobre un viaje en estado ${viaje.estado}`,
      );
    }
    if (destino === 'FINALIZADO') {
      this.finalizar(viaje);
    } else {
      this.transicionar(viaje, destino, descripcion);
    }
    return viaje;
  }

  /** HU-10: cancelación con política de penalización. */
  private cancelarViaje(id: string, req: CancelarViajeRequestDto): CancelacionResponseDto {
    const viaje = this.obtenerViaje(id);
    if (!this.esActivo(viaje.estado)) {
      throw new MockHttpError(409, 'VIAJE_NO_CANCELABLE', 'El viaje ya finalizó o fue cancelado');
    }
    if (viaje.estado === 'EN_CURSO') {
      throw new MockHttpError(409, 'VIAJE_NO_CANCELABLE', 'No puedes cancelar un viaje en curso');
    }
    const penalizacion = viaje.estado === 'CONDUCTOR_LLEGO' ? 3000 : 0;
    viaje.estado = 'CANCELADO';
    viaje.motivoCancelacion = req.motivo;
    viaje.canceladoPor = 'PASAJERO';
    viaje.finalizadoEn = ahora();
    viaje.historial.push({ estado: 'CANCELADO', ocurridoEn: ahora(), descripcion: 'Viaje cancelado' });
    if (this.estadoConductor() === 'OCUPADO') this.estadoConductor.set('DISPONIBLE');
    this.registrarEnHistorial(viaje);
    return {
      viajeId: id,
      estado: 'CANCELADO',
      penalizacion,
      mensaje: penalizacion
        ? 'Se aplicó una tarifa de cancelación porque el conductor ya estaba en el punto.'
        : 'Viaje cancelado sin costo.',
    };
  }

  // ============================================================
  // Calificaciones (HU-08) e historial (HU-09)
  // ============================================================
  private calificar(viajeId: string, req: CrearCalificacionRequestDto, rol: string): CalificacionDto {
    const viaje = this.viajes.get(viajeId);
    if (!viaje) throw new MockHttpError(404, 'VIAJE_NO_ENCONTRADO', `No existe el viaje ${viajeId}`);
    if (viaje.estado !== 'FINALIZADO') {
      throw new MockHttpError(409, 'VIAJE_NO_CALIFICABLE', 'Solo se pueden calificar viajes finalizados');
    }
    if (viaje.calificacion) {
      throw new MockHttpError(409, 'CALIFICACION_DUPLICADA', 'Este viaje ya fue calificado');
    }
    if (req.puntuacion < 1 || req.puntuacion > 5) {
      throw new MockHttpError(422, 'PUNTUACION_INVALIDA', 'La puntuación debe estar entre 1 y 5');
    }
    const esPasajero = rol !== 'CONDUCTOR';
    const calificacion: CalificacionDto = {
      id: uid('cal'),
      viajeId,
      deUsuarioId: esPasajero ? viaje.pasajero.id : (viaje.conductor?.id ?? 'con'),
      paraUsuarioId: esPasajero ? (viaje.conductor?.id ?? 'con') : viaje.pasajero.id,
      puntuacion: req.puntuacion,
      etiquetas: req.etiquetas ?? [],
      comentario: req.comentario,
      creadaEn: ahora(),
    };
    viaje.calificacion = calificacion;
    this.calificaciones.push(calificacion);
    const lista = esPasajero ? this.historialPasajero : this.historialConductor;
    const item = lista.find((v) => v.id === viajeId);
    if (item) item.calificacionOtorgada = req.puntuacion;
    return calificacion;
  }

  private historial(rol: string, page: number): PageDto<ViajeHistorialDto> {
    const fuente = rol === 'CONDUCTOR' ? this.historialConductor : this.historialPasajero;
    const size = 10;
    const content = fuente.slice(page * size, page * size + size);
    return {
      content,
      page,
      size,
      totalElements: fuente.length,
      totalPages: Math.max(1, Math.ceil(fuente.length / size)),
      last: (page + 1) * size >= fuente.length,
    };
  }
}
