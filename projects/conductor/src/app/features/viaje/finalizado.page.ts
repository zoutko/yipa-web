import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CopPipe,
  ToastService,
  Viaje,
  ViajeService,
  YipaButton,
  YipaTarifaDesglose,
} from '@yipa/shared';

/**
 * Pantalla 10 · Viaje finalizado del conductor (HU-07).
 * GET /api/viajes/{id}
 */
@Component({
  selector: 'app-finalizado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaButton, YipaTarifaDesglose, CopPipe],
  template: `
    <section class="yipa-screen">
      @if (viaje(); as v) {
        <div class="yipa-scroll centro">
          <div class="sello">💰</div>
          <h1 class="yipa-title-1">Viaje completado</h1>
          <p class="yipa-subhead">Ganaste con este viaje</p>
          <strong class="total">{{ v.tarifa.total | cop }}</strong>
          <p class="yipa-caption">Cobro en {{ v.metodoPago }}</p>

          <yipa-tarifa-desglose [tarifa]="v.tarifa" />

          <div class="yipa-card resumen">
            <div class="fila">
              <span class="yipa-grow">Pasajero</span>
              <strong>{{ v.pasajero.nombre }}</strong>
            </div>
            <div class="fila">
              <span class="yipa-grow">Distancia</span>
              <strong>{{ v.distanciaKm }} km</strong>
            </div>
            <div class="fila">
              <span class="yipa-grow">Duración</span>
              <strong>{{ v.duracionMin }} min</strong>
            </div>
          </div>

          <button yipa-button [bloque]="true" type="button" (click)="volverAlPanel()">
            Buscar otro viaje
          </button>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .centro {
        align-items: center;
        text-align: center;
      }
      .sello {
        font-size: 56px;
        animation: yipa-pop var(--yipa-dur-slow) var(--yipa-ease) both;
      }
      .total {
        font-size: 2.6rem;
        font-weight: var(--yipa-fw-bold);
      }
      .resumen,
      yipa-tarifa-desglose {
        width: 100%;
        text-align: left;
      }
      .resumen {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
      .fila {
        display: flex;
        gap: var(--yipa-sp-3);
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

  protected volverAlPanel(): void {
    void this.router.navigate(['/app/dashboard']);
  }
}
