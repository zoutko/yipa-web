import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { YipaToastHost } from '@yipa/shared';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, YipaToastHost],
  template: `
    <div class="yipa-shell">
      <router-outlet />
    </div>
    <yipa-toast-host />
  `,
})
export class App {}
