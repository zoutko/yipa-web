import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Pantalla de arranque con el logotipo YIPA (jeep Yipao + marca). */
@Component({
  selector: 'yipa-splash',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="splash">
      <div class="logo">
        <span class="jeep">🚙</span>
        <h1 class="marca">{{ marca() }}</h1>
        <p class="lema">{{ lema() }}</p>
      </div>
      <div class="carga"><span class="barra"></span></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .splash {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--yipa-sp-10);
        background: radial-gradient(120% 90% at 50% 0%, #2c2c2c 0%, var(--yipa-secondary) 60%);
        color: var(--yipa-text-on-dark);
      }
      .logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--yipa-sp-2);
        animation: entrada 900ms var(--yipa-ease) both;
      }
      .jeep {
        font-size: 64px;
        filter: drop-shadow(0 12px 28px rgba(244, 197, 66, 0.35));
        animation: flotar 2.6s ease-in-out infinite;
      }
      .marca {
        font-size: 3rem;
        letter-spacing: 0.24em;
        font-weight: var(--yipa-fw-bold);
        color: var(--yipa-primary);
        margin-left: 0.24em;
      }
      .lema {
        font-size: var(--yipa-fs-subhead);
        color: rgba(248, 246, 242, 0.7);
      }
      .carga {
        width: 140px;
        height: 4px;
        border-radius: var(--yipa-radius-pill);
        background: rgba(255, 255, 255, 0.14);
        overflow: hidden;
      }
      .barra {
        display: block;
        height: 100%;
        width: 40%;
        border-radius: inherit;
        background: var(--yipa-primary);
        animation: recorrer 1.3s var(--yipa-ease) infinite;
      }
      @keyframes entrada {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.94);
        }
      }
      @keyframes flotar {
        50% {
          transform: translateY(-8px);
        }
      }
      @keyframes recorrer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(250%);
        }
      }
    `,
  ],
})
export class YipaSplash {
  readonly marca = input('YIPA');
  readonly lema = input('Tu viaje, a la colombiana');
}
