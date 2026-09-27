import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

/** Contenedor global de notificaciones. Se monta una vez en el shell. */
@Component({
  selector: 'yipa-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor" role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'is-' + toast.tipo" (click)="toasts.cerrar(toast.id)">
          <span class="punto"></span>
          <span>{{ toast.mensaje }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .contenedor {
        position: fixed;
        top: calc(env(safe-area-inset-top, 0px) + 10px);
        left: 50%;
        transform: translateX(-50%);
        z-index: var(--yipa-z-toast);
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
        width: min(92vw, 460px);
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
        padding: var(--yipa-sp-3) var(--yipa-sp-4);
        border-radius: var(--yipa-radius-md);
        background: rgba(31, 31, 31, 0.9);
        backdrop-filter: var(--yipa-blur);
        color: var(--yipa-text-on-dark);
        font-size: var(--yipa-fs-subhead);
        box-shadow: var(--yipa-shadow-md);
        animation: yipa-sheet-down var(--yipa-dur-base) var(--yipa-ease) both;
        cursor: pointer;
      }
      .punto {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--yipa-primary);
        flex: none;
      }
      .is-exito .punto {
        background: var(--yipa-success);
      }
      .is-error .punto {
        background: var(--yipa-error);
      }
      .is-advertencia .punto {
        background: var(--yipa-warning);
      }
      @keyframes yipa-sheet-down {
        from {
          opacity: 0;
          transform: translateY(-14px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class YipaToastHost {
  protected readonly toasts = inject(ToastService);
}
