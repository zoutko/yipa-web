import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'yipa-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vacio">
      <span class="icono">{{ icono() }}</span>
      <h3 class="yipa-headline">{{ titulo() }}</h3>
      @if (descripcion()) {
        <p class="yipa-subhead">{{ descripcion() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .vacio {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--yipa-sp-2);
        text-align: center;
        padding: var(--yipa-sp-10) var(--yipa-sp-6);
        color: var(--yipa-text-secondary);
      }
      .icono {
        font-size: 44px;
        filter: grayscale(0.15);
      }
    `,
  ],
})
export class YipaEmptyState {
  readonly icono = input('🗺️');
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
}
