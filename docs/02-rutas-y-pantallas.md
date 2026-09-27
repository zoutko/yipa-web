# 02 · Rutas, pantallas y wireframes

Layout **mobile-first**: móvil como objetivo principal, tablet (≥768px) como segundo objetivo con mapa y panel en split. No se optimiza escritorio amplio.

## Cliente Pasajero · rutas

| # | Ruta | Componente | HU |
|---|---|---|---|
| 1 | `/` | `SplashPage` | — |
| 2 | `/auth/login` | `LoginPage` | — |
| 3 | `/auth/registro` | `RegistroPage` | — |
| 4 | `/app/inicio` | `HomePage` | HU-01 |
| 5 | `/viaje/solicitar` | `SolicitarPage` | HU-01, HU-07 |
| 6 | `/viaje/esperando/:solicitudId` | `EsperandoPage` | HU-03, HU-10 |
| 7 | `/viaje/:viajeId/seguimiento` | `SeguimientoPage` | HU-05, HU-06, HU-10 |
| 8 | `/viaje/:viajeId/en-curso` | `EnCursoPage` | HU-05, HU-06 |
| 9 | `/viaje/:viajeId/finalizado` | `FinalizadoPage` | HU-06 |
| 10 | `/viaje/:viajeId/tarifa` | `TarifaPage` | HU-07 |
| 11 | `/viaje/:viajeId/calificar` | `CalificarPage` | HU-08 |
| 12 | `/app/historial` | `HistorialPage` | HU-09 |
| 13 | `/app/perfil` | `PerfilPage` | — |
| 14 | `/app/configuracion` | `ConfiguracionPage` | — |

`/app/**` usa `TabsLayout` (tab bar: Inicio · Viajes · Perfil · Ajustes). `/viaje/**` es pantalla completa sin tabs.

## Cliente Conductor · rutas

| # | Ruta | Componente | HU |
|---|---|---|---|
| 1 | `/` | `SplashPage` | — |
| 2 | `/auth/login` | `LoginPage` | — |
| 3 | `/auth/registro` | `RegistroPage` | — |
| 4 | `/app/dashboard` | `DashboardPage` | HU-02 |
| 5 | `/app/disponibilidad` | `DisponibilidadPage` | HU-02 |
| 6 | `/app/solicitudes` | `SolicitudesPage` | HU-03, HU-04 |
| 7 | `/solicitudes/:solicitudId` | `DetalleSolicitudPage` | HU-04, HU-07 |
| 8 | `/viaje/:viajeId/asignado` | `AsignadoPage` | HU-05, HU-06, HU-10 |
| 9 | `/viaje/:viajeId/navegacion` | `NavegacionPage` | HU-05, HU-06 |
| 10 | `/viaje/:viajeId/finalizado` | `FinalizadoPage` | HU-07 |
| 11 | `/app/historial` | `HistorialPage` | HU-09 |
| 12 | `/app/perfil` | `PerfilPage` | — |

Tab bar del conductor: Panel · Solicitudes · Viajes · Perfil.

## Máquina de estados del viaje

```text
              HU-01                HU-03            HU-04
 [Home] ──> SolicitudViaje ──> BUSCANDO ──> OFERTADA ──> ACEPTADA ──> Viaje
                                  │                         
                                  └── CANCELADA (HU-10)

 Viaje: CONDUCTOR_ASIGNADO ─> CONDUCTOR_EN_CAMINO ─> CONDUCTOR_LLEGO
          ─> EN_CURSO ─> FINALIZADO ─> (HU-07 tarifa) ─> (HU-08 calificación)
          └──────────────> CANCELADO (HU-10)
```

## Wireframes (texto)

### P4 · Home (pasajero)

```text
┌──────────────────────────────┐
│  (avatar)  Hola, Bryan       │   ← saludo + avatar
│                              │
│      ░░░  MAPA SVG  ░░░      │   ← yipa-map, ubicación actual
│      ░░░           ░░░      │
├──────────────────────────────┤   ← bottom sheet (glass)
│  ¿A dónde vamos?             │
│  ┌────────────────────────┐  │
│  │ 🔍  Buscar destino     │  │
│  └────────────────────────┘  │
│  🏠 Casa            2.4 km   │
│  🎓 Universidad     5.1 km   │
│  🕘 Unicentro    (reciente)  │
├──────────────────────────────┤
│  Inicio  Viajes  Perfil  ⚙︎  │   ← tab bar
└──────────────────────────────┘
```

