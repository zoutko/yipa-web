# 01 · Arquitectura Angular

## Workspace

Monorepo Angular 20 con tres proyectos:

| Proyecto | Tipo | Descripción |
|---|---|---|
| `projects/pasajero` | Aplicación | Cliente YIPA Pasajero (14 pantallas) |
| `projects/conductor` | Aplicación | Cliente YIPA Conductor (12 pantallas) |
| `projects/shared` | Librería (`@yipa/shared`) | Design System, modelos, DTOs, mappers, servicios HTTP, mock backend |

Las dos aplicaciones son **independientes** (bundle, rutas, despliegue y sesión propios) y solo comparten la librería. El alias `@yipa/shared` está declarado en `tsconfig.json` y apunta a `projects/shared/src/public-api.ts`, de modo que en desarrollo se compila desde fuentes y en producción puede publicarse como paquete (`ng build shared` genera FESM + typings con ng-packagr).

## Estructura de carpetas

```text
yipa-web/
├── angular.json
├── tsconfig.json                 # paths: @yipa/shared
├── docs/                         # esta documentación
└── projects/
    ├── shared/
    │   └── src/
    │       ├── public-api.ts     # superficie pública de la librería
    │       ├── styles/
    │       │   ├── _tokens.scss      # variables SCSS + custom properties
    │       │   ├── _mixins.scss      # glass, elevación, breakpoints
    │       │   ├── _base.scss        # reset, utilidades, keyframes
    │       │   └── design-system.scss
    │       └── lib/
    │           ├── domain/models.ts          # modelos de dominio del frontend
    │           ├── dto/api.dto.ts            # contratos con la API
    │           ├── mappers/mappers.ts        # DTO <-> dominio
    │           ├── core/
    │           │   ├── api.config.ts             # YipaApiConfig + token DI
    │           │   ├── provide-yipa.ts           # providers raíz
    │           │   ├── auth.interceptor.ts       # Bearer token
    │           │   ├── mock-backend.interceptor.ts
    │           │   ├── guards.ts                 # authGuard / invitadoGuard
    │           │   └── geo.util.ts               # haversine, rutas simuladas
    │           ├── services/                 # una clase por bounded context
    │           ├── mocks/                    # datos + simulador de estado
    │           ├── ui/                       # component library (yipa-*)
    │           └── pipes/                    # cop, fechaRelativa
    ├── pasajero/src/app/
    │   ├── app.config.ts          # provideRouter + provideYipa
    │   ├── app.routes.ts
    │   ├── layout/tabs.layout.ts
    │   ├── state/solicitud.store.ts   # estado del flujo de solicitud (signals)
    │   └── features/<feature>/<pantalla>.page.ts
    └── conductor/src/app/
        ├── app.config.ts
        ├── app.routes.ts
        ├── layout/tabs.layout.ts
        ├── state/disponibilidad.store.ts
        └── features/<feature>/<pantalla>.page.ts
```

## Decisiones de arquitectura

1. **Standalone + lazy loading.** No hay NgModules. Cada pantalla es un componente standalone cargado con `loadComponent`, por lo que cada ruta produce su propio chunk.
2. **Signals para estado.** El estado local de pantalla y los stores (`SessionStore`, `SolicitudStore`, `DisponibilidadStore`) usan `signal` / `computed`. RxJS se reserva para el transporte HTTP y el polling.
3. **OnPush en todos los componentes.** Combinado con signals evita chequeos innecesarios.
4. **Capa de servicios obligatoria.** Ningún componente contiene datos simulados: todos consumen `HttpClient` a través de los servicios de `@yipa/shared`. Cambiar `useMocks` a `false` conecta el mismo código a Spring Boot.
5. **DTO ≠ dominio.** Los servicios reciben/envían DTOs y los traducen con mappers. Un cambio de contrato en el backend se absorbe en `mappers.ts`.
6. **Feature folders por caso de uso**, alineados con los bounded contexts del backend.

## Flujo de una llamada

```text
Componente (signal)
  └─> Service (@yipa/shared)      POST /api/solicitudes
        └─> HttpClient
              ├─ authInterceptor          añade Authorization: Bearer <token>
              └─ mockBackendInterceptor   si useMocks=true responde desde memoria
                    └─ MockBackend        máquina de estados del viaje
        <─ DTO
  <─ mapper -> modelo de dominio
```

## Configuración (`YipaApiConfig`)

```ts
provideYipa({
  baseUrl: '/api',
  useMocks: true,        // false => backend real
  mockLatencyMs: 450,    // latencia simulada
  pollingIntervalMs: 2000,
});
```

`YIPA_API_CONFIG` es un `InjectionToken` inyectable en cualquier servicio o componente (la pantalla de Configuración del pasajero lo muestra en pantalla).

## Autenticación y guards

- `SessionStore` guarda token + usuario en `localStorage` (clave `yipa.session`) y expone `autenticado()` y `rol()` como signals.
- `authGuard('/auth/login')` protege `/app/**` y `/viaje/**`.
- `invitadoGuard('/app/inicio')` evita volver al login con sesión activa.
- `authInterceptor` inyecta el `Bearer` en cada request saliente.

## Tiempo real

El MVP usa **polling** (`interval` + `switchMap`, cadencia `pollingIntervalMs`) para seguimiento de viaje, ubicación del conductor y solicitudes entrantes. La firma de los métodos (`observar*`) es un `Observable`, por lo que migrar a WebSocket/SSE en Spring Boot solo requiere cambiar la implementación interna del servicio, no las pantallas.
