import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'exito';

/**
 * Botón del Design System YIPA.
 * Uso: `<button yipa-button variante="primario" [bloque]="true">Continuar</button>`
 */
@Component({
  selector: 'button[yipa-button], a[yipa-button]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cargando()) {
      <span class="spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  host: {
    '[class]': '"yipa-btn yipa-btn--" + variante() + (bloque() ? " is-block" : "")',
    '[class.is-cargando]': 'cargando()',
    '[attr.aria-busy]': 'cargando()',
  },
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--yipa-sp-2);
        min-height: 52px;
        padding: 0 var(--yipa-sp-6);
        border: 0;
        border-radius: var(--yipa-radius-md);
        font-size: var(--yipa-fs-headline);
        font-weight: var(--yipa-fw-semibold);
        cursor: pointer;
        user-select: none;
        transition:
          transform var(--yipa-dur-fast) var(--yipa-ease),
          filter var(--yipa-dur-fast) var(--yipa-ease),
          box-shadow var(--yipa-dur-base) var(--yipa-ease),
          background var(--yipa-dur-base) var(--yipa-ease);
      }
      :host(:active:not(:disabled)) {
        transform: scale(0.97);
      }
      :host(:disabled) {
        opacity: 0.45;
        cursor: not-allowed;
      }
      :host(.is-block) {
        width: 100%;
      }
      :host(.yipa-btn--primario) {
        background: var(--yipa-primary);
        color: var(--yipa-text-on-primary);
        box-shadow: 0 6px 18px rgba(244, 197, 66, 0.35);
      }
      :host(.yipa-btn--primario:hover:not(:disabled)) {
        filter: brightness(1.04);
      }
      :host(.yipa-btn--secundario) {
        background: var(--yipa-secondary);
        color: var(--yipa-text-on-dark);
      }
      :host(.yipa-btn--fantasma) {
        background: rgba(31, 31, 31, 0.06);
        color: var(--yipa-text);
      }
      :host(.yipa-btn--peligro) {
        background: rgba(255, 59, 48, 0.12);
        color: var(--yipa-error);
      }
      :host(.yipa-btn--exito) {
        background: var(--yipa-success);
        color: #fff;
      }
      .spinner {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-top-color: transparent;
        animation: yipa-spin 0.7s linear infinite;
      }
    `,
  ],
})
export class YipaButton {
  readonly variante = input<VarianteBoton>('primario');
  readonly bloque = input(false);
  readonly cargando = input(false);
}
