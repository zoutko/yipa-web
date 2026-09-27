import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CopPipe,
  ToastService,
  Viaje,
  ViajeService,
  YipaAppBar,
  YipaButton,
  YipaTarifaDesglose,
} from '@yipa/shared';

/**
 * Pantalla 10 · Resumen de tarifa (HU-07).
 * GET /api/viajes/{id}
 */
@Component({
  selector: 'app-tarifa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaButton, YipaTarifaDesglose, CopPipe],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Resumen de tarifa" (volver)="volver()" />

      <div class="yipa-scroll">
        @if (viaje(); as v) {
          <div class="recibo yipa-card">
            <p class="yipa-caption">Total pagado</p>
            <strong class="monto">{{ v.tarifa.total | cop }}</strong>
            <p class="yipa-caption">{{ v.metodoPago }} · {{ v.tarifa.categoria }}</p>
          </div>

          <yipa-tarifa-desglose [tarifa]="v.tarifa" />

          <p class="yipa-caption nota">
            La tarifa se calcula en el Bounded Context <strong>Tarifas</strong>: base + km +
            minutos, ajustada por demanda y descuentos.
          </p>

          <button yipa-button [bloque]="true" type="button" (click)="calificar()">
            Calificar conductor
          </button>
          <button yipa-button variante="fantasma" [bloque]="true" type="button" (click)="inicio()">
            Volver al inicio
          </button>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .recibo {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .monto {
        font-size: var(--yipa-fs-title1);
        font-weight: var(--yipa-fw-bold);
      }
      .nota {
        text-align: center;
      }
    `,
  ],
})
export class TarifaPage implements OnInit {
  readonly viajeId = input.required<string>();

  private readonly viajes = inject(ViajeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly viaje = signal<Viaje | null>(null);

  ngOnInit(): void {
    this.viajes.obtener(this.viajeId()).subscribe({
      next: (viaje) => this.viaje.set(viaje),
      error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar la tarifa'),
    });
  }

  protected volver(): void {
    void this.router.navigate(['/viaje', this.viajeId(), 'finalizado']);
  }

  protected calificar(): void {
    void this.router.navigate(['/viaje', this.viajeId(), 'calificar']);
  }

  protected inicio(): void {
    void this.router.navigate(['/app/inicio']);
  }
}
