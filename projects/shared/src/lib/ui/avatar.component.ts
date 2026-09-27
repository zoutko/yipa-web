import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'yipa-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [style.width.px]="tamano()" [style.height.px]="tamano()">
      @if (fotoUrl()) {
        <img [src]="fotoUrl()" [alt]="nombre()" />
      } @else {
        <span class="iniciales" [style.font-size.px]="tamano() / 2.6">{{ iniciales() }}</span>
      }
    </span>
  `,
  styles: [
    `
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(140deg, var(--yipa-primary), #ffe08a);
        color: var(--yipa-secondary);
        font-weight: var(--yipa-fw-bold);
        overflow: hidden;
        flex: none;
        box-shadow: var(--yipa-shadow-xs);
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class YipaAvatar {
  readonly nombre = input('');
  readonly fotoUrl = input<string | undefined>();
  readonly tamano = input(48);
  readonly iniciales = computed(() =>
    this.nombre()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join(''),
  );
}
