# 07 · Plan de implementación por fases

Estado actual: **fases 1 a 5 completas** (MVP académico con backend simulado). Las fases 6 y 7 son el camino hacia producción con Spring Boot.

## Fase 1 · Fundaciones ✅
- Workspace Angular 20 con `projects/pasajero`, `projects/conductor`, `projects/shared`.
- Alias `@yipa/shared`, `stylePreprocessorOptions` hacia los estilos compartidos.
- Design System: tokens, mixins, base, utilidades responsive.
- Component library (14 componentes + 2 pipes).

## Fase 2 · Contratos y capa de datos ✅
- Modelos de dominio por bounded context.
- DTOs espejo del contrato REST.
- Mappers bidireccionales.
- `provideYipa`, `authInterceptor`, `mockBackendInterceptor`, guards.
- `MockBackend`: máquina de estados de solicitud/viaje, conductores cercanos, tarifas y lugares de Armenia (Quindío).

## Fase 3 · Cliente Pasajero ✅
Splash · Login · Registro · Home · Solicitar · Esperando · Seguimiento · En curso · Finalizado · Tarifa · Calificación · Historial · Perfil · Configuración.
Cubre HU-01, HU-05, HU-06, HU-07, HU-08, HU-09, HU-10.

## Fase 4 · Cliente Conductor ✅
Splash · Login · Registro · Dashboard · Disponibilidad · Solicitudes entrantes · Detalle de solicitud · Viaje asignado · Navegación · Finalizado · Historial · Perfil.
Cubre HU-02, HU-03, HU-04, HU-06, HU-09, HU-10.

## Fase 5 · Documentación ✅
Arquitectura, rutas y wireframes, design system, catálogo de endpoints, DTOs/modelos, guía de integración y este plan.

## Fase 6 · Conexión con Spring Boot
1. Contrastar OpenAPI del backend con `docs/04-api-endpoints.md` y ajustar `mappers.ts` si hay diferencias.
2. Entornos: `provideYipa({ baseUrl, useMocks: false })` por configuración de build.
3. Login real con JWT; refresh token en `authInterceptor`.
4. Recorrido HU-01 → HU-10 contra el backend real.
5. Manejo de errores por `code` de negocio.
6. Pruebas de contrato (`HttpTestingController`) por servicio.

## Fase 7 · Producción
1. Mapa real (Google Maps / Mapbox) manteniendo la API de `YipaMap`.
2. Geolocalización del dispositivo (`navigator.geolocation`) en Home y Disponibilidad.
3. WebSocket/SSE en lugar de polling.
4. Notificaciones push para ofertas al conductor.
5. PWA: service worker, instalación y modo offline básico.
6. Pagos reales y facturación.
7. Accesibilidad (VoiceOver/TalkBack), i18n y analítica.

## Dependencias entre fases

```
F1 ──> F2 ──> F3 ──┐
             └─> F4 ┴─> F5 ──> F6 ──> F7
```

La fase 6 depende de que el backend exponga Identidad + Emparejamiento + Viajes; Tarifas y Calificaciones pueden llegar después sin bloquear el resto de la app.
