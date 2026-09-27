# 06 · Guía de integración con el backend Java Spring Boot

## 1. Activar el backend real

Un único cambio por aplicación (`projects/<app>/src/app/app.config.ts`):

```ts
provideYipa({
  baseUrl: 'https://api.yipa.co/api',
  useMocks: false,            // desactiva mockBackendInterceptor
  pollingIntervalMs: 3000,
});
```

Con `useMocks: false` el interceptor de mocks deja pasar la petición y `HttpClient` llama a la API real. No hay que tocar componentes ni servicios.

## 2. Requisitos del lado Spring Boot

1. **CORS**: permitir los orígenes de ambos clientes, cabeceras `Authorization` y `Content-Type`, métodos `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
2. **JWT**: `POST /auth/login` devuelve `accessToken` (Bearer) y `refreshToken`. El frontend adjunta `Authorization: Bearer` automáticamente y guarda la sesión en `localStorage`.
3. **Formato de error**: respetar `ApiErrorDto` (`timestamp`, `status`, `code`, `message`, `path`, `fieldErrors?`). El `code` se usa para mensajes de negocio; el `message` se muestra al usuario tal cual en el toast.
4. **Paginación**: `PageDto<T>` (`content`, `page`, `size`, `totalElements`, `totalPages`, `last`). Compatible con `Page<T>` de Spring Data serializado con esas claves (o con un `PageResponse` propio).
5. **Zona horaria**: serializar `Instant` en ISO-8601 UTC (`spring.jackson.time-zone=UTC`, `write-dates-as-timestamps=false`).
6. **Dinero**: enteros COP; no enviar decimales ni strings formateados (el formateo lo hace el pipe `cop`).

## 3. Mapeo a la arquitectura hexagonal / DDD

| Bounded Context | Agregados sugeridos | Puertos de entrada (casos de uso) | Endpoints que expone |
|---|---|---|---|
| **Pasajeros** | `Pasajero`, `LugarFavorito` | RegistrarPasajero, ActualizarPerfil, BuscarLugares | `/auth/registro/pasajero`, `/usuarios/me`, `/lugares` |
| **Conductores** | `Conductor`, `Vehiculo`, `Disponibilidad` | RegistrarConductor, CambiarDisponibilidad, ReportarUbicacion, ConsultarResumen | `/auth/registro/conductor`, `/conductores/me/**` |
| **Emparejamiento** | `SolicitudViaje`, `OfertaViaje` | CrearSolicitud, AsignarConductor, AceptarOferta, RechazarOferta, CancelarSolicitud | `/solicitudes/**`, `/conductores/me/solicitudes` |
| **Viajes** | `Viaje`, `EventoViaje` | IniciarViaje, ConfirmarLlegada, FinalizarViaje, CancelarViaje, ConsultarViaje, ConsultarHistorial | `/viajes/**` |
| **Tarifas** | `Tarifa`, `PoliticaTarifaria` | EstimarTarifa, CalcularTarifaFinal | `/tarifas/estimacion` |
| **Calificaciones** | `Calificacion` | CalificarViaje, RecalcularPromedio | `/viajes/{id}/calificacion` |

Los DTOs de este repositorio corresponden a los *adaptadores REST* del backend, no a las entidades de dominio: cada contexto debe traducirlos a sus propios comandos/consultas.

### Eventos de dominio esperados

`SolicitudCreada` → Emparejamiento · `ConductorAsignado` → Viajes + Pasajeros · `ViajeIniciado` / `ViajeFinalizado` → Tarifas + Calificaciones · `ViajeCancelado` → Conductores (libera disponibilidad).

## 4. Dependencias frontend → backend

| Pantalla | Depende de | Bloqueante |
|---|---|---|
| Login / Registro (ambos) | Identidad + JWT | Sí, primera dependencia |
| Home pasajero | `/lugares` | Sí (fallback: solo búsqueda manual) |
| Solicitar viaje | `/tarifas/estimacion`, `/solicitudes` | Sí |
| Esperando conductor | `/solicitudes/{id}` (polling), `DELETE /solicitudes/{id}` | Sí |
| Solicitudes entrantes (conductor) | `/conductores/me/solicitudes`, disponibilidad | Sí |
| Seguimiento / Navegación | `/viajes/{id}`, `/viajes/{id}/ubicacion-conductor` | Sí |
| Viaje finalizado / Tarifa | `ViajeDto.tarifa` | No (se deriva del viaje) |
| Calificación | `/viajes/{id}/calificacion` | No, es posterior al viaje |
| Historial | `/viajes?rol=&page=&size=` | No |
| Perfil | `/usuarios/me` | No |
| Configuración | — (solo lectura de `YipaApiConfig`) | No |

Dependencias **del backend hacia el frontend**: ninguna. El frontend solo exige estabilidad en los nombres de campos y en los códigos de error del catálogo (`docs/04-api-endpoints.md`).

## 5. Tiempo real

El MVP usa polling. Migración recomendada cuando el backend lo soporte:

| Caso | Hoy | Producción |
|---|---|---|
| Estado de la solicitud | `GET /solicitudes/{id}` cada 2 s | WS `/ws/solicitudes/{id}` o SSE |
| Ubicación del conductor | `GET /viajes/{id}/ubicacion-conductor` cada 2 s | WS `/ws/viajes/{id}/ubicacion` |
| Solicitudes entrantes | `GET /conductores/me/solicitudes` cada 2 s | WS `/ws/conductores/me/ofertas` + push |

Solo cambia el cuerpo de los métodos `observar*` de los servicios; las pantallas siguen suscribiéndose a un `Observable`.

## 6. Checklist de integración

1. Publicar OpenAPI del backend y contrastar con `docs/04-api-endpoints.md`.
2. Ajustar `mappers.ts` si algún nombre de campo difiere (único archivo a tocar).
3. Configurar `provideYipa({ useMocks: false, baseUrl })` por entorno.
4. Habilitar CORS + JWT y validar login de pasajero y de conductor.
5. Recorrer HU-01 → HU-10 con el backend real usando las mismas pantallas.
6. Sustituir `YipaMap` (SVG) por Google Maps/Mapbox manteniendo sus entradas (`ruta`, `origen`, `destino`, `conductor`).
7. Sustituir polling por WebSocket.
