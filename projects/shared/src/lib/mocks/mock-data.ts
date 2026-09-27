/**
 * Datos semilla para el modo mock (desarrollo académico sin backend).
 * Ciudad base: Armenia, Quindío — cuna del Yipao.
 */
import {
  CategoriaVehiculo,
  Coordenada,
  EstadoViaje,
  MetodoPago,
} from '../domain/models';
import {
  CalificacionDto,
  ConductorDto,
  LugarDto,
  PasajeroDto,
  VehiculoDto,
  ViajeHistorialDto,
} from '../dto/api.dto';

export const CENTRO_CIUDAD: Coordenada = { lat: 4.5339, lng: -75.6811 };

export const LUGARES: LugarDto[] = [
  {
    id: 'lug-1',
    nombre: 'Casa',
    direccion: 'Cra. 14 #12-45, Armenia',
    lat: 4.5401,
    lng: -75.6702,
    tipo: 'casa',
  },
  {
    id: 'lug-2',
    nombre: 'Universidad del Quindío',
    direccion: 'Cra. 15 Calle 12 Norte, Armenia',
    lat: 4.5556,
    lng: -75.6603,
    tipo: 'favorito',
  },
  {
    id: 'lug-3',
    nombre: 'Centro Comercial Unicentro',
    direccion: 'Av. Bolívar #4N-20, Armenia',
    lat: 4.5482,
    lng: -75.6662,
    tipo: 'reciente',
  },
  {
    id: 'lug-4',
    nombre: 'Aeropuerto El Edén',
    direccion: 'Vía La Tebaida, Armenia',
    lat: 4.4528,
    lng: -75.7664,
    tipo: 'reciente',
  },
  {
    id: 'lug-5',
    nombre: 'Parque de la Vida',
    direccion: 'Cra. 14 #1N-49, Armenia',
    lat: 4.5459,
    lng: -75.6735,
    tipo: 'favorito',
  },
  {
    id: 'lug-6',
    nombre: 'Trabajo — Centro de Convenciones',
    direccion: 'Cra. 13 #5-53, Armenia',
    lat: 4.5372,
    lng: -75.6768,
    tipo: 'trabajo',
  },
  {
    id: 'lug-7',
    nombre: 'Terminal de Transportes',
    direccion: 'Cra. 19 #35-05, Armenia',
    lat: 4.5219,
    lng: -75.6864,
    tipo: 'reciente',
  },
  {
    id: 'lug-8',
    nombre: 'Plaza de Bolívar',
    direccion: 'Cl. 20 #14-30, Armenia',
    lat: 4.5346,
    lng: -75.6807,
    tipo: 'busqueda',
  },
  {
    id: 'lug-9',
    nombre: 'Hospital San Juan de Dios',
    direccion: 'Cl. 17N #15-50, Armenia',
    lat: 4.5512,
    lng: -75.6669,
    tipo: 'busqueda',
  },
  {
    id: 'lug-10',
    nombre: 'Estadio Centenario',
    direccion: 'Cra. 19 #12-30, Armenia',
    lat: 4.5298,
    lng: -75.6899,
    tipo: 'busqueda',
  },
];

export const VEHICULOS: VehiculoDto[] = [
  {
    id: 'veh-1',
    placa: 'WGT-482',
    marca: 'Willys',
    modelo: 'Jeep CJ-3B',
    color: 'Amarillo',
    anio: 2019,
    categoria: 'YIPA_X',
    capacidad: 4,
  },
  {
    id: 'veh-2',
    placa: 'KLM-119',
    marca: 'Toyota',
    modelo: 'Land Cruiser',
    color: 'Blanco',
    anio: 2021,
    categoria: 'YIPA_XL',
    capacidad: 6,
  },
  {
    id: 'veh-3',
    placa: 'JUP-77C',
    marca: 'Yamaha',
    modelo: 'NMAX',
    color: 'Negro',
    anio: 2022,
    categoria: 'YIPA_MOTO',
    capacidad: 1,
  },
];

