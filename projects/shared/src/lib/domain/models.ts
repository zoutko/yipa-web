/**
 * Modelos de dominio del frontend YIPA.
 *
 * Estos tipos representan el lenguaje ubicuo compartido con el backend
 * (Java Spring Boot, DDD + Arquitectura Hexagonal). Cada grupo se corresponde
 * con un Bounded Context:
 *
 *  - Pasajeros      -> Pasajero, PerfilUsuario
 *  - Conductores    -> Conductor, Vehiculo, EstadoConductor
 *  - Emparejamiento -> SolicitudViaje, OfertaViaje
 *  - Viajes         -> Viaje, EstadoViaje, EventoViaje
 *  - Tarifas        -> Tarifa, DesgloseTarifa
 *  - Calificaciones -> Calificacion
 *
 * Regla: los modelos de dominio NO se serializan directamente hacia la API.
 * La traducción DTO <-> dominio vive en `lib/mappers`.
 */

// ============================================================
// Value objects comunes
// ============================================================

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Lugar {
  id: string;
  /** Nombre corto mostrado en la UI: "Casa", "Plaza de Bolívar". */
  nombre: string;
  direccion: string;
  coordenada: Coordenada;
  /** Etiqueta de favorito del pasajero, si aplica. */
  tipo?: 'casa' | 'trabajo' | 'favorito' | 'reciente' | 'busqueda';
}

export interface Dinero {
  monto: number;
  moneda: 'COP';
}

export type RolUsuario = 'PASAJERO' | 'CONDUCTOR';

// ============================================================
// Bounded Context: Pasajeros / Identidad
// ============================================================

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: RolUsuario;
  fotoUrl?: string;
  calificacionPromedio: number;
  fechaRegistro: string; // ISO-8601
}

export interface Pasajero extends Usuario {
  rol: 'PASAJERO';
  metodoPagoPreferido: MetodoPago;
  lugaresFavoritos: Lugar[];
  viajesRealizados: number;
}

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'BILLETERA';

// ============================================================
// Bounded Context: Conductores
// ============================================================

export type EstadoConductor = 'DESCONECTADO' | 'DISPONIBLE' | 'OCUPADO';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anio: number;
  categoria: CategoriaVehiculo;
  capacidad: number;
}

export type CategoriaVehiculo = 'YIPA_X' | 'YIPA_XL' | 'YIPA_MOTO';

export interface Conductor extends Usuario {
  rol: 'CONDUCTOR';
  estado: EstadoConductor;
  vehiculo: Vehiculo;
  licencia: string;
  ubicacionActual?: Coordenada;
  viajesCompletados: number;
  documentosVerificados: boolean;
}

/** Resumen operativo mostrado en el dashboard del conductor. */
export interface ResumenConductor {
  conductorId: string;
  estado: EstadoConductor;
  viajesHoy: number;
  gananciasHoy: Dinero;
  gananciasSemana: Dinero;
  horasEnLinea: number;
  calificacionPromedio: number;
  tasaAceptacion: number; // 0..1
}

// ============================================================
// Bounded Context: Emparejamiento
// ============================================================

export type EstadoSolicitud =
  | 'BUSCANDO'
  | 'OFRECIDA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'EXPIRADA'
  | 'CANCELADA'
  | 'SIN_CONDUCTORES';

/** Solicitud creada por el pasajero (HU-01) y procesada por emparejamiento (HU-03). */
export interface SolicitudViaje {
  id: string;
  pasajeroId: string;
  origen: Lugar;
  destino: Lugar;
  categoria: CategoriaVehiculo;
  metodoPago: MetodoPago;
  notaParaConductor?: string;
  estado: EstadoSolicitud;
  tarifaEstimada: Tarifa;
  creadaEn: string;
  /** Conductor al que se está ofreciendo actualmente la solicitud. */
  conductorCandidatoId?: string;
  /** Segundos restantes para que el conductor acepte (HU-04). */
  expiraEnSegundos?: number;
  viajeId?: string;
}

