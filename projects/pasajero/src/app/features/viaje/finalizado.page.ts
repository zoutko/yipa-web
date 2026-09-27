import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CopPipe,
  ToastService,
  Viaje,
  ViajeService,
  YipaAvatar,
  YipaButton,
  YipaSheet,
} from '@yipa/shared';

/**
 * Pantalla 9 · Viaje finalizado (HU-06).
 * GET /api/viajes/{id}
 */
@Component({
  selector: 'app-finalizado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaSheet, YipaAvatar, YipaButton, CopPipe],
  template: `
    <section class="yipa-screen pantalla">
      <div class="celebracion">
        <span class="check">✓</span>
        <h1 class="yipa-title-1">¡Llegaste!</h1>
        <p class="yipa-subhead">Gracias por viajar con YIPA</p>
      </div>

      <yipa-sheet [conAsa]="false">
        @if (viaje(); as v) {
          <div class="total">
            <span class="yipa-caption">Total del viaje</span>
            <strong class="monto">{{ v.tarifa.total | cop }}</strong>
            <span class="yipa-caption">{{ v.metodoPago }}</span>
          </div>

          <div class="trayecto yipa-card">
            <p class="linea"><span>🅐</span> {{ v.origen.nombre }}</p>
            <p class="linea"><span>🅑</span> {{ v.destino.nombre }}</p>
            <p class="yipa-caption">{{ v.distanciaKm }} km · {{ v.duracionMin }} min</p>
          </div>

          @if (v.conductor; as c) {
            <div class="conductor yipa-card">
              <yipa-avatar [nombre]="c.nombre" [fotoUrl]="c.fotoUrl" [tamano]="44" />
              <div class="yipa-grow">
                <p class="nombre">{{ c.nombre }}</p>
                <p class="yipa-caption">{{ c.vehiculo.marca }} · {{ c.vehiculo.placa }}</p>
              </div>
            </div>
          }

          <button yipa-button [bloque]="true" type="button" (click)="verTarifa()">
            Ver resumen de tarifa
          </button>
          <button
            yipa-button
            variante="fantasma"
            [bloque]="true"
            type="button"
            (click)="calificar()"
          >
            Calificar conductor
          </button>
        }
      </yipa-sheet>
    </section>
  `,
  styles: [
    `
      .pantalla {
        justify-content: space-between;
      }
      .celebracion {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--yipa-sp-2);
        text-align: center;
      }
      .check {
        width: 84px;
        height: 84px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: rgba(52, 199, 89, 0.14);
        color: var(--yipa-success);
        font-size: 40px;
        animation: yipa-pop var(--yipa-dur-slow) var(--yipa-ease) both;
      }
      .total {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .monto {
        font-size: var(--yipa-fs-title1);
        font-weight: var(--yipa-fw-bold);
      }
      .trayecto,
      .conductor {
        display: flex;
        gap: var(--yipa-sp-2);
      }
      .trayecto {
        flex-direction: column;
      }
      .conductor {
        align-items: center;
      }
      .linea {
        display: flex;
        gap: var(--yipa-sp-2);
      }
      .nombre {
        font-weight: var(--yipa-fw-semibold);
      }
    `,
  ],
})
export class FinalizadoPage implements OnInit {
  readonly viajeId = input.required<string>();

  private readonly viajes = inject(ViajeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly viaje = signal<Viaje | null>(null);

  ngOnInit(): void {
    this.viajes.obtener(this.viajeId()).subscribe({
      next: (viaje) => this.viaje.set(viaje),
      error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar el viaje'),
    });
  }

  protected verTarifa(): void {
    void this.router.navigate(['/viaje', this.viajeId(), 'tarifa']);
  }

  protected calificar(): void {
    void this.router.navigate(['/viaje', this.viajeId(), 'calificar']);
  }
}
