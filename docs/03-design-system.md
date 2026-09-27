# 03 · Design System YIPA

Inspiración visual: Apple HIG / iOS / Apple Maps / Apple Wallet + Uber actual. Inspiración cultural: el **Yipao** quindiano (amarillo Willys, negro carrocería).

## Uso

```scss
// projects/<app>/src/styles.scss
@use 'design-system' as *;   // includePaths: projects/shared/src/styles
```

Los tokens se publican como custom properties en `:root`, por lo que también funcionan dentro de los `styles: []` de cada componente standalone.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `--yipa-primary` | `#F4C542` | Acciones principales, marca |
| `--yipa-primary-dark` | `#D9A81F` | Hover/enlaces sobre claro |
| `--yipa-primary-soft` | `rgba(244,197,66,.16)` | Chips y estados seleccionados |
| `--yipa-secondary` | `#1F1F1F` | Barras oscuras, botón secundario |
| `--yipa-complement` / `--yipa-bg` | `#F8F6F2` | Fondo de la app |
| `--yipa-text` | `#202124` | Texto principal |
| `--yipa-text-secondary` / `-tertiary` | `#5F6368` / `#9AA0A6` | Jerarquía tipográfica |
| `--yipa-success` | `#34C759` | Conectado, viaje completado |
| `--yipa-error` | `#FF3B30` | Cancelar, errores |
| `--yipa-warning` | `#FFCC00` | Demanda alta, avisos |
| `--yipa-glass` | `rgba(255,255,255,.72)` | Glassmorphism sobre el mapa |

## Escalas

- **Tipografía** (`--yipa-fs-*`): `caption2 11 · caption 12 · footnote 13 · subhead 15 · body 17 · headline · title3 · title2 · title1 · large`. Pesos 400/500/600/700.
- **Espaciado** (`--yipa-sp-*`): escala de 4pt → 4, 8, 12, 16, 20, 24, 32, 40, 48.
- **Radios**: `sm 10 · md 14 · lg 20 · xl 28 · pill`.
- **Sombras**: `xs · sm · md · lg`, todas de baja opacidad.
- **Movimiento**: `--yipa-ease: cubic-bezier(.32,.72,0,1)` (curva tipo spring de iOS); duraciones 140/240/420 ms.
- **Blur**: `--yipa-blur: saturate(180%) blur(20px)`.

## Utilidades y keyframes (`_base.scss`)

`.yipa-screen` (pantalla con animación de entrada), `.yipa-scroll` (scroll con safe-area), `.yipa-card`, `.yipa-card-flat`, `.yipa-glass`, `.yipa-list` / `.yipa-list-item`, `.yipa-grow`, `.yipa-split` / `.yipa-split__map` / `.yipa-split__panel`, tipografías `.yipa-title-1/2`, `.yipa-headline`, `.yipa-subhead`, `.yipa-caption`.

Keyframes: `yipa-screen-in`, `yipa-sheet-up`, `yipa-fade-in`, `yipa-pulse`, `yipa-shimmer`, `yipa-spin`, `yipa-pop`.

## Responsive (mobile-first)

| Rango | Comportamiento |
|---|---|
| < 768px (móvil, principal) | Columna única; mapa arriba y **bottom sheet** deslizable abajo; tab bar fija con safe-area |
| ≥ 768px (tablet) | `.yipa-split` pasa a dos columnas: mapa a la izquierda, panel lateral a la derecha; el sheet pierde el asa y se vuelve tarjeta |
| ≥ 1024px (tablet grande) | Se amplía el panel y aumentan paddings; el contenido se limita con `--yipa-max-width` en pantallas de formulario |

## Component library (`@yipa/shared`)

| Selector | Clase | Entradas principales |
|---|---|---|
| `yipa-splash` | `YipaSplash` | `marca`, `lema` |
| `[yipa-button]` | `YipaButton` | `variante` (`primario\|secundario\|fantasma\|exito\|peligro`), `bloque`, `cargando` |
| `yipa-app-bar` | `YipaAppBar` | `titulo`, `subtitulo`, `conVolver`, `(volver)`, slot de acción |
| `yipa-sheet` | `YipaSheet` | `titulo`, `conAsa`, `plana` + contenido proyectado |
| `yipa-tab-bar` | `YipaTabBar` | `items: TabItem[]` (`ruta`, `etiqueta`, `icono`) |
| `yipa-text-field` | `YipaTextField` | `etiqueta`, `tipo`, `icono`, `ayuda`, `error`, `[(valor)]` |
| `yipa-avatar` | `YipaAvatar` | `nombre`, `fotoUrl`, `tamano` |
| `yipa-rating` | `YipaRating` | `[(valor)]`, `editable`, `tamano`, `etiqueta` |
| `yipa-map` | `YipaMap` | `ruta`, `origen`, `destino`, `conductor` + overlays proyectados |
| `yipa-estado-viaje` | `YipaEstadoViaje` | `estado` (timeline HU-06) |
| `yipa-tarifa-desglose` | `YipaTarifaDesglose` | `tarifa` (HU-07) |
| `yipa-empty-state` | `YipaEmptyState` | `icono`, `titulo`, `descripcion` |
| `yipa-toast-host` | `YipaToastHost` | consume `ToastService` |

Pipes: `cop` (formato `$ 12.400` es-CO) y `fechaRelativa` (`hace 5 min`, `ayer`).

## Microinteracciones

- Botones: `scale(.97)` al presionar + spinner inline en `cargando`.
- Bottom sheet: entrada con `yipa-sheet-up`, asa arrastrable visual.
- Mapa: la polilínea se dibuja con `stroke-dasharray` animado; el marcador del conductor se interpola cada tick de polling.
- Estados de espera: `yipa-pulse` en el radar de búsqueda y en el punto "en línea" del conductor.
- Toasts tipo banner iOS con blur y auto-cierre.
- Transiciones de ruta con `withViewTransitions()`.
