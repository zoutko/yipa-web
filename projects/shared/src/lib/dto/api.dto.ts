/**
 * DTOs de frontend: contrato exacto (JSON) intercambiado con la API
 * Java Spring Boot. Todo lo que entra/sale por HttpClient usa estos tipos.
 *
 * Convenciones acordadas con backend:
 *  - Fechas en ISO-8601 UTC (`2026-01-31T14:05:00Z`).
 *  - Dinero como número entero en COP (sin decimales).
 *  - Enumerados en MAYÚSCULAS_SNAKE.
 *  - Errores con el formato `ApiErrorDto` (RFC 7807 simplificado).
 */

import {
  CategoriaVehiculo,
  Coordenada,
  EstadoConductor,
  EstadoSolicitud,
  EstadoViaje,
  MetodoPago,
  MotivoCancelacion,
  RolUsuario,
} from '../domain/models';

// ============================================================
// Envolturas genéricas
// ============================================================

export interface ApiErrorDto {
  timestamp: string;
  status: number;
  /** Código de negocio estable, p. ej. `VIAJE_NO_CANCELABLE`. */
  code: string;
  message: string;
  path: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export interface PageDto<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ============================================================
// Identidad / Autenticación
// ============================================================

export interface LoginRequestDto {
  email: string;
  password: string;
  rol: RolUsuario;
}

export interface RegistroPasajeroRequestDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
}

export interface RegistroConductorRequestDto extends RegistroPasajeroRequestDto {
  licencia: string;
  vehiculo: VehiculoDto;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuario: UsuarioDto;
}

export interface UsuarioDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: RolUsuario;
  fotoUrl?: string;
  calificacionPromedio: number;
  fechaRegistro: string;
}

export interface PasajeroDto extends UsuarioDto {
  metodoPagoPreferido: MetodoPago;
  lugaresFavoritos: LugarDto[];
  viajesRealizados: number;
}

export interface ConductorDto extends UsuarioDto {
  estado: EstadoConductor;
  licencia: string;
  vehiculo: VehiculoDto;
  ubicacionActual?: CoordenadaDto;
  viajesCompletados: number;
  documentosVerificados: boolean;
}

export interface ActualizarPerfilRequestDto {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fotoUrl?: string;
  metodoPagoPreferido?: MetodoPago;
}

// ============================================================
// Geografía
// ============================================================

export type CoordenadaDto = Coordenada;

export interface LugarDto {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  tipo?: string;
}

// ============================================================
// Conductores
// ============================================================

export interface VehiculoDto {
  id?: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anio: number;
  categoria: CategoriaVehiculo;
  capacidad: number;
}

export interface DisponibilidadRequestDto {
  estado: Extract<EstadoConductor, 'DISPONIBLE' | 'DESCONECTADO'>;
  ubicacion: CoordenadaDto;
}

export interface DisponibilidadResponseDto {
  conductorId: string;
  estado: EstadoConductor;
  actualizadoEn: string;
}

export interface UbicacionRequestDto {
  lat: number;
  lng: number;
  rumbo?: number;
  velocidadKmh?: number;
  registradoEn: string;
}

export interface ResumenConductorDto {
  conductorId: string;
  estado: EstadoConductor;
  viajesHoy: number;
  gananciasHoy: number;
  gananciasSemana: number;
  horasEnLinea: number;
  calificacionPromedio: number;
  tasaAceptacion: number;
}

// ============================================================
// Tarifas
// ============================================================

export interface EstimacionTarifaRequestDto {
  origen: CoordenadaDto;
  destino: CoordenadaDto;
  categoria?: CategoriaVehiculo;
}

export interface TarifaDto {
  moneda: 'COP';
  total: number;
  minimoEstimado?: number;
  maximoEstimado?: number;
  categoria: CategoriaVehiculo;
  calculadaEn: string;
  desglose: {
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
  };
}

export interface EstimacionTarifaResponseDto {
  distanciaKm: number;
  duracionMin: number;
  opciones: Array<{
    categoria: CategoriaVehiculo;
    nombre: string;
    descripcion: string;
    capacidad: number;
    icono: string;
    etaMinutos: number;
    tarifa: TarifaDto;
  }>;
}

