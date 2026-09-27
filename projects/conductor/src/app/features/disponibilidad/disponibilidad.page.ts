import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import {
  CENTRO_CIUDAD,
  ConductorService,
  ToastService,
  YipaAppBar,
  YipaButton,
  YipaMap,
  YipaSheet,
} from '@yipa/shared';
import { DisponibilidadStore } from '../../state/disponibilidad.store';

interface Zona {
  id: string;
  nombre: string;
  demanda: 'ALTA' | 'MEDIA' | 'BAJA';
  multiplicador: number;
}

/**
 * Pantalla 5 · Disponibilidad (HU-02).
 * PUT  /api/conductores/me/disponibilidad
 * POST /api/conductores/me/ubicacion
 */
@Component({
  selector: 'app-disponibilidad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaButton, YipaMap, YipaSheet],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Disponibilidad" (volver)="atras()" />

      <div class="yipa-split">
        <div class="yipa-split__map">
          <yipa-map [origen]="ubicacion" [ruta]="[]">
            <div class="estado yipa-glass" [class.is-online]="store.disponible()">
              <span class="punto"></span>
              {{ store.disponible() ? 'Visible para pasajeros' : 'Fuera de línea' }}
            </div>
          </yipa-map>
        </div>

        <div class="yipa-split__panel">
          <yipa-sheet titulo="Tu estado">
            <button
              yipa-button
              [variante]="store.disponible() ? 'peligro' : 'exito'"
              [bloque]="true"
              [cargando]="store.cambiando()"
              type="button"
              (click)="store.alternar()"
            >
              {{ store.disponible() ? 'Desconectarme' : 'Ponerme en línea' }}
            </button>

            <button
              yipa-button
              variante="fantasma"
              [bloque]="true"
              [cargando]="enviandoUbicacion()"
              type="button"
              (click)="reportarUbicacion()"
            >
              Actualizar mi ubicación
            </button>

            <h3 class="yipa-headline">Zonas con demanda</h3>
            <div class="yipa-list">
              @for (zona of zonas; track zona.id) {
                <div class="yipa-list-item">
                  <span class="yipa-grow">{{ zona.nombre }}</span>
                  <span class="demanda" [attr.data-nivel]="zona.demanda">
                    {{ zona.demanda }} ×{{ zona.multiplicador }}
                  </span>
                </div>
              }
            </div>

            <p class="yipa-caption">
              El backend usa tu última ubicación para el emparejamiento (HU-03).
            </p>
          </yipa-sheet>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .estado {
        position: absolute;
        top: calc(var(--yipa-sp-4) + env(safe-area-inset-top, 0px));
        left: var(--yipa-sp-4);
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-2);
        padding: var(--yipa-sp-2) var(--yipa-sp-4);
        font-size: var(--yipa-fs-footnote);
        box-shadow: var(--yipa-shadow-sm);
      }
      .punto {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--yipa-text-tertiary);
      }
      .estado.is-online .punto {
        background: var(--yipa-success);
        animation: yipa-pulse 1.8s ease-out infinite;
      }
      .demanda {
        font-size: var(--yipa-fs-caption);
        font-weight: var(--yipa-fw-semibold);
        padding: 3px 10px;
        border-radius: var(--yipa-radius-pill);
        background: var(--yipa-secondary-soft);
      }
      .demanda[data-nivel='ALTA'] {
        background: rgba(255, 204, 0, 0.22);
        color: #8a6d00;
      }
      .demanda[data-nivel='MEDIA'] {
        background: var(--yipa-primary-soft);
      }
    `,
  ],
})
export class DisponibilidadPage {
  protected readonly store = inject(DisponibilidadStore);
  private readonly api = inject(ConductorService);
  private readonly toast = inject(ToastService);
  private readonly location = inject(Location);

  protected readonly ubicacion = CENTRO_CIUDAD;
  protected readonly enviandoUbicacion = signal(false);

  protected readonly zonas: Zona[] = [
    { id: 'z1', nombre: 'Centro · Plaza de Bolívar', demanda: 'ALTA', multiplicador: 1.4 },
    { id: 'z2', nombre: 'Universidad del Quindío', demanda: 'MEDIA', multiplicador: 1.2 },
    { id: 'z3', nombre: 'Aeropuerto El Edén', demanda: 'ALTA', multiplicador: 1.5 },
    { id: 'z4', nombre: 'Barrio Granada', demanda: 'BAJA', multiplicador: 1 },
  ];

  protected atras(): void {
    this.location.back();
  }

  protected reportarUbicacion(): void {
    this.enviandoUbicacion.set(true);
    const ubicacion = this.store.ubicacion();
    this.api
      .reportarUbicacion({
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        registradoEn: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.enviandoUbicacion.set(false);
          this.toast.exito('Ubicación actualizada');
        },
        error: (e) => {
          this.enviandoUbicacion.set(false);
          this.toast.desdeHttp(e, 'No pudimos actualizar tu ubicación');
        },
      });
  }
}
