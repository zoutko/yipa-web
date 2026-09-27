import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Hoja inferior (bottom sheet) con glassmorphism ligero.
 * En tablet se comporta como panel lateral gracias a `.yipa-split__panel`.
 */
@Component({
  selector: 'yipa-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hoja" [class.is-plana]="plana()">
      @if (conAsa()) {
        <span class="asa" aria-hidden="true"></span>
      }
      @if (titulo()) {
        <h2 class="yipa-title-2 titulo">{{ titulo() }}</h2>
      }
      <ng-content />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .hoja {
        background: rgba(255, 255, 255, 0.86);
        backdrop-filter: var(--yipa-blur);
        -webkit-backdrop-filter: var(--yipa-blur);
        border-radius: var(--yipa-radius-xl) var(--yipa-radius-xl) 0 0;
        box-shadow: 0 -10px 40px rgba(32, 33, 36, 0.14);
        padding: var(--yipa-sp-3) var(--yipa-sp-4)
          calc(var(--yipa-sp-5) + var(--yipa-safe-bottom));
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-3);
        animation: yipa-sheet-up var(--yipa-dur-slow) var(--yipa-ease) both;
        max-height: 82dvh;
        overflow-y: auto;
      }
      .hoja.is-plana {
        box-shadow: none;
        background: transparent;
        backdrop-filter: none;
        padding-inline: 0;
      }
      .asa {
        width: 38px;
        height: 5px;
        border-radius: var(--yipa-radius-pill);
        background: rgba(32, 33, 36, 0.18);
        margin: 0 auto var(--yipa-sp-1);
      }
      .titulo {
        margin-bottom: var(--yipa-sp-1);
      }
      @media (min-width: 768px) {
        .hoja {
          border-radius: var(--yipa-radius-xl);
          box-shadow: var(--yipa-shadow-md);
          padding: var(--yipa-sp-5);
          max-height: none;
        }
        .asa {
          display: none;
        }
      }
    `,
  ],
})
export class YipaSheet {
  readonly titulo = input<string>();
  readonly conAsa = input(true);
  readonly plana = input(false);
}
