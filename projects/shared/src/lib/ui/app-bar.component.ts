import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Barra de navegación superior translúcida (estilo iOS large/compact). */
@Component({
  selector: 'yipa-app-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="barra">
      @if (conVolver()) {
        <button class="icono" type="button" aria-label="Volver" (click)="volver.emit()">‹</button>
      } @else {
        <span class="hueco"></span>
      }
      <div class="centro">
        <span class="titulo">{{ titulo() }}</span>
        @if (subtitulo()) {
          <span class="subtitulo">{{ subtitulo() }}</span>
        }
      </div>
      <span class="accion"><ng-content /></span>
    </header>
  `,
  styles: [
    `
      .barra {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-2);
        padding: var(--yipa-sp-3) var(--yipa-sp-4);
        padding-top: calc(var(--yipa-sp-3) + env(safe-area-inset-top, 0px));
        background: rgba(248, 246, 242, 0.82);
        backdrop-filter: var(--yipa-blur);
        -webkit-backdrop-filter: var(--yipa-blur);
        border-bottom: 1px solid var(--yipa-border);
        position: relative;
        z-index: 10;
      }
      .centro {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.2;
      }
      .titulo {
        font-size: var(--yipa-fs-headline);
        font-weight: var(--yipa-fw-semibold);
      }
      .subtitulo {
        font-size: var(--yipa-fs-caption);
        color: var(--yipa-text-secondary);
      }
      .icono,
      .hueco,
      .accion {
        min-width: 44px;
        display: flex;
        justify-content: center;
      }
      .icono {
        height: 36px;
        border: 0;
        border-radius: var(--yipa-radius-pill);
        background: rgba(31, 31, 31, 0.06);
        font-size: 26px;
        line-height: 1;
        color: var(--yipa-text);
        cursor: pointer;
        align-items: center;
        transition: transform var(--yipa-dur-fast) var(--yipa-ease);
      }
      .icono:active {
        transform: scale(0.92);
      }
      @media (min-width: 768px) {
        .barra {
          padding-inline: var(--yipa-sp-8);
        }
        .titulo {
          font-size: var(--yipa-fs-title3);
        }
      }
    `,
  ],
})
export class YipaAppBar {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly conVolver = input(true);
  readonly volver = output<void>();
}