Tablet (≥768px): mapa a la izquierda, panel fijo a la derecha (`.yipa-split`).

### P5 · Solicitar viaje

```text
┌──────────────────────────────┐
│ ‹  Solicitar viaje           │
│      ░░ MAPA + RUTA A→B ░░   │
├──────────────────────────────┤
│ 🅐 Mi ubicación              │
│ 🅑 Aeropuerto El Edén        │
│ ─────────────────────────    │
│ ┌────────┐┌────────┐┌──────┐ │
│ │🚙 X    ││🚐 XL   ││🛵 Mo │ │  ← categorías + tarifa por cada una
│ │$12.400 ││$17.900 ││$8.300│ │
│ └────────┘└────────┘└──────┘ │
│ 💳 Tarjeta            cambiar│
│ Nota para el conductor…      │
│ [   Confirmar YIPA X      ]  │
└──────────────────────────────┘
```

### P6 · Esperando conductor

```text
┌──────────────────────────────┐
│      ░░ MAPA (pulso) ░░      │
├──────────────────────────────┤
│  ◐ Buscando tu YIPA…         │
│  Estamos avisando a los      │
│  conductores cercanos        │
│  Destino: Aeropuerto         │
│  Tarifa estimada  $12.400    │
│  [   Cancelar solicitud   ]  │  ← HU-10
└──────────────────────────────┘
```

### P7 · Seguimiento

```text
┌──────────────────────────────┐
│   ░░ MAPA: 🚙 → 🅐 → 🅑 ░░   │
│   [ 4 min ]                  │  ← ETA flotante
├──────────────────────────────┤
│ ●───●───○───○  timeline      │  ← yipa-estado-viaje
│ (foto) Carlos M.   ★4.9      │
│ Willys Yipao · Amarillo      │
│ ┌────────┐  placa YIP123     │
│ [ Llamar ] [ Cancelar viaje ]│
└──────────────────────────────┘
```

### P10 · Resumen de tarifa

```text
┌──────────────────────────────┐
│ ‹  Resumen de tarifa         │
│         $ 12.400             │
│ Tarifa base          $3.500  │
│ Distancia 5.2 km     $6.240  │
│ Tiempo 14 min        $1.960  │
│ Demanda ×1.2           $700  │
│ ─────────────────────────    │
│ Total                $12.400 │
│ [ Calificar conductor ]      │
└──────────────────────────────┘
```

### C4 · Dashboard (conductor)

```text
┌──────────────────────────────┐
│ (avatar) Hola, Carlos [En línea]│
│ ┌──────────────────────────┐ │
│ │ Recibiendo solicitudes   │ │
│ │              [Desconectar]│ │  ← HU-02
│ └──────────────────────────┘ │
│ ┌────────┐┌────────┐        │
│ │Hoy     ││Viajes  │        │
│ │$96.400 ││   7    │        │
│ └────────┘└────────┘        │
│ ★ 4.9        Aceptación 92%  │
│ [ Ver solicitudes entrantes ]│
├──────────────────────────────┤
│ Panel Solicitudes Viajes 👤  │
└──────────────────────────────┘
```

### C6 · Solicitudes entrantes

```text
┌──────────────────────────────┐
│ Solicitudes        [En línea]│
│ ┌──────────────────────────┐ │
│ │(foto) Ana ★4.8      18s  │ │  ← cuenta regresiva de la oferta
│ │🅐 Calle 21 #14-30        │ │
│ │🅑 Unicentro              │ │
│ │3 min al pasajero · 4.1 km│ │
│ │                  $10.800 │ │
│ │[Rechazar][Detalle][Aceptar]│ │  ← HU-04
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### C9 · Navegación del viaje

```text
┌──────────────────────────────┐
│ [⬆️ Continúa hacia Unicentro]│
│      ░░ MAPA + RUTA ░░       │
├──────────────────────────────┤
│ Pasajero Ana · Efectivo      │
│ Ganas $10.800                │
│ 🅑 Cra 14 #6-02              │
│ [     Finalizar viaje     ]  │
└──────────────────────────────┘
```
