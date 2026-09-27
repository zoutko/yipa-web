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
  MotivoCancelacion,
  ToastService,
  Viaje,
  ViajeService,
  YipaAvatar,
  YipaButton,
  YipaEstadoViaje,
  YipaMap,
  YipaRating,
  YipaSheet,
} from '@yipa/shared';

/**
 * Pantalla 7 · Seguimiento del viaje (HU-05, HU-06, HU-10).
 * GET  /api/viajes/{id}          (polling)
 * POST /api/viajes/{id}/cancelacion
 */
@Component({
  selector: 'app-seguimiento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaMap, YipaSheet, YipaAvatar, YipaButton, YipaRating, YipaEstadoViaje, CopPipe],
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
            @if (viaje(); as v) {
              <div class="eta yipa-glass">
                <span class="eta-valor">{{ v.etaMinutos ?? 1 }}</span>
                <span class="yipa-caption">min para llegar</span>
              </div>
            }
          </yipa-map>
        </div>

        <div class="yipa-split__panel">
          <yipa-sheet>
            @if (viaje(); as v) {
              <h2 class="yipa-title-2">{{ mensaje(v) }}</h2>

              @if (v.conductor; as c) {
                <div class="conductor yipa-card">
                  <yipa-avatar [nombre]="c.nombre" [fotoUrl]="c.fotoUrl" [tamano]="52" />
                  <div class="yipa-grow">
                    <p class="nombre">{{ c.nombre }}</p>
                    <yipa-rating [valor]="c.calificacionPromedio" [tamano]="14" />
                    <p class="yipa-caption">
                      {{ c.vehiculo.marca }} {{ c.vehiculo.modelo }} · {{ c.vehiculo.color }}
                    </p>
                  </div>
                  <span class="placa">{{ c.vehiculo.placa }}</span>
                </div>
              }

              <yipa-estado-viaje [estado]="v.estado" />

              <div class="fila">
                <span class="yipa-caption">Tarifa estimada</span>
                <span class="precio">{{ v.tarifa.total | cop }}</span>
              </div>

              @if (confirmandoCancelacion()) {
                <div class="yipa-card motivos">
                  <p class="yipa-headline">¿Por qué cancelas?</p>
                  @for (motivo of motivos; track motivo.valor) {
                    <button class="yipa-list-item" type="button" (click)="cancelar(motivo.valor)">
                      {{ motivo.nombre }}
                    </button>
                  }
                  <button
                    yipa-button
                    variante="fantasma"
                    [bloque]="true"
                    type="button"
                    (click)="confirmandoCancelacion.set(false)"
                  >
                    Volver
                  </button>
                </div>
              } @else {
                <button
                  yipa-button
                  variante="peligro"
                  [bloque]="true"
                  [cargando]="cancelando()"
                  type="button"
                  (click)="confirmandoCancelacion.set(true)"
                >
                  Cancelar viaje
                </button>
              }
            }
          </yipa-sheet>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .eta {
        position: absolute;
        top: calc(var(--yipa-sp-4) + env(safe-area-inset-top, 0px));
        left: var(--yipa-sp-4);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--yipa-sp-3) var(--yipa-sp-4);
        box-shadow: var(--yipa-shadow-sm);
      }
      .eta-valor {
        font-size: var(--yipa-fs-title1);
        font-weight: var(--yipa-fw-bold);
        line-height: 1;
      }
      .conductor {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .nombre {
        font-weight: var(--yipa-fw-semibold);
      }
      .placa {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-weight: var(--yipa-fw-bold);
        background: var(--yipa-secondary);
        color: var(--yipa-text-on-dark);
        padding: 6px 10px;
        border-radius: var(--yipa-radius-sm);
        letter-spacing: 0.08em;
      }
      .fila {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .precio {
        font-weight: var(--yipa-fw-bold);
      }
      .motivos {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
    `,
  ],
})
export class SeguimientoPage implements OnInit {
  readonly viajeId = input.required<string>();

  private readonly viajes = inject(ViajeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly viaje = signal<Viaje | null>(null);
  protected readonly cancelando = signal(false);
  protected readonly confirmandoCancelacion = signal(false);

  protected readonly motivos: Array<{ valor: MotivoCancelacion; nombre: string }> = [
    { valor: 'DEMORA_EXCESIVA', nombre: 'El conductor se demora' },
    { valor: 'CONDUCTOR_NO_LLEGA', nombre: 'El conductor no llega' },
    { valor: 'CAMBIO_DE_PLANES', nombre: 'Cambié de planes' },
    { valor: 'ERROR_EN_DIRECCION', nombre: 'Me equivoqué de dirección' },
    { valor: 'OTRO', nombre: 'Otro motivo' },
  ];

  protected mensaje(viaje: Viaje): string {
    switch (viaje.estado) {
      case 'CONDUCTOR_ASIGNADO':
        return 'Tu conductor va en camino';
      case 'CONDUCTOR_EN_CAMINO':
        return `Llega en ${viaje.etaMinutos ?? 1} min`;
      case 'CONDUCTOR_LLEGO':
        return 'Tu YIPA te espera afuera';
      default:
        return 'Siguiendo tu viaje';
    }
  }

  ngOnInit(): void {
    this.viajes
      .observar(this.viajeId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (viaje) => {
          this.viaje.set(viaje);
          if (viaje.estado === 'EN_CURSO') {
            void this.router.navigate(['/viaje', viaje.id, 'en-curso']);
          }
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

  /** HU-10. */
  protected cancelar(motivo: MotivoCancelacion): void {
    this.cancelando.set(true);
    this.viajes.cancelar(this.viajeId(), { motivo }).subscribe({
      next: (res) => {
        this.cancelando.set(false);
        this.toast.mostrar(res.mensaje);
        void this.router.navigate(['/app/inicio']);
      },
      error: (e) => {
        this.cancelando.set(false);
        this.toast.desdeHttp(e, 'No pudimos cancelar el viaje');
      },
    });
  }
}
