# 04 · Catálogo de endpoints (contrato frontend ↔ Spring Boot)

Base URL configurable (`YipaApiConfig.baseUrl`, por defecto `/api`).

Convenciones:
- Fechas ISO-8601 UTC (`2026-01-31T14:05:00Z`).
- Dinero: entero en COP, sin decimales.
- Enumerados en `MAYÚSCULAS_SNAKE`.
- Autenticación: `Authorization: Bearer <accessToken>` (lo inyecta `authInterceptor`).
- Todos los errores devuelven `ApiErrorDto`:

```json
{
  "timestamp": "2026-01-31T14:05:00Z",
  "status": 409,
  "code": "SOLICITUD_NO_DISPONIBLE",
  "message": "La solicitud ya fue tomada por otro conductor",
  "path": "/api/solicitudes/sol-12/aceptar",
  "fieldErrors": [{ "field": "email", "message": "formato inválido" }]
}
```

Errores transversales: `401 TOKEN_INVALIDO`, `403 ACCESO_DENEGADO`, `422 VALIDACION`, `500 ERROR_INTERNO`.

---

## Bounded Context: Pasajeros / Identidad

### POST /api/auth/login
Autentica a un usuario en el cliente correspondiente.
- **Request** `LoginRequestDto` → `{ email, password, rol: "PASAJERO" | "CONDUCTOR" }`
- **Response 200** `AuthResponseDto` → `{ accessToken, refreshToken, expiresIn, usuario: UsuarioDto }`
- **Errores**: `401 CREDENCIALES_INVALIDAS`, `403 ROL_NO_CORRESPONDE`, `422 VALIDACION`
- **Consumido por**: `LoginPage` (ambos clientes) vía `AuthService.login`

### POST /api/auth/registro/pasajero
Crea una cuenta de pasajero y devuelve sesión iniciada.
- **Request** `RegistroPasajeroRequestDto` → `{ nombre, apellido, email, telefono, password }`
- **Response 201** `AuthResponseDto`
- **Errores**: `409 EMAIL_YA_REGISTRADO`, `422 VALIDACION`

### POST /api/auth/registro/conductor
Crea cuenta de conductor con su vehículo (queda pendiente de verificación documental).
- **Request** `RegistroConductorRequestDto` → `RegistroPasajeroRequestDto + { licencia, vehiculo: VehiculoDto }`
- **Response 201** `AuthResponseDto`
- **Errores**: `409 EMAIL_YA_REGISTRADO`, `409 PLACA_YA_REGISTRADA`, `422 VALIDACION`

### GET /api/usuarios/me
Perfil del usuario autenticado. Devuelve `PasajeroDto` o `ConductorDto` según el rol.
- **Response 200** `PasajeroDto | ConductorDto`
- **Errores**: `401 TOKEN_INVALIDO`
- **Consumido por**: `PerfilPage` (ambos)

### PUT /api/usuarios/me
Actualiza datos editables del perfil.
- **Request** `ActualizarPerfilRequestDto` → `{ nombre?, apellido?, telefono?, fotoUrl?, metodoPagoPreferido? }`
- **Response 200** `PasajeroDto | ConductorDto`
- **Errores**: `422 VALIDACION`

### GET /api/lugares?q={texto}
Autocompletado de lugares y favoritos del pasajero (sustituible por Places API).
- **Query**: `q` (opcional; vacío devuelve favoritos y recientes)
- **Response 200** `LugarDto[]` → `{ id, nombre, direccion, lat, lng, tipo? }`
- **Errores**: `422 VALIDACION`
- **Consumido por**: `HomePage`, `SolicitarPage`

---

## Bounded Context: Tarifas

### POST /api/tarifas/estimacion
Calcula la tarifa estimada para las tres categorías antes de confirmar (HU-07).
- **Request** `EstimacionTarifaRequestDto` → `{ origen: {lat,lng}, destino: {lat,lng}, categoria? }`
- **Response 200** `EstimacionTarifaResponseDto`