export const PASAJERO_DEMO: PasajeroDto = {
  id: 'pas-001',
  nombre: 'Valentina',
  apellido: 'Ramírez',
  email: 'pasajero@yipa.co',
  telefono: '+57 310 555 1180',
  rol: 'PASAJERO',
  calificacionPromedio: 4.9,
  fechaRegistro: '2025-03-12T10:20:00Z',
  metodoPagoPreferido: 'TARJETA',
  lugaresFavoritos: LUGARES.filter((l) => ['casa', 'trabajo', 'favorito'].includes(l.tipo ?? '')),
  viajesRealizados: 68,
};

export const CONDUCTOR_DEMO: ConductorDto = {
  id: 'con-001',
  nombre: 'Andrés',
  apellido: 'Gutiérrez',
  email: 'conductor@yipa.co',
  telefono: '+57 320 441 9033',
  rol: 'CONDUCTOR',
  calificacionPromedio: 4.92,
  fechaRegistro: '2024-11-02T08:00:00Z',
  estado: 'DESCONECTADO',
  licencia: 'C2-884512',
  vehiculo: VEHICULOS[0],
  ubicacionActual: { lat: 4.5368, lng: -75.6784 },
  viajesCompletados: 1342,
  documentosVerificados: true,
};

/** Conductores disponibles usados por el motor de emparejamiento simulado. */
export const CONDUCTORES_CERCANOS: ConductorDto[] = [
  CONDUCTOR_DEMO,
  {
    ...CONDUCTOR_DEMO,
    id: 'con-002',
    nombre: 'Marcela',
    apellido: 'Osorio',
    telefono: '+57 311 902 7744',
    calificacionPromedio: 4.87,
    vehiculo: VEHICULOS[1],
    ubicacionActual: { lat: 4.5412, lng: -75.6741 },
    viajesCompletados: 890,
  },
  {
    ...CONDUCTOR_DEMO,
    id: 'con-003',
    nombre: 'Julián',
    apellido: 'Cardona',
    telefono: '+57 318 663 2210',
    calificacionPromedio: 4.78,
    vehiculo: VEHICULOS[2],
    ubicacionActual: { lat: 4.5305, lng: -75.6858 },
    viajesCompletados: 412,
  },
];

export interface CatalogoCategoria {
  categoria: CategoriaVehiculo;
  nombre: string;
  descripcion: string;
  capacidad: number;
  icono: string;
  etaMinutos: number;
  tarifaBase: number;
  costoPorKm: number;
  costoPorMinuto: number;
  multiplicador: number;
}

export const CATALOGO_CATEGORIAS: CatalogoCategoria[] = [
  {
    categoria: 'YIPA_X',
    nombre: 'YIPA X',
    descripcion: 'Jeep clásico, hasta 4 personas',
    capacidad: 4,
    icono: '🚙',
    etaMinutos: 4,
    tarifaBase: 3800,
    costoPorKm: 1450,
    costoPorMinuto: 210,
    multiplicador: 1,
  },
  {
    categoria: 'YIPA_XL',
    nombre: 'YIPA XL',
    descripcion: 'Espacio para 6 y equipaje',
    capacidad: 6,
    icono: '🚐',
    etaMinutos: 7,
    tarifaBase: 5200,
    costoPorKm: 1980,
    costoPorMinuto: 280,
    multiplicador: 1,
  },
  {
    categoria: 'YIPA_MOTO',
    nombre: 'YIPA Moto',
    descripcion: 'Lo más rápido y económico',
    capacidad: 1,
    icono: '🛵',
    etaMinutos: 2,
    tarifaBase: 2400,
    costoPorKm: 900,
    costoPorMinuto: 140,
    multiplicador: 1,
  },
];

export const ETIQUETAS_CALIFICACION = [
  'Conducción segura',
  'Vehículo limpio',
  'Muy amable',
  'Puntual',
  'Buena música',
  'Excelente ruta',
];

