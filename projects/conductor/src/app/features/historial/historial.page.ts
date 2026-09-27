import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CopPipe,
  FechaRelativaPipe,
  ResumenViajeHistorial,
  ToastService,
  ViajeService,
  YipaAppBar,
  YipaButton,
  YipaEmptyState,
  YipaRating,
} from '@yipa/shared';

/**
 * Pantalla 12 · Historial de viajes (HU-09).
 * GET /api/viajes?rol=CONDUCTOR&page=&size=
 */
@Component({
  selector: 'app-historial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaButton, YipaEmptyState, YipaRating, CopPipe, FechaRelativaPipe],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Mis ganancias" [conVolver]="false" />

      <div class="yipa-scroll">
        @if (!cargando() && !viajes().length) {
          <yipa-empty-state
            icono="🧾"
            titulo="Aún no tienes viajes"
            descripcion="Los viajes que completes aparecerán aquí con su liquidación."
          />
        }

        @for (viaje of viajes(); track viaje.id) {
          <article class="yipa-card viaje" (click)="abrir(viaje)">
            <div class="cabecera">
              <span class="categoria">{{ icono(viaje.categoria) }}</span>
              <div class="yipa-grow">
                <p class="destino">{{ viaje.destino }}</p>
                <p class="yipa-caption">{{ viaje.origen }}</p>
              </div>
              <div class="derecha">
                <strong>{{ viaje.total.monto | cop }}</strong>
                <span class="yipa-caption">{{ viaje.fecha | fechaRelativa }}</span>
              </div>
            </div>
            <div class="pie">
              <span class="estado" [class.is-cancelado]="viaje.estado === 'CANCELADO'">
                {{ viaje.estado === 'CANCELADO' ? 'Cancelado' : 'Completado' }}
              </span>
              <span class="yipa-grow yipa-caption">{{ viaje.contraparteNombre }}</span>
              @if (viaje.calificacionOtorgada) {
                <yipa-rating [valor]="viaje.calificacionOtorgada" [tamano]="13" />
              } @else if (viaje.estado === 'FINALIZADO') {
                <span class="pendiente">Sin calificar</span>
              }
            </div>
          </article>
        }

        @if (!ultima() && viajes().length) {
          <button
            yipa-button
            variante="fantasma"
            [bloque]="true"
            [cargando]="cargando()"
            type="button"
            (click)="cargarMas()"
          >
            Cargar más
          </button>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .viaje {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-3);
        cursor: pointer;
        transition: transform var(--yipa-dur-fast) var(--yipa-ease);
      }
      .viaje:active {
        transform: scale(0.99);
      }
      .cabecera {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .categoria {
        font-size: 24px;
      }
      .destino {
        font-weight: var(--yipa-fw-semibold);
      }
      .derecha {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .pie {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-2);
        border-top: 1px solid var(--yipa-border);
        padding-top: var(--yipa-sp-2);
      }
      .estado {
        font-size: var(--yipa-fs-caption);
        font-weight: var(--yipa-fw-semibold);
        color: var(--yipa-success);
        background: rgba(52, 199, 89, 0.12);
        padding: 3px 10px;
        border-radius: var(--yipa-radius-pill);
      }
      .estado.is-cancelado {
        color: var(--yipa-error);
        background: rgba(255, 59, 48, 0.12);
      }
      .pendiente {
        font-size: var(--yipa-fs-caption);
        color: var(--yipa-primary-dark);
        font-weight: var(--yipa-fw-semibold);
      }
    `,
  ],
})
export class HistorialPage implements OnInit {
  private readonly viajesApi = inject(ViajeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly viajes = signal<ResumenViajeHistorial[]>([]);
  protected readonly cargando = signal(false);
  protected readonly ultima = signal(true);
  private pagina = 0;

  ngOnInit(): void {
    this.cargar(0);
  }

  protected icono(categoria: ResumenViajeHistorial['categoria']): string {
    return categoria === 'YIPA_MOTO' ? '🛵' : categoria === 'YIPA_XL' ? '🚐' : '🚙';
  }

  protected cargarMas(): void {
    this.cargar(this.pagina + 1);
  }

  private cargar(pagina: number): void {
    this.cargando.set(true);
    this.viajesApi.historial('CONDUCTOR', pagina, 10).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.pagina = res.page;
        this.ultima.set(res.last);
        this.viajes.set(pagina === 0 ? res.items : [...this.viajes(), ...res.items]);
      },
      error: (e) => {
        this.cargando.set(false);
        this.toast.desdeHttp(e, 'No pudimos cargar el historial');
      },
    });
  }

  protected abrir(viaje: ResumenViajeHistorial): void {
    if (viaje.estado === 'FINALIZADO') {
      void this.router.navigate(['/viaje', viaje.id, 'finalizado']);
    }
  }
}