```json
{
  "distanciaKm": 5.2,
  "duracionMin": 14,
  "opciones": [
    {
      "categoria": "YIPA_X", "nombre": "YIPA X", "descripcion": "Económico y rápido",
      "capacidad": 4, "icono": "🚙", "etaMinutos": 4,
      "tarifa": {
        "moneda": "COP", "total": 12400, "categoria": "YIPA_X",
        "calculadaEn": "2026-01-31T14:05:00Z",
        "desglose": {
          "tarifaBase": 3500, "costoPorKm": 1200, "costoPorMinuto": 140,
          "distanciaKm": 5.2, "duracionMin": 14, "subtotal": 11700,
          "multiplicadorDemanda": 1.2, "recargoDemanda": 700, "descuento": 0, "total": 12400
        }
      }
    }
  ]
}
```
- **Errores**: `422 COORDENADAS_INVALIDAS`, `409 FUERA_DE_COBERTURA`

---

## Bounded Context: Emparejamiento

### POST /api/solicitudes
Crea la solicitud de viaje y dispara el emparejamiento (HU-01 → HU-03).
- **Request** `CrearSolicitudRequestDto` → `{ origen: LugarDto, destino: LugarDto, categoria, metodoPago, notaParaConductor? }`
- **Response 201** `SolicitudViajeDto` con `estado: "BUSCANDO"`
- **Errores**: `409 VIAJE_ACTIVO_EXISTENTE`, `409 SIN_CONDUCTORES_DISPONIBLES`, `422 VALIDACION`

### GET /api/solicitudes/{id}
Estado de la solicitud. El frontend hace polling cada `pollingIntervalMs` (producción: WebSocket `/ws/solicitudes/{id}`).
- **Response 200** `SolicitudViajeDto`; cuando `estado = "ACEPTADA"` incluye `viajeId`
- **Estados**: `BUSCANDO → OFERTADA → ACEPTADA | EXPIRADA | CANCELADA | SIN_CONDUCTORES`
- **Errores**: `404 SOLICITUD_NO_ENCONTRADA`

### DELETE /api/solicitudes/{id}
Cancela la solicitud mientras aún no hay conductor asignado (HU-10).
- **Response 200** `{ "solicitudId": "sol-12", "estado": "CANCELADA" }`
- **Errores**: `409 SOLICITUD_YA_ACEPTADA`, `404 SOLICITUD_NO_ENCONTRADA`

### GET /api/conductores/me/solicitudes
Ofertas vigentes para el conductor conectado (HU-03/HU-04). Polling; producción: WebSocket/push.
- **Response 200** `OfertaViajeDto[]` con `expiraEnSegundos` decreciente
- **Errores**: `409 CONDUCTOR_DESCONECTADO`

### POST /api/solicitudes/{id}/aceptar
El conductor acepta la oferta; el backend crea el viaje (HU-04).
- **Request**: sin cuerpo
- **Response 201** `ViajeDto` con `estado: "CONDUCTOR_ASIGNADO"`
- **Errores**: `409 SOLICITUD_NO_DISPONIBLE`, `409 OFERTA_EXPIRADA`, `409 CONDUCTOR_CON_VIAJE_ACTIVO`

### POST /api/solicitudes/{id}/rechazar
Rechaza la oferta y devuelve la solicitud al emparejador (HU-04).
- **Request** `RechazarSolicitudRequestDto` → `{ motivo?: "MUY_LEJOS" | "FIN_DE_TURNO" | "DESTINO_NO_CONVIENE" | "OTRO" }`
- **Response 200** `{ "solicitudId": "sol-12", "estado": "BUSCANDO" }`
- **Errores**: `404 SOLICITUD_NO_ENCONTRADA`

---

## Bounded Context: Conductores

### PUT /api/conductores/me/disponibilidad
Conecta o desconecta al conductor (HU-02).
- **Request** `DisponibilidadRequestDto` → `{ estado: "DISPONIBLE" | "DESCONECTADO", ubicacion: {lat,lng} }`
- **Response 200** `DisponibilidadResponseDto` → `{ conductorId, estado, actualizadoEn }`
- **Errores**: `409 VIAJE_EN_CURSO` (no puede desconectarse), `403 DOCUMENTOS_NO_VERIFICADOS`

### POST /api/conductores/me/ubicacion
Reporta la posición del conductor (alimenta HU-03 y HU-05).
- **Request** `UbicacionRequestDto` → `{ lat, lng, rumbo?, velocidadKmh?, registradoEn }`
- **Response 202** `{ "registradoEn": "2026-01-31T14:05:00Z" }`
- **Errores**: `422 COORDENADAS_INVALIDAS`

