import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tarifa } from '../domain/models';
import { CopPipe } from '../pipes/cop.pipe';

/** HU-07: desglose detallado de la tarifa (estilo Apple Wallet). */
@Component({
  selector: 'yipa-tarifa-desglose',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe],
  template: `
    <div class="desglose">
      <div class="fila">
        <span>Tarifa base</span><span>{{ tarifa().desglose.tarifaBase | cop }}</span>
      </div>
      <div class="fila">
        <span
          >Distancia · {{ tarifa().desglose.distanciaKm }} km ×
          {{ tarifa().desglose.costoPorKm | cop }}</span
        >
        <span>{{ tarifa().desglose.distanciaKm * tarifa().desglose.costoPorKm | cop }}</span>
      </div>
      <div class="fila">
        <span
          >Tiempo · {{ tarifa().desglose.duracionMin }} min ×
          {{ tarifa().desglose.costoPorMinuto | cop }}</span
        >
        <span>{{ tarifa().desglose.duracionMin * tarifa().desglose.costoPorMinuto | cop }}</span>
      </div>
      @if (tarifa().desglose.multiplicadorDemanda > 1) {
        <div class="fila is-alerta">
          <span>Alta demanda ×{{ tarifa().desglose.multiplicadorDemanda }}</span>
          <span>{{ tarifa().desglose.recargoDemanda | cop }}</span>
        </div>
      }
      @if (tarifa().desglose.descuento > 0) {
        <div class="fila is-exito">
          <span>Descuento</span><span>-{{ tarifa().desglose.descuento | cop }}</span>
        </div>
      }
      <div class="yipa-divider"></div>
      <div class="fila is-total">
        <span>Total</span><span>{{ tarifa().total | cop }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .desglose {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
      .fila {
        display: flex;
        justify-content: space-between;
        gap: var(--yipa-sp-4);
        font-size: var(--yipa-fs-subhead);
        color: var(--yipa-text-secondary);
      }
      .fila span:last-child {
        font-variant-numeric: tabular-nums;
        color: var(--yipa-text);
      }
      .is-alerta span:last-child {
        color: #9a7a00;
      }
      .is-exito span:last-child {
        color: var(--yipa-success);
      }
      .is-total {
        font-size: var(--yipa-fs-headline);
        font-weight: var(--yipa-fw-bold);
        color: var(--yipa-text);
      }
    `,
  ],
})
export class YipaTarifaDesglose {
  readonly tarifa = input.required<Tarifa>();
}
