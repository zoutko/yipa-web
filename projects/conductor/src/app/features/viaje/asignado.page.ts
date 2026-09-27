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
  YipaButton,
  YipaEstadoViaje,
  YipaMap,
  YipaSheet,
} from '@yipa/shared';

/**
 * Pantalla 8 · Viaje asignado (HU-05, HU-06).
 * GET /api/viajes/{id} (polling) · PATCH /api/viajes/{id}/estado
 */
@Component({
  selector: 'app-asignado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAvatar, YipaButton, YipaEstadoViaje, YipaMap, YipaSheet, CopPipe],
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
              <div class="eta yipa-glass">
                <strong>{{ v.etaMinutos ?? 0 }} min</strong>
                <span class="yipa-caption">hasta el punto de recogida</span>
              </div>
            </yipa-map>
          </div>

          <div class="yipa-split__panel">
            <yipa-sheet titulo="Recoger pasajero">
              <yipa-estado-viaje [estado]="v.estado" />

              <div class="pasajero">
                <yipa-avatar
                  [nombre]="v.pasajero.nombre"
                  [fotoUrl]="v.pasajero.fotoUrl"
                  [tamano]="48"
                />
                <div class="yipa-grow">
                  <p class="nombre">{{ v.pasajero.nombre }}</p>
                  <p class="yipa-caption">★ {{ v.pasajero.calificacionPromedio }}</p>
                </div>
                <strong>{{ v.tarifa.total | cop }}</strong>
              </div>

              <div class="direcciones">
                <p class="linea"><span>🅐</span> {{ v.origen.direccion }}</p>
                <p class="linea"><span>🅑</span> {{ v.destino.direccion }}</p>
              </div>

              @if (v.estado === 'CONDUCTOR_EN_CAMINO' || v.estado === 'CONDUCTOR_ASIGNADO') {
                <button
                  yipa-button
                  [bloque]="true"
                  [cargando]="procesando()"
                  type="button"
                  (click)="accion('CONFIRMAR_LLEGADA')"
                >
                  Llegué al punto de recogida
                </button>
              } @else if (v.estado === 'CONDUCTOR_LLEGO') {
                <button
                  yipa-button
                  variante="exito"
                  [bloque]="true"
                  [cargando]="procesando()"
                  type="button"
                  (click)="accion('INICIAR_VIAJE')"
                >
                  Iniciar viaje
                </button>
              }

              <button
                yipa-button
                variante="peligro"
                [bloque]="true"
                type="button"
                (click)="cancelar()"
              >
                Cancelar viaje
              </button>
            </yipa-sheet>
          </div>
        </div>
      }
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
        padding: var(--yipa-sp-2) var(--yipa-sp-4);
        box-shadow: var(--yipa-shadow-sm);
      }
      .pasajero {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .nombre {
        font-weight: var(--yipa-fw-semibold);
      }
      .direcciones {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: var(--yipa-fs-subhead);
      }
      .linea {
        display: flex;
        gap: var(--yipa-sp-2);
      }
    `,
  ],
})
export class AsignadoPage implements OnInit {
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
          if (viaje.estado === 'EN_CURSO') {
            void this.router.navigate(['/viaje', viaje.id, 'navegacion']);
          }
          if (viaje.estado === 'CANCELADO') {
            this.toast.mostrar('El pasajero canceló el viaje', 'advertencia');
            void this.router.navigate(['/app/dashboard']);
          }
        },
        error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar el viaje'),
      });
  }

  protected accion(accion: 'CONFIRMAR_LLEGADA' | 'INICIAR_VIAJE'): void {
    this.procesando.set(true);
    this.viajes.cambiarEstado(this.viajeId(), { accion }).subscribe({
      next: (viaje) => {
        this.procesando.set(false);
        this.viaje.set(viaje);
        if (viaje.estado === 'EN_CURSO') {
          void this.router.navigate(['/viaje', viaje.id, 'navegacion']);
        }
      },
      error: (e) => {
        this.procesando.set(false);
        this.toast.desdeHttp(e, 'No pudimos actualizar el estado');
      },
    });
  }

  protected cancelar(): void {
    this.viajes
      .cancelar(this.viajeId(), { motivo: 'OTRO', comentario: 'Cancelado por el conductor' })
      .subscribe({
        next: () => {
          this.toast.mostrar('Viaje cancelado');
          void this.router.navigate(['/app/dashboard']);
        },
        error: (e) => this.toast.desdeHttp(e, 'No pudimos cancelar el viaje'),
      });
  }
}
