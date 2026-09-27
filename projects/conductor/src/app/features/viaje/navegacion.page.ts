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
  YipaButton,
  YipaMap,
  YipaSheet,
} from '@yipa/shared';

/**
 * Pantalla 9 · Navegación del viaje (HU-05, HU-06).
 * GET /api/viajes/{id} (polling) · PATCH /api/viajes/{id}/estado {FINALIZAR_VIAJE}
 */
@Component({
  selector: 'app-navegacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaButton, YipaMap, YipaSheet, CopPipe],
  template: `
    <section class="yipa-screen">
      @if (viaje(); as v) {
        <div class="yipa-split">
          <div class="yipa-split__map">
            <yipa-map
              [ruta]="v.ruta"
              [origen]="v.origen.coordenada"
              [destino]="v.destino.coordenada"
              [conductor]="v.ubicacionConductor"
            >
              <div class="indicacion yipa-glass">
                <span class="flecha">⬆️</span>
                <div>
                  <strong>Continúa hacia {{ v.destino.nombre }}</strong>
                  <p class="yipa-caption">{{ v.etaMinutos ?? 0 }} min · {{ v.distanciaKm }} km</p>
                </div>
              </div>
            </yipa-map>
          </div>

          <div class="yipa-split__panel">
            <yipa-sheet titulo="Viaje en curso">
              <div class="metricas">
                <div class="metrica">
                  <span class="yipa-caption">Pasajero</span>
                  <strong>{{ v.pasajero.nombre }}</strong>
                </div>
                <div class="metrica">
                  <span class="yipa-caption">Pago</span>
                  <strong>{{ v.metodoPago }}</strong>
                </div>
                <div class="metrica">
                  <span class="yipa-caption">Ganas</span>
                  <strong>{{ v.tarifa.total | cop }}</strong>
                </div>
              </div>

              <p class="destino">🅑 {{ v.destino.direccion }}</p>

              <button
                yipa-button
                variante="exito"
                [bloque]="true"
                [cargando]="procesando()"
                type="button"
                (click)="finalizar()"
              >
                Finalizar viaje
              </button>
            </yipa-sheet>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .indicacion {
        position: absolute;
        top: calc(var(--yipa-sp-4) + env(safe-area-inset-top, 0px));
        left: var(--yipa-sp-4);
        right: var(--yipa-sp-4);
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
        padding: var(--yipa-sp-3) var(--yipa-sp-4);
        box-shadow: var(--yipa-shadow-sm);
      }
      .flecha {
        font-size: 24px;
      }
      .metricas {
        display: flex;
        gap: var(--yipa-sp-4);
      }
      .metrica {
        display: flex;
        flex-direction: column;
      }
      .destino {
        font-size: var(--yipa-fs-subhead);
      }
    `,
  ],
})
export class NavegacionPage implements OnInit {
  readonly viajeId = input.required<string>();

  private readonly viajes = inject(ViajeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly viaje = signal<Viaje | null>(null);
  protected readonly procesando = signal(false);

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
        },
        error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar el viaje'),
      });
  }

  protected finalizar(): void {
    this.procesando.set(true);
    this.viajes.cambiarEstado(this.viajeId(), { accion: 'FINALIZAR_VIAJE' }).subscribe({
      next: (viaje) => {
        this.procesando.set(false);
        void this.router.navigate(['/viaje', viaje.id, 'finalizado']);
      },
      error: (e) => {
        this.procesando.set(false);
        this.toast.desdeHttp(e, 'No pudimos finalizar el viaje');
      },
    });
  }
}