export const MOTIVOS_CANCELACION: Array<{ codigo: string; etiqueta: string }> = [
  { codigo: 'DEMORA_EXCESIVA', etiqueta: 'El conductor se demora mucho' },
  { codigo: 'CAMBIO_DE_PLANES', etiqueta: 'Cambié de planes' },
  { codigo: 'CONDUCTOR_NO_LLEGA', etiqueta: 'El conductor no llega al punto' },
  { codigo: 'ERROR_EN_DIRECCION', etiqueta: 'Puse mal la dirección' },
  { codigo: 'OTRO', etiqueta: 'Otro motivo' },
];

const hace = (dias: number, horas = 0): string =>
  new Date(Date.now() - dias * 86400000 - horas * 3600000).toISOString();

const historial = (
  id: string,
  dias: number,
  origen: string,
  destino: string,
  total: number,
  estado: EstadoViaje,
  contraparteNombre: string,
  categoria: CategoriaVehiculo,
  calificacionOtorgada?: number,
): ViajeHistorialDto => ({
  id,
  fecha: hace(dias),
  origen,
  destino,
  estado,
  total,
  contraparteNombre,
  categoria,
  calificacionOtorgada,
});

export const HISTORIAL_PASAJERO: ViajeHistorialDto[] = [
  historial('via-901', 1, 'Casa', 'Universidad del Quindío', 14200, 'FINALIZADO', 'Andrés G.', 'YIPA_X', 5),
  historial('via-902', 2, 'Unicentro', 'Casa', 11800, 'FINALIZADO', 'Marcela O.', 'YIPA_XL', 4),
  historial('via-903', 4, 'Casa', 'Aeropuerto El Edén', 48600, 'FINALIZADO', 'Julián C.', 'YIPA_X', 5),
  historial('via-904', 6, 'Plaza de Bolívar', 'Parque de la Vida', 9200, 'CANCELADO', 'Andrés G.', 'YIPA_MOTO'),
  historial('via-905', 9, 'Terminal', 'Centro de Convenciones', 10400, 'FINALIZADO', 'Marcela O.', 'YIPA_X', 5),
  historial('via-906', 13, 'Hospital San Juan', 'Casa', 12750, 'FINALIZADO', 'Julián C.', 'YIPA_X', 4),
];

export const HISTORIAL_CONDUCTOR: ViajeHistorialDto[] = [
  historial('via-801', 0, 'Plaza de Bolívar', 'Unicentro', 13400, 'FINALIZADO', 'Valentina R.', 'YIPA_X', 5),
  historial('via-802', 0, 'Estadio Centenario', 'Casa', 9800, 'FINALIZADO', 'Camilo S.', 'YIPA_X', 5),
  historial('via-803', 1, 'Terminal', 'Aeropuerto El Edén', 52300, 'FINALIZADO', 'Laura M.', 'YIPA_XL', 4),
  historial('via-804', 2, 'Universidad', 'Parque de la Vida', 8600, 'CANCELADO', 'Diego T.', 'YIPA_X'),
  historial('via-805', 3, 'Casa', 'Hospital San Juan', 11200, 'FINALIZADO', 'Sara P.', 'YIPA_X', 5),
];

export const CALIFICACIONES_RECIBIDAS: CalificacionDto[] = [
  {
    id: 'cal-1',
    viajeId: 'via-801',
    deUsuarioId: 'pas-001',
    paraUsuarioId: 'con-001',
    puntuacion: 5,
    etiquetas: ['Conducción segura', 'Muy amable'],
    comentario: 'Excelente servicio, muy puntual.',
    creadaEn: hace(0, 3),
  },
];

export const METODOS_PAGO: Array<{ codigo: MetodoPago; etiqueta: string; detalle: string; icono: string }> = [
  { codigo: 'TARJETA', etiqueta: 'Tarjeta', detalle: '•••• 4821', icono: '💳' },
  { codigo: 'EFECTIVO', etiqueta: 'Efectivo', detalle: 'Pago directo al conductor', icono: '💵' },
  { codigo: 'BILLETERA', etiqueta: 'Billetera YIPA', detalle: 'Saldo $32.500', icono: '👛' },
];
