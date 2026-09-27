/**
 * Traducción DTO (contrato HTTP) <-> Modelo de dominio (frontend).
 * Si el backend cambia el contrato, solo se tocan estos mappers.
 */
import {
  CalificacionDto,
  ConductorDto,
  LugarDto,
  OfertaViajeDto,
  PasajeroDto,
  ResumenConductorDto,
  SolicitudViajeDto,
  TarifaDto,
  UsuarioDto,
  ViajeDto,
  ViajeHistorialDto,
} from '../dto/api.dto';
import {
  Calificacion,
  Conductor,
  Lugar,
  OfertaViaje,
  Pasajero,
  ResumenConductor,
  ResumenViajeHistorial,
  SolicitudViaje,
  Tarifa,
  Usuario,
  Viaje,
} from '../domain/models';

export const toLugar = (dto: LugarDto): Lugar => ({
  id: dto.id,
  nombre: dto.nombre,
  direccion: dto.direccion,
  coordenada: { lat: dto.lat, lng: dto.lng },
  tipo: dto.tipo as Lugar['tipo'],
});

export const fromLugar = (lugar: Lugar): LugarDto => ({
  id: lugar.id,
  nombre: lugar.nombre,
  direccion: lugar.direccion,
  lat: lugar.coordenada.lat,
  lng: lugar.coordenada.lng,
  tipo: lugar.tipo,
});

export const toTarifa = (dto: TarifaDto): Tarifa => ({
  moneda: dto.moneda,
  total: dto.total,
  minimoEstimado: dto.minimoEstimado,
  maximoEstimado: dto.maximoEstimado,
  categoria: dto.categoria,
  calculadaEn: dto.calculadaEn,
  desglose: { ...dto.desglose },
});

export const toUsuario = (dto: UsuarioDto): Usuario => ({ ...dto });

export const toPasajero = (dto: PasajeroDto): Pasajero => ({
  ...dto,
  rol: 'PASAJERO',
  lugaresFavoritos: dto.lugaresFavoritos.map(toLugar),
});

export const toConductor = (dto: ConductorDto): Conductor => ({
  ...dto,
  rol: 'CONDUCTOR',
  vehiculo: { ...dto.vehiculo, id: dto.vehiculo.id ?? dto.id },
});

export const toResumenConductor = (dto: ResumenConductorDto): ResumenConductor => ({
  conductorId: dto.conductorId,
  estado: dto.estado,
  viajesHoy: dto.viajesHoy,
  gananciasHoy: { monto: dto.gananciasHoy, moneda: 'COP' },
  gananciasSemana: { monto: dto.gananciasSemana, moneda: 'COP' },
  horasEnLinea: dto.horasEnLinea,
  calificacionPromedio: dto.calificacionPromedio,
  tasaAceptacion: dto.tasaAceptacion,
});

export const toSolicitud = (dto: SolicitudViajeDto): SolicitudViaje => ({
  ...dto,
  origen: toLugar(dto.origen),
  destino: toLugar(dto.destino),
  tarifaEstimada: toTarifa(dto.tarifaEstimada),
});

export const toOferta = (dto: OfertaViajeDto): OfertaViaje => ({
  ...dto,
  origen: toLugar(dto.origen),
  destino: toLugar(dto.destino),
  tarifa: toTarifa(dto.tarifa),
});

export const toCalificacion = (dto: CalificacionDto): Calificacion => ({ ...dto });

export const toViaje = (dto: ViajeDto): Viaje => ({
  id: dto.id,
  solicitudId: dto.solicitudId,
  pasajero: dto.pasajero,
  conductor: dto.conductor
    ? {
        id: dto.conductor.id,
        nombre: dto.conductor.nombre,
        fotoUrl: dto.conductor.fotoUrl,
        calificacionPromedio: dto.conductor.calificacionPromedio,
        telefono: dto.conductor.telefono,
        vehiculo: { ...dto.conductor.vehiculo, id: dto.conductor.vehiculo.id ?? dto.conductor.id },
      }
    : undefined,
  origen: toLugar(dto.origen),
  destino: toLugar(dto.destino),
  estado: dto.estado,
  tarifa: toTarifa(dto.tarifa),
  metodoPago: dto.metodoPago,
  distanciaKm: dto.distanciaKm,
  duracionMin: dto.duracionMin,
  ruta: dto.ruta,
  ubicacionConductor: dto.ubicacionConductor,
  etaMinutos: dto.etaMinutos,
  historial: dto.historial,
  creadoEn: dto.creadoEn,
  finalizadoEn: dto.finalizadoEn,
  motivoCancelacion: dto.motivoCancelacion,
  canceladoPor: dto.canceladoPor,
  calificacion: dto.calificacion ? toCalificacion(dto.calificacion) : undefined,
});

export const toHistorial = (dto: ViajeHistorialDto): ResumenViajeHistorial => ({
  id: dto.id,
  fecha: dto.fecha,
  origen: dto.origen,
  destino: dto.destino,
  estado: dto.estado,
  total: { monto: dto.total, moneda: 'COP' },
  contraparteNombre: dto.contraparteNombre,
  contraparteFotoUrl: dto.contraparteFotoUrl,
  calificacionOtorgada: dto.calificacionOtorgada,
  categoria: dto.categoria,
});
