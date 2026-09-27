import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  CopPipe,
  EmparejamientoService,
  OfertaViaje,
  ToastService,
  YipaAppBar,
  YipaAvatar,
  YipaButton,
  YipaMap,
  YipaTarifaDesglose,
} from '@yipa/shared';

/**
 * Pantalla 7 · Detalle de solicitud (HU-04).
 * GET /api/solicitudes/{id} · POST /api/solicitudes/{id}/aceptar|rechazar
 */
@Component({
  selector: 'app-detalle-solicitud',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaAvatar, YipaButton, YipaMap, YipaTarifaDesglose, CopPipe],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Detalle de la solicitud" (volver)="atras()" />

      @if (oferta(); as o) {
        <div class="yipa-split">
          <div class="yipa-split__map">
            <yipa-map [origen]="o.origen.coordenada" [destino]="o.destino.coordenada" />
          </div>

          <div class="yipa-split__panel yipa-scroll">
            <div class="yipa-card pasajero">
              <yipa-avatar
                [nombre]="o.pasajero.nombre"
                [fotoUrl]="o.pasajero.fotoUrl"
                [tamano]="48"
              />
              <div class="yipa-grow">
                <p class="nombre">{{ o.pasajero.nombre }}</p>
                <p class="yipa-caption">★ {{ o.pasajero.calificacionPromedio }}</p>
              </div>
              <span class="metodo">{{ o.metodoPago }}</span>
            </div>

            <div class="yipa-card trayecto">
              <p class="linea"><span>🅐</span> {{ o.origen.nombre }} · {{ o.origen.direccion }}</p>
              <p class="linea"><span>🅑</span> {{ o.destino.nombre }} · {{ o.destino.direccion }}</p>
              <div class="datos">
                <span>{{ o.distanciaHastaOrigenKm }} km hasta el pasajero</span>
                <span>{{ o.distanciaViajeKm }} km · {{ o.duracionViajeMin }} min</span>
              </div>
            </div>

            <yipa-tarifa-desglose [tarifa]="o.tarifa" />

            <div class="acciones">
              <button yipa-button variante="peligro" type="button" (click)="rechazar()">
                Rechazar
              </button>
              <button
                yipa-button
                variante="exito"
                class="yipa-grow"
                [cargando]="procesando()"
                type="button"
                (click)="aceptar()"
              >
                Aceptar por {{ o.tarifa.total | cop }}
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .pasajero {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .nombre {
        font-weight: var(--yipa-fw-semibold);
      }
      .metodo {
        font-size: var(--yipa-fs-caption);
        padding: 4px 10px;
        border-radius: var(--yipa-radius-pill);
        background: var(--yipa-secondary-soft);
      }
      .trayecto {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
      .linea {
        display: flex;
        gap: var(--yipa-sp-2);
        font-size: var(--yipa-fs-subhead);
      }
      .datos {
        display: flex;
        justify-content: space-between;
        gap: var(--yipa-sp-3);
        font-size: var(--yipa-fs-caption);
        color: var(--yipa-text-secondary);
        border-top: 1px solid var(--yipa-border);
        padding-top: var(--yipa-sp-2);
      }
      .acciones {
        display: flex;
        gap: var(--yipa-sp-2);
      }
    `,
  ],
})
export class DetalleSolicitudPage implements OnInit {
  readonly solicitudId = input.required<string>();

  private readonly emparejamiento = inject(EmparejamientoService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);

  protected readonly oferta = signal<OfertaViaje | null>(null);
  protected readonly procesando = signal(false);

  ngOnInit(): void {
    this.emparejamiento.solicitudesEntrantes().subscribe({
      next: (ofertas) => {
        const encontrada = ofertas.find((o) => o.solicitudId === this.solicitudId()) ?? null;
        this.oferta.set(encontrada);
        if (!encontrada) {
          this.toast.mostrar('La solicitud ya no está disponible', 'advertencia');
          void this.router.navigate(['/app/solicitudes']);
        }
      },
      error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar la solicitud'),
    });
  }

  protected atras(): void {
    this.location.back();
  }

  protected aceptar(): void {
    this.procesando.set(true);
    this.emparejamiento.aceptar(this.solicitudId()).subscribe({
      next: (viaje) => {
        this.procesando.set(false);
        void this.router.navigate(['/viaje', viaje.id, 'asignado']);
      },
      error: (e) => {
        this.procesando.set(false);
        this.toast.desdeHttp(e, 'No pudimos aceptar la solicitud');
      },
    });
  }

  protected rechazar(): void {
    this.emparejamiento
      .rechazar(this.solicitudId(), { motivo: 'DESTINO_NO_CONVIENE' })
      .subscribe({
        next: () => void this.router.navigate(['/app/solicitudes']),
        error: (e) => this.toast.desdeHttp(e, 'No pudimos rechazar la solicitud'),
      });
  }
}
