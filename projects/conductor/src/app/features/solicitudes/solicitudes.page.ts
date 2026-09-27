import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  CopPipe,
  EmparejamientoService,
  OfertaViaje,
  ToastService,
  YipaAppBar,
  YipaAvatar,
  YipaButton,
  YipaEmptyState,
} from '@yipa/shared';
import { DisponibilidadStore } from '../../state/disponibilidad.store';

/**
 * Pantalla 6 · Solicitudes entrantes (HU-03 + HU-04).
 * GET  /api/conductores/me/solicitudes (polling; producción WebSocket)
 * POST /api/solicitudes/{id}/aceptar · /rechazar
 */
@Component({
  selector: 'app-solicitudes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaAvatar, YipaButton, YipaEmptyState, CopPipe],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Solicitudes" [conVolver]="false">
        <span class="badge" [class.is-online]="disponibilidad.disponible()">
          {{ disponibilidad.disponible() ? 'En línea' : 'Offline' }}
        </span>
      </yipa-app-bar>

      <div class="yipa-scroll">
        @if (!disponibilidad.disponible()) {
          <yipa-empty-state
            icono="🔌"
            titulo="Estás desconectado"
            descripcion="Ponte en línea para recibir solicitudes de viaje."
          />
          <button
            yipa-button
            variante="exito"
            [bloque]="true"
            [cargando]="disponibilidad.cambiando()"
            type="button"
            (click)="disponibilidad.alternar()"
          >
            Ponerme en línea
          </button>
        } @else if (!ofertas().length) {
          <yipa-empty-state
            icono="📡"
            titulo="Buscando pasajeros cerca"
            descripcion="Mantente en zona de alta demanda para recibir viajes más rápido."
          />
        }

        @for (oferta of ofertas(); track oferta.solicitudId) {
          <article class="yipa-card oferta">
            <header class="cabecera">
              <yipa-avatar
                [nombre]="oferta.pasajero.nombre"
                [fotoUrl]="oferta.pasajero.fotoUrl"
                [tamano]="44"
              />
              <div class="yipa-grow">
                <p class="nombre">{{ oferta.pasajero.nombre }}</p>
                <p class="yipa-caption">
                  ★ {{ oferta.pasajero.calificacionPromedio }} · {{ oferta.metodoPago }}
                </p>
              </div>
              <span class="cuenta">{{ oferta.expiraEnSegundos }}s</span>
            </header>

            <div class="trayecto">
              <p class="linea"><span class="marca">🅐</span> {{ oferta.origen.nombre }}</p>
              <p class="linea"><span class="marca">🅑</span> {{ oferta.destino.nombre }}</p>
            </div>

            <div class="datos">
              <span>{{ oferta.minutosHastaOrigen }} min hasta el pasajero</span>
              <span>{{ oferta.distanciaViajeKm }} km de viaje</span>
              <strong class="precio">{{ oferta.tarifa.total | cop }}</strong>
            </div>

            <div class="acciones">
              <button
                yipa-button
                variante="peligro"
                type="button"
                (click)="rechazar(oferta.solicitudId)"
              >
                Rechazar
              </button>
              <button
                yipa-button
                variante="fantasma"
                type="button"
                (click)="detalle(oferta.solicitudId)"
              >
                Detalle
              </button>
              <button
                yipa-button
                variante="exito"
                class="yipa-grow"
                [cargando]="procesando() === oferta.solicitudId"
                type="button"
                (click)="aceptar(oferta.solicitudId)"
              >
                Aceptar
              </button>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .badge {
        font-size: var(--yipa-fs-caption2);
        font-weight: var(--yipa-fw-semibold);
        padding: 4px 10px;
        border-radius: var(--yipa-radius-pill);
        background: var(--yipa-secondary-soft);
        color: var(--yipa-text-secondary);
        white-space: nowrap;
      }
      .badge.is-online {
        background: rgba(52, 199, 89, 0.14);
        color: var(--yipa-success);
      }
      .oferta {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-3);
        animation: yipa-pop var(--yipa-dur-base) var(--yipa-ease) both;
      }
      .cabecera {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .nombre {
        font-weight: var(--yipa-fw-semibold);
      }
      .cuenta {
        font-variant-numeric: tabular-nums;
        font-weight: var(--yipa-fw-bold);
        color: var(--yipa-primary-dark);
        background: var(--yipa-primary-soft);
        padding: 4px 10px;
        border-radius: var(--yipa-radius-pill);
      }
      .trayecto {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .linea {
        display: flex;
        gap: var(--yipa-sp-2);
        font-size: var(--yipa-fs-subhead);
      }
      .datos {
        display: flex;
        align-items: baseline;
        gap: var(--yipa-sp-3);
        flex-wrap: wrap;
        font-size: var(--yipa-fs-caption);
        color: var(--yipa-text-secondary);
      }
      .precio {
        margin-left: auto;
        font-size: var(--yipa-fs-headline);
        color: var(--yipa-text);
      }
      .acciones {
        display: flex;
        gap: var(--yipa-sp-2);
      }
    `,
  ],
})
export class SolicitudesPage implements OnInit {
  protected readonly disponibilidad = inject(DisponibilidadStore);
  private readonly emparejamiento = inject(EmparejamientoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly ofertas = signal<OfertaViaje[]>([]);
  protected readonly procesando = signal<string | null>(null);

  ngOnInit(): void {
    this.emparejamiento
      .observarSolicitudesEntrantes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ofertas) => this.ofertas.set(ofertas),
        error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar las solicitudes'),
      });
  }

  protected detalle(solicitudId: string): void {
    void this.router.navigate(['/solicitudes', solicitudId]);
  }

  /** HU-04: aceptar crea el viaje. */
  protected aceptar(solicitudId: string): void {
    this.procesando.set(solicitudId);
    this.emparejamiento.aceptar(solicitudId).subscribe({
      next: (viaje) => {
        this.procesando.set(null);
        void this.router.navigate(['/viaje', viaje.id, 'asignado']);
      },
      error: (e) => {
        this.procesando.set(null);
        this.toast.desdeHttp(e, 'La solicitud ya no está disponible');
      },
    });
  }

  /** HU-04: rechazar devuelve la solicitud al emparejamiento. */
  protected rechazar(solicitudId: string): void {
    this.emparejamiento.rechazar(solicitudId, { motivo: 'MUY_LEJOS' }).subscribe({
      next: () => {
        this.ofertas.set(this.ofertas().filter((o) => o.solicitudId !== solicitudId));
        this.toast.mostrar('Solicitud rechazada');
      },
      error: (e) => this.toast.desdeHttp(e, 'No pudimos rechazar la solicitud'),
    });
  }
}
