import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Coordenada } from '../domain/models';

interface Punto {
  x: number;
  y: number;
}

/**
 * Mapa simulado (estética Apple Maps) construido con SVG.
 *
 * En producción se reemplaza por Google Maps / Mapbox manteniendo la misma
 * API de entradas: `ruta`, `origen`, `destino`, `conductor`.
 */
@Component({
  selector: 'yipa-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mapa">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-label="Mapa del viaje">
        <defs>
          <pattern id="calles" width="12.5" height="12.5" patternUnits="userSpaceOnUse">
            <path d="M12.5 0 L0 0 0 12.5" fill="none" stroke="rgba(31,31,31,0.07)" stroke-width="0.6" />
          </pattern>
          <linearGradient id="ruta-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1f1f1f" />
            <stop offset="100%" stop-color="#4a4a4a" />
          </linearGradient>
        </defs>

        <rect width="100" height="100" fill="#eef1ec" />
        <rect width="100" height="100" fill="url(#calles)" />
        <circle cx="22" cy="72" r="14" fill="#dce8d5" opacity="0.9" />
        <circle cx="78" cy="26" r="11" fill="#dce8d5" opacity="0.8" />
        <rect x="52" y="60" width="26" height="18" rx="3" fill="#e6ecf5" opacity="0.9" />
        <path d="M0 58 Q 30 52 55 62 T 100 56" fill="none" stroke="#cfe0f5" stroke-width="3" opacity="0.8" />

        @if (puntosRuta().length > 1) {
          <polyline
            [attr.points]="lineaRuta()"
            fill="none"
            stroke="rgba(31,31,31,0.18)"
            stroke-width="4.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            [attr.points]="lineaRuta()"
            fill="none"
            stroke="url(#ruta-grad)"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="ruta-anim"
          />
        }

        @if (puntoOrigen(); as p) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2.6" fill="#1f1f1f" />
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="1.1" fill="#fff" />
        }

        @if (puntoDestino(); as p) {
          <rect [attr.x]="p.x - 2.2" [attr.y]="p.y - 2.2" width="4.4" height="4.4" rx="1.2" fill="#1f1f1f" />
          <rect [attr.x]="p.x - 0.8" [attr.y]="p.y - 0.8" width="1.6" height="1.6" fill="#f4c542" />
        }

        @if (puntoConductor(); as p) {
          <g class="conductor" [style.transform]="'translate(' + p.x + 'px,' + p.y + 'px)'">
            <circle r="5.2" fill="rgba(244,197,66,0.35)" class="pulso" />
            <circle r="3.2" fill="#f4c542" stroke="#1f1f1f" stroke-width="0.8" />
            <text y="1.2" text-anchor="middle" font-size="3">🚙</text>
          </g>
        }
      </svg>

      <div class="atribucion">YIPA Maps · simulación</div>
      <ng-content />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .mapa {
        position: relative;
        height: 100%;
        min-height: 220px;
        overflow: hidden;
        background: #eef1ec;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      .ruta-anim {
        stroke-dasharray: 220;
        stroke-dashoffset: 220;
        animation: dibujar 1.4s var(--yipa-ease) forwards;
      }
      @keyframes dibujar {
        to {
          stroke-dashoffset: 0;
        }
      }
      .conductor {
        transition: transform 1.6s linear;
      }
      .pulso {
        animation: yipa-pulse 2s ease-out infinite;
        transform-origin: center;
      }
      .atribucion {
        position: absolute;
        right: 8px;
        bottom: 8px;
        font-size: 10px;
        color: rgba(32, 33, 36, 0.45);
        background: rgba(255, 255, 255, 0.7);
        padding: 2px 6px;
        border-radius: var(--yipa-radius-pill);
      }
    `,
  ],
})
export class YipaMap {
  readonly ruta = input<Coordenada[]>([]);
  readonly origen = input<Coordenada | undefined>();
  readonly destino = input<Coordenada | undefined>();
  readonly conductor = input<Coordenada | undefined>();

  private readonly limites = computed(() => {
    const puntos = [
      ...this.ruta(),
      ...[this.origen(), this.destino(), this.conductor()].filter((p): p is Coordenada => !!p),
    ];
    if (!puntos.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    const lats = puntos.map((p) => p.lat);
    const lngs = puntos.map((p) => p.lng);
    const pad = 0.004;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  });

  private proyectar(c: Coordenada): Punto {
    const { minLat, maxLat, minLng, maxLng } = this.limites();
    const x = ((c.lng - minLng) / Math.max(1e-6, maxLng - minLng)) * 100;
    const y = 100 - ((c.lat - minLat) / Math.max(1e-6, maxLat - minLat)) * 100;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  }

  protected readonly puntosRuta = computed(() => this.ruta().map((c) => this.proyectar(c)));
  protected readonly lineaRuta = computed(() =>
    this.puntosRuta()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );
  protected readonly puntoOrigen = computed(() => {
    const o = this.origen();
    return o ? this.proyectar(o) : null;
  });
  protected readonly puntoDestino = computed(() => {
    const d = this.destino();
    return d ? this.proyectar(d) : null;
  });
  protected readonly puntoConductor = computed(() => {
    const c = this.conductor();
    return c ? this.proyectar(c) : null;
  });
}
