# 05 · Modelos de dominio, DTOs y mappers

Dos capas de tipos separadas a propósito:

| Capa | Archivo | Responsabilidad |
|---|---|---|
| **Dominio frontend** | `projects/shared/src/lib/domain/models.ts` | Lo que consumen componentes y stores. Estructuras cómodas para la UI (`Lugar.coordenada`, `Dinero`, `Vehiculo` anidado). |
| **DTO de API** | `projects/shared/src/lib/dto/api.dto.ts` | Contrato JSON exacto con Spring Boot (`lat`/`lng` planos, dinero como entero). |
| **Mappers** | `projects/shared/src/lib/mappers/mappers.ts` | `toX(dto)` y `fromX(modelo)`. Único punto que cambia si el backend cambia su contrato. |

## Modelos de dominio

```ts
// Value objects
Coordenada { lat, lng }
Lugar      { id, nombre, direccion, coordenada, tipo? }        // tipo: casa|trabajo|favorito|reciente|busqueda
Dinero     { monto, moneda: 'COP' }
RolUsuario = 'PASAJERO' | 'CONDUCTOR'

// Bounded Context: Pasajeros / Identidad
Usuario    { id, nombre, apellido, email, telefono, rol, fotoUrl?, calificacionPromedio, fechaRegistro }
Pasajero   extends Usuario { metodoPagoPreferido, lugaresFavoritos: Lugar[], viajesRealizados }
MetodoPago = 'EFECTIVO' | 'TARJETA' | 'BILLETERA'

// Bounded Context: Conductores
EstadoConductor  = 'DISPONIBLE' | 'OCUPADO' | 'DESCONECTADO'
CategoriaVehiculo = 'YIPA_X' | 'YIPA_XL' | 'YIPA_MOTO'
Vehiculo   { id?, placa, marca, modelo, color, anio, categoria, capacidad }
Conductor  extends Usuario { estado, licencia, vehiculo, ubicacionActual?, viajesCompletados, documentosVerificados }
ResumenConductor { conductorId, estado, viajesHoy, gananciasHoy: Dinero, gananciasSemana: Dinero,
                   horasEnLinea, calificacionPromedio, tasaAceptacion }

// Bounded Context: Emparejamiento
EstadoSolicitud = 'BUSCANDO' | 'OFERTADA' | 'ACEPTADA' | 'RECHAZADA' | 'EXPIRADA' | 'CANCELADA' | 'SIN_CONDUCTORES'
SolicitudViaje { id, pasajeroId, origen, destino, categoria, metodoPago, notaParaConductor?,
                 estado, tarifaEstimada: Tarifa, creadaEn, conductorCandidatoId?, expiraEnSegundos?, viajeId? }
OfertaViaje    { solicitudId, pasajero: ResumenPasajero, origen, destino, distanciaHastaOrigenKm,
                 minutosHastaOrigen, distanciaViajeKm, duracionViajeMin, tarifa, metodoPago, expiraEnSegundos }

// Bounded Context: Viajes
EstadoViaje = 'BUSCANDO_CONDUCTOR' | 'CONDUCTOR_ASIGNADO' | 'CONDUCTOR_EN_CAMINO'
            | 'CONDUCTOR_LLEGO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO'
EventoViaje { estado, ocurridoEn, descripcion }
Viaje       { id, solicitudId, pasajero, conductor?, origen, destino, estado, tarifa, metodoPago,
              distanciaKm, duracionMin, ruta: Coordenada[], ubicacionConductor?, etaMinutos?,
              historial: EventoViaje[], creadoEn, finalizadoEn?, calificacion?, motivoCancelacion?, canceladoPor? }
ResumenViajeHistorial { id, fecha, origen, destino, estado, total: Dinero, contraparteNombre,
                        contraparteFotoUrl?, calificacionOtorgada?, categoria }
MotivoCancelacion = 'DEMORA_EXCESIVA' | 'CAMBIO_DE_PLANES' | 'CONDUCTOR_NO_LLEGA'
                  | 'PASAJERO_NO_APARECE' | 'ERROR_EN_DIRECCION' | 'OTRO'

// Bounded Context: Tarifas
DesgloseTarifa { tarifaBase, costoPorKm, costoPorMinuto, distanciaKm, duracionMin,
                 subtotal, multiplicadorDemanda, recargoDemanda, descuento, total }
Tarifa   { moneda: 'COP', total, minimoEstimado?, maximoEstimado?, desglose, categoria, calculadaEn }
OpcionCategoria { categoria, nombre, descripcion, capacidad, icono, etaMinutos, tarifa }

// Bounded Context: Calificaciones
Calificacion { id, viajeId, deUsuarioId, paraUsuarioId, puntuacion: 1..5, etiquetas, comentario?, creadaEn }
```

## DTOs (resumen)

Request: `LoginRequestDto`, `RegistroPasajeroRequestDto`, `RegistroConductorRequestDto`, `ActualizarPerfilRequestDto`, `EstimacionTarifaRequestDto`, `CrearSolicitudRequestDto`, `RechazarSolicitudRequestDto`, `DisponibilidadRequestDto`, `UbicacionRequestDto`, `CambiarEstadoViajeRequestDto`, `CancelarViajeRequestDto`, `CrearCalificacionRequestDto`.

Response: `AuthResponseDto`, `UsuarioDto`, `PasajeroDto`, `ConductorDto`, `LugarDto`, `VehiculoDto`, `DisponibilidadResponseDto`, `ResumenConductorDto`, `TarifaDto`, `EstimacionTarifaResponseDto`, `SolicitudViajeDto`, `OfertaViajeDto`, `ViajeDto`, `ViajeHistorialDto`, `CancelacionResponseDto`, `UbicacionConductorResponseDto`, `CalificacionDto`.

Transversales: `ApiErrorDto`, `PageDto<T>`.

## Diferencias DTO ↔ dominio (las que resuelve el mapper)

| DTO | Dominio | Mapper |
|---|---|---|
| `LugarDto { lat, lng }` | `Lugar { coordenada }` | `toLugar` / `fromLugar` |
| `ResumenConductorDto.gananciasHoy: number` | `ResumenConductor.gananciasHoy: Dinero` | `toResumenConductor` |
| `ViajeHistorialDto.total: number` | `ResumenViajeHistorial.total: Dinero` | `toHistorial` |
| `LugarDto.tipo: string` | `Lugar.tipo` (unión cerrada) | normalizado en `toLugar` |
| `PageDto<ViajeHistorialDto>` | `PaginaHistorial { items, page, totalPages, totalElements, last }` | `ViajeService.historial` |

Regla: **ningún componente importa un DTO**; solo modelos de dominio y, cuando construye un request, el tipo `*RequestDto` correspondiente.
