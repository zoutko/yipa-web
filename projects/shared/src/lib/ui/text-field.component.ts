import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** Campo de texto estilo iOS con etiqueta flotante simple y estado de error. */
@Component({
  selector: 'yipa-text-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <label class="campo" [class.is-error]="!!error()">
      <span class="etiqueta">{{ etiqueta() }}</span>
      <span class="control">
        @if (icono()) {
          <span class="icono" aria-hidden="true">{{ icono() }}</span>
        }
        <input
          [type]="tipo()"
          [placeholder]="placeholder()"
          [attr.autocomplete]="autocomplete()"
          [attr.inputmode]="inputmode()"
          [ngModel]="valor()"
          (ngModelChange)="valor.set($event)"
          [disabled]="deshabilitado()"
        />
      </span>
      @if (error()) {
        <span class="mensaje">{{ error() }}</span>
      } @else if (ayuda()) {
        <span class="ayuda">{{ ayuda() }}</span>
      }
    </label>
  `,
  styles: [
    `
      .campo {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .etiqueta {
        font-size: var(--yipa-fs-footnote);
        font-weight: var(--yipa-fw-medium);
        color: var(--yipa-text-secondary);
        padding-left: 2px;
      }
      .control {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-2);
        background: var(--yipa-surface);
        border: 1px solid var(--yipa-border);
        border-radius: var(--yipa-radius-md);
        padding: 0 var(--yipa-sp-4);
        transition: border-color var(--yipa-dur-base) var(--yipa-ease),
          box-shadow var(--yipa-dur-base) var(--yipa-ease);
      }
      .control:focus-within {
        border-color: var(--yipa-primary);
        box-shadow: 0 0 0 4px var(--yipa-primary-soft);
      }
      .is-error .control {
        border-color: var(--yipa-error);
      }
      input {
        flex: 1;
        border: 0;
        outline: none;
        background: transparent;
        font-size: var(--yipa-fs-body);
        color: var(--yipa-text);
        padding: 14px 0;
        min-width: 0;
      }
      .mensaje {
        font-size: var(--yipa-fs-caption);
        color: var(--yipa-error);
        padding-left: 2px;
      }
      .ayuda {
        font-size: var(--yipa-fs-caption);
        color: var(--yipa-text-tertiary);
        padding-left: 2px;
      }
    `,
  ],
})
export class YipaTextField {
  readonly valor = model('');
  readonly etiqueta = input('');
  readonly placeholder = input('');
  readonly tipo = input<'text' | 'email' | 'password' | 'tel' | 'number'>('text');
  readonly icono = input<string>();
  readonly error = input<string | null>(null);
  readonly ayuda = input<string>();
  readonly autocomplete = input<string>();
  readonly inputmode = input<string>();
  readonly deshabilitado = input(false);
}
