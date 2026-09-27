import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  CopPipe,
  ToastService,
  Viaje,
  ViajeService,
  YipaAvatar,
  YipaEstadoViaje,
  YipaMap,
  YipaSheet,
} from '@yipa/shared';

/**
 * Pantalla 8 · Viaje en curso (HU-05, HU-06).
 * GET /api/viajes/{id} (polling; producción WebSocket)
 */
@Component({
  selector: 'app-en-curso',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaMap, YipaSheet, YipaAvatar, YipaEstadoViaje, CopPipe],
  template: `
    <section class="yipa-screen">
      <div class="yipa-split">
        <div class="yipa-split__map">
          <yipa-map
            [origen]="viaje()?.origen?.coordenada"
            [destino]="viaje()?.destino?.coordenada"
            [ruta]="viaje()?.ruta ?? []"
            [conductor]="viaje()?.ubicacionConductor"
          >
            <div class="banda yipa-glass">
              <span class="punto"></span>
              <span>En camino a {{ viaje()?.destino?.nombre }}</span>
              <span class="eta">{{ viaje()?.etaMinutos ?? 1 }} min</span>
            </div>
          </yipa-map>
        </div>

        <div class="yipa-split__panel">
          <yipa-sheet>
            @if (viaje(); as v) {
              <h2 class="yipa-title-2">Disfruta el viaje</h2>
              <yipa-estado-viaje [estado]="v.estado" />

              @if (v.conductor; as c) {
                <div class="conductor yipa-card">
                  <yipa-avatar [nombre]="c.nombre" [fotoUrl]="c.fotoUrl" [tamano]="46" />
                  <div class="yipa-grow">
                    <p class="nombre">{{ c.nombre }}</p>
                    <p class="yipa-caption">
                      {{ c.vehiculo.marca }} {{ c.vehiculo.modelo }} · {{ c.vehiculo.placa }}
                    </p>
                  </div>
                  <a class="llamar" [href]="'tel:' + c.telefono" aria-label="Llamar al conductor">
                    📞
                  </a>
                </div>
              }

              <div class="metricas">
                <div class="metrica">
                  <span class="yipa-caption">Distancia</span>
                  <strong>{{ v.distanciaKm }} km</strong>
                </div>
                <div class="metrica">
                  <span class="yipa-caption">Duración</span>
                  <strong>{{ v.duracionMin }} min</strong>
                </div>
                <div class="metrica">
                  <span class="yipa-caption">Total</span>
                  <strong>{{ v.tarifa.total | cop }}</strong>
                </div>
              </div>
            }
          </yipa-sheet>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .banda {
        position: absolute;
        top: calc(var(--yipa-sp-4) + env(safe-area-inset-top, 0px));
        left: var(--yipa-sp-4);
        right: var(--yipa-sp-4);
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-2);
        padding: var(--yipa-sp-3) var(--yipa-sp-4);
        font-size: var(--yipa-fs-footnote);
        box-shadow: var(--yipa-shadow-sm);
      }
      .punto {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--yipa-success);
        animation: yipa-pulse 1.8s ease-out infinite;
      }
      .eta {
        margin-left: auto;
        font-weight: var(--yipa-fw-bold);
      }
      .conductor {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .nombre {
        font-weight: var(--yipa-fw-semibold);
      }
      .llamar {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--yipa-primary-soft);
        font-size: 18px;
      }
      .metricas {
        display: flex;
        gap: var(--yipa-sp-3);
      }
      .metrica {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--yipa-sp-3);
        border-radius: var(--yipa-radius-md);
        background: var(--yipa-surface-alt);
      }
    `,
  ],
})
export class EnCursoPage implements OnInit {
  readonly viajeId = input.required<string>();

  private readonly viajes = inject(ViajeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly viaje = signal<Viaje | null>(null);

  ngOnInit(): void {
    this.viajes
      .observar(this.viajeId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (viaje) => {
          this.viaje.set(viaje);
          if (viaje.estado === 'FINALIZADO') {
            void this.router.navigate(['/viaje', viaje.id, 'finalizado']);
          }
          if (viaje.estado === 'CANCELADO') {
            void this.router.navigate(['/app/inicio']);
          }
        },
        error: (e) => this.toast.desdeHttp(e, 'No pudimos seguir el viaje'),
      });
  }
}
