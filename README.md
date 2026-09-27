# YIPA · Frontend

MVP académico del sistema de transporte bajo demanda **YIPA**, inspirado en el Yipao quindiano. Workspace Angular 20 con dos clientes independientes y una librería compartida, **sin backend**: toda la API se resuelve con un backend simulado en memoria listo para reemplazarse por una API Java Spring Boot (DDD + hexagonal).

```
projects/
  pasajero/    YIPA Pasajero  (14 pantallas)
  conductor/   YIPA Conductor (12 pantallas)
  shared/      @yipa/shared: design system, componentes, modelos, DTOs, servicios, mocks
docs/          arquitectura, rutas/wireframes, design system, endpoints, DTOs, integración, plan
```

## Requisitos

Node 20+ (verificado con Node 24) y Angular CLI 20.

```bash
npm install
```

## Ejecutar

```bash
npm run start:pasajero     # http://localhost:4200
npm run start:conductor    # http://localhost:4300
```

Cuentas demo (mock):

| Cliente | Email | Password |
|---|---|---|
| Pasajero | `pasajero@yipa.co` | `yipa1234` |
| Conductor | `conductor@yipa.co` | `yipa1234` |

Para ver el emparejamiento completo, abre ambos clientes en paralelo: solicita un viaje desde Pasajero y acéptalo desde Conductor (o deja correr 6 s y el mock asigna un conductor automáticamente).

## Construir

```bash
npm run build:pasajero
npm run build:conductor
npm run build:shared
```

## Backend simulado → backend real

```ts
// projects/<app>/src/app/app.config.ts
provideYipa({ baseUrl: 'https://api.yipa.co/api', useMocks: false });
```

Con `useMocks: false` el interceptor de mocks deja pasar las peticiones y `HttpClient` habla con Spring Boot. Ver [la guía de integración](docs/06-integracion-backend.md).

## Diseño

Mobile-first (móvil como plataforma principal, tablet como segundo objetivo): en móvil el mapa y el panel se apilan con bottom sheet; desde 768 px pasan a split mapa + panel lateral.

## Historias de usuario cubiertas

HU-01 solicitar viaje · HU-02 disponibilidad del conductor · HU-03 emparejamiento automático · HU-04 aceptar/rechazar · HU-05 ubicación en vivo · HU-06 estado del viaje · HU-07 tarifa calculada · HU-08 calificar conductor · HU-09 historial · HU-10 cancelar viaje.

## Documentación

| Doc | Contenido |
|---|---|
| [01 · Arquitectura](docs/01-arquitectura.md) | Estructura, capas, interceptores, guards |
| [02 · Rutas y pantallas](docs/02-rutas-y-pantallas.md) | Rutas, HU por pantalla, wireframes en texto |
| [03 · Design System](docs/03-design-system.md) | Tokens, componentes, responsive, microinteracciones |
| [04 · Endpoints](docs/04-api-endpoints.md) | Catálogo REST con request/response/errores |
| [05 · DTOs y modelos](docs/05-dtos-y-modelos.md) | Dominio frontend, DTOs y mappers |
| [06 · Integración backend](docs/06-integracion-backend.md) | Guía Spring Boot, bounded contexts, dependencias |
| [07 · Plan por fases](docs/07-plan-por-fases.md) | Fases completadas y siguientes pasos |
