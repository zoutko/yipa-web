import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ConductorService,
  CopPipe,
  ResumenConductor,
  SessionStore,
  ToastService,
  ViajeService,
  YipaAvatar,
  YipaButton,
  YipaRating,
} from '@yipa/shared';
import { DisponibilidadStore } from '../../state/disponibilidad.store';

/**
 * Pantalla 4 · Dashboard del conductor (HU-02 + métricas).
 * GET /api/conductores/me/resumen · GET /api/viajes/activo
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, YipaAvatar, YipaButton, YipaRating, CopPipe],
  template: `
    <section class="yipa-screen">
      <div class="yipa-scroll">
        <header class="cabecera">
          <yipa-avatar [nombre]="session.nombreCompleto()" [tamano]="52" />
          <div class="yipa-grow">
            <p class="yipa-caption">Hola,</p>
            <h2 class="yipa-title-2">{{ session.usuario()?.nombre }}</h2>
          </div>
          <span class="badge" [class.is-online]="disponibilidad.disponible()">
            {{ disponibilidad.disponible() ? 'En línea' : 'Desconectado' }}
          </span>
        </header>

        <div class="conmutador yipa-card" [class.is-online]="disponibilidad.disponible()">
          <div class="yipa-grow">
            <p class="yipa-headline">
              {{ disponibilidad.disponible() ? 'Recibiendo solicitudes' : 'Ponte en línea' }}
            </p>
            <p class="yipa-caption">
              {{
                disponibilidad.disponible()
                  ? 'Te avisaremos cuando llegue un viaje'
                  : 'Conéctate para empezar a recibir viajes'
              }}
            </p>
          </div>
          <button
            yipa-button
            [variante]="disponibilidad.disponible() ? 'peligro' : 'exito'"
            [cargando]="disponibilidad.cambiando()"
            type="button"
            (click)="disponibilidad.alternar()"
          >
            {{ disponibilidad.disponible() ? 'Desconectar' : 'Conectar' }}
          </button>
        </div>

        @if (resumen(); as r) {
          <div class="metricas">
            <div class="metrica yipa-card">
              <span class="yipa-caption">Ganancias hoy</span>
              <strong class="valor">{{ r.gananciasHoy.monto | cop }}</strong>
            </div>
            <div class="metrica yipa-card">
              <span class="yipa-caption">Viajes hoy</span>
              <strong class="valor">{{ r.viajesHoy }}</strong>
            </div>
            <div class="metrica yipa-card">
              <span class="yipa-caption">Horas en línea</span>
              <strong class="valor">{{ r.horasEnLinea }} h</strong>
            </div>
            <div class="metrica yipa-card">
              <span class="yipa-caption">Semana</span>
              <strong class="valor">{{ r.gananciasSemana.monto | cop }}</strong>
            </div>
          </div>

          <div class="yipa-card calificacion">
            <div class="yipa-grow">
              <p class="yipa-headline">Tu calificación</p>
              <yipa-rating [valor]="r.calificacionPromedio" [tamano]="16" />
            </div>
            <div class="aceptacion">
              <span class="yipa-caption">Aceptación</span>
              <strong>{{ (r.tasaAceptacion * 100).toFixed(0) }}%</strong>
            </div>
          </div>
        }

        <a yipa-button variante="secundario" class="bloque" routerLink="/app/solicitudes">
          Ver solicitudes entrantes
        </a>
        <a yipa-button variante="fantasma" class="bloque" routerLink="/app/disponibilidad">
          Configurar disponibilidad
        </a>
      </div>
    </section>
  `,
  styles: [
    `
      .cabecera {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .badge {
        font-size: var(--yipa-fs-caption);
        font-weight: var(--yipa-fw-semibold);
        padding: 5px 12px;
        border-radius: var(--yipa-radius-pill);
        background: var(--yipa-secondary-soft);
        color: var(--yipa-text-secondary);
      }
      .badge.is-online {
        background: rgba(52, 199, 89, 0.14);
        color: var(--yipa-success);
      }
      .conmutador {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
        border: 1.5px solid transparent;
        transition: border-color var(--yipa-dur-base) var(--yipa-ease);
      }
      .conmutador.is-online {
        border-color: var(--yipa-success);
      }
      .metricas {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--yipa-sp-3);
      }
      .metrica {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .valor {
        font-size: var(--yipa-fs-title3);
        font-weight: var(--yipa-fw-bold);
      }
      .calificacion {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .aceptacion {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .bloque {
        width: 100%;
      }
      @media (min-width: 768px) {
        .metricas {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    `,
  ],
})
export class DashboardPage implements OnInit {
  protected readonly session = inject(SessionStore);
  protected readonly disponibilidad = inject(DisponibilidadStore);
  private readonly viajes = inject(ViajeService);
  private readonly conductores = inject(ConductorService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly resumen = signal<ResumenConductor | null>(null);

  ngOnInit(): void {
    this.cargarResumen();
    this.viajes.activo().subscribe((viaje) => {
      if (viaje && viaje.estado !== 'FINALIZADO' && viaje.estado !== 'CANCELADO') {
        const ruta = viaje.estado === 'EN_CURSO' ? 'navegacion' : 'asignado';
        void this.router.navigate(['/viaje', viaje.id, ruta]);
      }
    });
  }

  private cargarResumen(): void {
    this.conductores.resumen().subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.disponibilidad.sincronizar(resumen.estado);
      },
      error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar tu resumen'),
    });
  }
}