// ============================================================
// Emparejamiento
// ============================================================

export interface CrearSolicitudRequestDto {
  origen: LugarDto;
  destino: LugarDto;
  categoria: CategoriaVehiculo;
  metodoPago: MetodoPago;
  notaParaConductor?: string;
}

export interface SolicitudViajeDto {
  id: string;
  pasajeroId: string;
  origen: LugarDto;
  destino: LugarDto;
  categoria: CategoriaVehiculo;
  metodoPago: MetodoPago;
  notaParaConductor?: string;
  estado: EstadoSolicitud;
  tarifaEstimada: TarifaDto;
  creadaEn: string;
  conductorCandidatoId?: string;
  expiraEnSegundos?: number;
  viajeId?: string;
}

export interface OfertaViajeDto {
  solicitudId: string;
  pasajero: { id: string; nombre: string; fotoUrl?: string; calificacionPromedio: number };
  origen: LugarDto;
  destino: LugarDto;
  distanciaHastaOrigenKm: number;
  minutosHastaOrigen: number;
  distanciaViajeKm: number;
  duracionViajeMin: number;
  tarifa: TarifaDto;
  metodoPago: MetodoPago;
  expiraEnSegundos: number;
}

export interface RechazarSolicitudRequestDto {
  motivo?: 'MUY_LEJOS' | 'FIN_DE_TURNO' | 'DESTINO_NO_CONVIENE' | 'OTRO';
}

// ============================================================
// Viajes
// ============================================================

export interface ViajeDto {
  id: string;
  solicitudId: string;
  pasajero: { id: string; nombre: string; fotoUrl?: string; calificacionPromedio: number };
  conductor?: {
    id: string;
    nombre: string;
    fotoUrl?: string;
    calificacionPromedio: number;
    telefono: string;
    vehiculo: VehiculoDto;
  };
  origen: LugarDto;
  destino: LugarDto;
  estado: EstadoViaje;
  tarifa: TarifaDto;
  metodoPago: MetodoPago;
  distanciaKm: number;
  duracionMin: number;
  ruta: CoordenadaDto[];
  ubicacionConductor?: CoordenadaDto;
  etaMinutos?: number;
  historial: Array<{ estado: EstadoViaje; ocurridoEn: string; descripcion: string }>;
  creadoEn: string;
  finalizadoEn?: string;
  motivoCancelacion?: string;
  canceladoPor?: RolUsuario;
  calificacion?: CalificacionDto;
}

export interface ViajeHistorialDto {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  estado: EstadoViaje;
  total: number;
  contraparteNombre: string;
  contraparteFotoUrl?: string;
  calificacionOtorgada?: number;
  categoria: CategoriaVehiculo;
}

export interface CambiarEstadoViajeRequestDto {
  /** Transición solicitada por el conductor. */
  accion: 'CONFIRMAR_LLEGADA' | 'INICIAR_VIAJE' | 'FINALIZAR_VIAJE';
  ubicacion?: CoordenadaDto;
}

export interface CancelarViajeRequestDto {
  motivo: MotivoCancelacion;
  comentario?: string;
}

export interface CancelacionResponseDto {
  viajeId: string;
  estado: EstadoViaje;
  penalizacion: number;
  mensaje: string;
}

export interface UbicacionConductorResponseDto {
  viajeId: string;
  ubicacion: CoordenadaDto;
  etaMinutos: number;
  estado: EstadoViaje;
  actualizadoEn: string;
}

// ============================================================
// Calificaciones
// ============================================================

export interface CrearCalificacionRequestDto {
  puntuacion: 1 | 2 | 3 | 4 | 5;
  etiquetas?: string[];
  comentario?: string;
}

export interface CalificacionDto {
  id: string;
  viajeId: string;
  deUsuarioId: string;
  paraUsuarioId: string;
  puntuacion: 1 | 2 | 3 | 4 | 5;
  etiquetas: string[];
  comentario?: string;
  creadaEn: string;
}