/** Vista de la solicitud tal y como la ve el conductor (HU-04). */
export interface OfertaViaje {
  solicitudId: string;
  pasajero: ResumenPasajero;
  origen: Lugar;
  destino: Lugar;
  distanciaHastaOrigenKm: number;
  minutosHastaOrigen: number;
  distanciaViajeKm: number;
  duracionViajeMin: number;
  tarifa: Tarifa;
  metodoPago: MetodoPago;
  expiraEnSegundos: number;
}

export interface ResumenPasajero {
  id: string;
  nombre: string;
  fotoUrl?: string;
  calificacionPromedio: number;
}

export interface ResumenConductorAsignado {
  id: string;
  nombre: string;
  fotoUrl?: string;
  calificacionPromedio: number;
  vehiculo: Vehiculo;
  telefono: string;
}

// ============================================================
// Bounded Context: Viajes
// ============================================================

export type EstadoViaje =
  | 'BUSCANDO_CONDUCTOR'
  | 'CONDUCTOR_ASIGNADO'
  | 'CONDUCTOR_EN_CAMINO'
  | 'CONDUCTOR_LLEGO'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'CANCELADO';

export interface EventoViaje {
  estado: EstadoViaje;
  ocurridoEn: string;
  descripcion: string;
}

export interface Viaje {
  id: string;
  solicitudId: string;
  pasajero: ResumenPasajero;
  conductor?: ResumenConductorAsignado;
  origen: Lugar;
  destino: Lugar;
  estado: EstadoViaje;
  tarifa: Tarifa;
  metodoPago: MetodoPago;
  distanciaKm: number;
  duracionMin: number;
  /** Ruta simulada (polilínea) usada por el mapa. */
  ruta: Coordenada[];
  ubicacionConductor?: Coordenada;
  /** Minutos estimados para que el conductor llegue al origen o al destino. */
  etaMinutos?: number;
  historial: EventoViaje[];
  creadoEn: string;
  finalizadoEn?: string;
  calificacion?: Calificacion;
  motivoCancelacion?: string;
  canceladoPor?: RolUsuario;
}

export interface ResumenViajeHistorial {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  estado: EstadoViaje;
  total: Dinero;
  contraparteNombre: string;
  contraparteFotoUrl?: string;
  calificacionOtorgada?: number;
  categoria: CategoriaVehiculo;
}

export type MotivoCancelacion =
  | 'DEMORA_EXCESIVA'
  | 'CAMBIO_DE_PLANES'
  | 'CONDUCTOR_NO_LLEGA'
  | 'PASAJERO_NO_APARECE'
  | 'ERROR_EN_DIRECCION'
  | 'OTRO';

// ============================================================
// Bounded Context: Tarifas
// ============================================================

export interface DesgloseTarifa {
  tarifaBase: number;
  costoPorKm: number;
  costoPorMinuto: number;
  distanciaKm: number;
  duracionMin: number;
  subtotal: number;
  multiplicadorDemanda: number;
  recargoDemanda: number;
  descuento: number;
  total: number;
}

export interface Tarifa {
  moneda: 'COP';
  total: number;
  /** Rango mostrado antes de confirmar (estimación). */
  minimoEstimado?: number;
  maximoEstimado?: number;
  desglose: DesgloseTarifa;
  categoria: CategoriaVehiculo;
  calculadaEn: string;
}

// ============================================================
// Bounded Context: Calificaciones
// ============================================================

export interface Calificacion {
  id: string;
  viajeId: string;
  deUsuarioId: string;
  paraUsuarioId: string;
  puntuacion: 1 | 2 | 3 | 4 | 5;
  etiquetas: string[];
  comentario?: string;
  creadaEn: string;
}

// ============================================================
// Tipos de apoyo para la UI
// ============================================================

export interface OpcionCategoria {
  categoria: CategoriaVehiculo;
  nombre: string;
  descripcion: string;
  capacidad: number;
  icono: string;
  etaMinutos: number;
  tarifa: Tarifa;
}

export interface SesionUsuario {
  token: string;
  refreshToken: string;
  expiraEn: number;
  usuario: Usuario;
}
