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
  EmparejamientoService,
  SolicitudViaje,
  ToastService,
  ViajeService,
  YipaButton,
  YipaMap,
  YipaSheet,
  generarRuta,
} from '@yipa/shared';
import { SolicitudStore } from '../../state/solicitud.store';

/**
 * Pantalla 6 · Esperando conductor (HU-03 + HU-10).
 * GET  /api/solicitudes/{id}   (polling; en producción WebSocket)
 * POST /api/viajes/{id}/cancelacion
 */
@Component({
  selector: 'app-esperando',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaButton, YipaMap, YipaSheet, CopPipe],
  template: `
    <section class="yipa-screen">
      <div class="yipa-split">
        <div class="yipa-split__map">
          <yipa-map
            [origen]="solicitud()?.origen?.coordenada"
            [destino]="solicitud()?.destino?.coordenada"
            [ruta]="ruta()"
          />
        </div>

        <div class="yipa-split__panel">
          <yipa-sheet>
            <div class="estado">
              <span class="radar"></span>
              <div>
                <h2 class="yipa-title-2">{{ titulo() }}</h2>
                <p class="yipa-subhead">{{ detalle() }}</p>
              </div>
            </div>

            @if (solicitud(); as s) {
              <div class="yipa-card resumen">
                <div class="fila">
                  <span class="yipa-caption">Destino</span>
                  <span>{{ s.destino.nombre }}</span>
                </div>
                <div class="fila">
                  <span class="yipa-caption">Tarifa estimada</span>
                  <span class="precio">{{ s.tarifaEstimada.total | cop }}</span>
                </div>
                <div class="fila">
                  <span class="yipa-caption">Pago</span>
                  <span>{{ s.metodoPago }}</span>
                </div>
              </div>
            }

            <button
              yipa-button
              variante="peligro"
              [bloque]="true"
              [cargando]="cancelando()"
              type="button"
              (click)="cancelar()"
            >
              Cancelar solicitud
            </button>
          </yipa-sheet>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .estado {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-4);
      }
      .radar {
        width: 46px;
        height: 46px;
        flex: none;
        border-radius: 50%;
        background: var(--yipa-primary-soft);
        border: 2px solid var(--yipa-primary);
        animation: yipa-pulse 1.6s ease-out infinite;
      }
      .resumen {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
      .fila {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .precio {
        font-weight: var(--yipa-fw-bold);
      }
    `,
  ],
})
export class EsperandoPage implements OnInit {
  readonly solicitudId = input.required<string>();

  private readonly emparejamiento = inject(EmparejamientoService);
  private readonly viajes = inject(ViajeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly store = inject(SolicitudStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly solicitud = signal<SolicitudViaje | null>(null);
  protected readonly cancelando = signal(false);
  protected readonly ruta = signal<ReturnType<typeof generarRuta>>([]);

  protected titulo(): string {
    const estado = this.solicitud()?.estado;
    if (estado === 'OFRECIDA') return 'Conductor encontrado';
    if (estado === 'SIN_CONDUCTORES') return 'Sin conductores cerca';
    return 'Buscando tu YIPA…';
  }

  protected detalle(): string {
    const estado = this.solicitud()?.estado;
    if (estado === 'OFRECIDA') return 'Confirmando con el conductor más cercano';
    if (estado === 'SIN_CONDUCTORES') return 'Intenta de nuevo en unos minutos';
    return 'Estamos emparejándote con un conductor disponible';
  }

  ngOnInit(): void {
    this.emparejamiento
      .observarSolicitud(this.solicitudId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitud) => {
          this.solicitud.set(solicitud);
          this.ruta.set(generarRuta(solicitud.origen.coordenada, solicitud.destino.coordenada));
          if (solicitud.estado === 'ACEPTADA' && solicitud.viajeId) {
            this.store.reiniciar();
            void this.router.navigate(['/viaje', solicitud.viajeId, 'seguimiento']);
          }
          if (solicitud.estado === 'SIN_CONDUCTORES') {
            this.toast.error('No encontramos conductores disponibles');
          }
        },
        error: (e) => this.toast.desdeHttp(e, 'Perdimos el estado de la solicitud'),
      });
  }

  /** HU-10: cancelar antes de que exista viaje asignado. */
  protected cancelar(): void {
    const viajeId = this.solicitud()?.viajeId;
    this.cancelando.set(true);
    if (!viajeId) {
      this.emparejamiento.cancelarSolicitud(this.solicitudId()).subscribe({
        next: () => {
          this.cancelando.set(false);
          this.store.reiniciar();
          this.toast.mostrar('Solicitud cancelada');
          void this.router.navigate(['/app/inicio']);
        },
        error: (e) => {
          this.cancelando.set(false);
          this.toast.desdeHttp(e, 'No pudimos cancelar la solicitud');
        },
      });
      return;
    }
    this.viajes.cancelar(viajeId, { motivo: 'CAMBIO_DE_PLANES' }).subscribe({
      next: (res) => {
        this.cancelando.set(false);
        this.toast.mostrar(res.mensaje);
        void this.router.navigate(['/app/inicio']);
      },
      error: (e) => {
        this.cancelando.set(false);
        this.toast.desdeHttp(e, 'No pudimos cancelar');
      },
    });
  }
}
