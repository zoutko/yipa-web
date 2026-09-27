import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface TabItem {
  ruta: string;
  etiqueta: string;
  icono: string;
}

/** Barra de pestañas inferior (móvil) / lateral compacta (tablet horizontal). */
@Component({
  selector: 'yipa-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="tabs" role="navigation">
      @for (tab of items(); track tab.ruta) {
        <a
          class="tab"
          [routerLink]="tab.ruta"
          routerLinkActive="is-activa"
          [routerLinkActiveOptions]="{ exact: false }"
        >
          <span class="icono">{{ tab.icono }}</span>
          <span class="texto">{{ tab.etiqueta }}</span>
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .tabs {
        display: flex;
        align-items: stretch;
        justify-content: space-around;
        gap: var(--yipa-sp-1);
        padding: var(--yipa-sp-2) var(--yipa-sp-2)
          calc(var(--yipa-sp-2) + var(--yipa-safe-bottom));
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: var(--yipa-blur);
        -webkit-backdrop-filter: var(--yipa-blur);
        border-top: 1px solid var(--yipa-border);
      }
      .tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: var(--yipa-sp-2) 0;
        border-radius: var(--yipa-radius-md);
        color: var(--yipa-text-tertiary);
        font-size: var(--yipa-fs-caption2);
        font-weight: var(--yipa-fw-medium);
        transition: color var(--yipa-dur-base) var(--yipa-ease),
          background var(--yipa-dur-base) var(--yipa-ease), transform var(--yipa-dur-fast);
      }
      .tab:active {
        transform: scale(0.94);
      }
      .tab.is-activa {
        color: var(--yipa-text);
        background: var(--yipa-primary-soft);
      }
      .icono {
        font-size: 20px;
        line-height: 1;
      }
      @media (min-width: 768px) {
        .tabs {
          justify-content: center;
          gap: var(--yipa-sp-4);
        }
        .tab {
          flex: 0 0 140px;
          flex-direction: row;
          gap: var(--yipa-sp-2);
          font-size: var(--yipa-fs-subhead);
        }
      }
    `,
  ],
})
export class YipaTabBar {
  readonly items = input.required<TabItem[]>();
}
