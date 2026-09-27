import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Estrellas para HU-08: modo lectura o selección. */
@Component({
  selector: 'yipa-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="estrellas" [class.is-editable]="editable()" role="radiogroup" [attr.aria-label]="etiqueta()">
      @for (estrella of estrellas; track estrella) {
        <button
          type="button"
          class="estrella"
          [class.is-activa]="estrella <= valor()"
          [style.font-size.px]="tamano()"
          [disabled]="!editable()"
          [attr.aria-label]="estrella + ' estrellas'"
          [attr.aria-checked]="estrella === valor()"
          role="radio"
          (click)="seleccionar(estrella)"
        >
          ★
        </button>
      }
    </div>
  `,
  styles: [
    `
      .estrellas {
        display: inline-flex;
        gap: 2px;
      }
      .estrella {
        border: 0;
        background: none;
        padding: 0 2px;
        line-height: 1;
        color: rgba(32, 33, 36, 0.18);
        cursor: default;
        transition: transform var(--yipa-dur-base) var(--yipa-ease), color var(--yipa-dur-base);
      }
      .is-editable .estrella {
        cursor: pointer;
      }
      .is-editable .estrella:active {
        transform: scale(1.25);
      }
      .estrella.is-activa {
        color: var(--yipa-primary);
        text-shadow: 0 2px 10px rgba(244, 197, 66, 0.45);
      }
    `,
  ],
})
export class YipaRating {
  readonly valor = model(0);
  readonly editable = input(false);
  readonly tamano = input(20);
  readonly etiqueta = input('Calificación');
  protected readonly estrellas = [1, 2, 3, 4, 5];

  protected seleccionar(valor: number): void {
    if (this.editable()) this.valor.set(valor);
  }
}