### GET /api/conductores/me/resumen
Métricas del dashboard.
- **Response 200** `ResumenConductorDto` → `{ conductorId, estado, viajesHoy, gananciasHoy, gananciasSemana, horasEnLinea, calificacionPromedio, tasaAceptacion }`
- **Errores**: `401 TOKEN_INVALIDO`

---

## Bounded Context: Viajes

### GET /api/viajes/activo
Viaje en curso del usuario autenticado; usado por el Splash para reanudar.
- **Response 200** `ViajeDto` · **204** sin contenido si no hay viaje activo

### GET /api/viajes/{id}
Estado completo del viaje (HU-06). Polling en seguimiento y navegación.
- **Response 200** `ViajeDto`
- **Errores**: `404 VIAJE_NO_ENCONTRADO`, `403 ACCESO_DENEGADO`

### GET /api/viajes/{id}/ubicacion-conductor
Posición del conductor en vivo (HU-05), más liviano que el viaje completo.
- **Response 200** `UbicacionConductorResponseDto` → `{ viajeId, ubicacion, etaMinutos, estado, actualizadoEn }`
- **Errores**: `404 VIAJE_NO_ENCONTRADO`, `409 VIAJE_FINALIZADO`

### POST /api/viajes/{id}/estado
Transiciones que ejecuta el conductor (HU-06).
- **Request** `CambiarEstadoViajeRequestDto` → `{ accion: "CONFIRMAR_LLEGADA" | "INICIAR_VIAJE" | "FINALIZAR_VIAJE", ubicacion? }`
- **Response 200** `ViajeDto` actualizado
- **Errores**: `409 TRANSICION_INVALIDA`, `403 NO_ES_CONDUCTOR_DEL_VIAJE`

### POST /api/viajes/{id}/cancelacion
Cancela un viaje ya asignado (HU-10); puede generar penalización.
- **Request** `CancelarViajeRequestDto` → `{ motivo: MotivoCancelacion, comentario? }`
- **Response 200** `CancelacionResponseDto` → `{ viajeId, estado: "CANCELADO", penalizacion, mensaje }`
- **Errores**: `409 VIAJE_NO_CANCELABLE` (ya finalizado o en curso avanzado)

### GET /api/viajes?rol={PASAJERO|CONDUCTOR}&page=&size=
Historial paginado (HU-09).
- **Response 200** `PageDto<ViajeHistorialDto>` → `{ content, page, size, totalElements, totalPages, last }`
- **Errores**: `422 PAGINACION_INVALIDA`

---

## Bounded Context: Calificaciones

### POST /api/viajes/{viajeId}/calificacion
El pasajero califica al conductor al terminar (HU-08). Simétrico para el conductor.
- **Request** `CrearCalificacionRequestDto` → `{ puntuacion: 1..5, etiquetas?: string[], comentario? }`
- **Response 201** `CalificacionDto` → `{ id, viajeId, deUsuarioId, paraUsuarioId, puntuacion, etiquetas, comentario?, creadaEn }`
- **Errores**: `409 VIAJE_YA_CALIFICADO`, `409 VIAJE_NO_FINALIZADO`, `422 PUNTUACION_INVALIDA`

---

## Resumen por historia de usuario

| HU | Endpoints |
|---|---|
| HU-01 Solicitar viaje | `GET /lugares`, `POST /tarifas/estimacion`, `POST /solicitudes` |
| HU-02 Disponibilidad | `PUT /conductores/me/disponibilidad`, `POST /conductores/me/ubicacion` |
| HU-03 Emparejamiento | `GET /solicitudes/{id}`, `GET /conductores/me/solicitudes` |
| HU-04 Aceptar/rechazar | `POST /solicitudes/{id}/aceptar`, `POST /solicitudes/{id}/rechazar` |
| HU-05 Ubicación en vivo | `GET /viajes/{id}/ubicacion-conductor` |
| HU-06 Estado del viaje | `GET /viajes/{id}`, `POST /viajes/{id}/estado` |
| HU-07 Tarifa | `POST /tarifas/estimacion`, `ViajeDto.tarifa` |
| HU-08 Calificar | `POST /viajes/{viajeId}/calificacion` |
| HU-09 Historial | `GET /viajes?rol=&page=&size=` |
| HU-10 Cancelar | `DELETE /solicitudes/{id}`, `POST /viajes/{id}/cancelacion` |
