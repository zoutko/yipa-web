import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabItem, YipaTabBar } from '@yipa/shared';

/** Contenedor con barra de pestañas para las secciones principales. */
@Component({
  selector: 'app-tabs-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, YipaTabBar],
  template: `
    <div class="contenedor">
      <div class="contenido"><router-outlet /></div>
      <yipa-tab-bar [items]="tabs" />
    </div>
  `,
  styles: [
    `
      .contenedor {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .contenido {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class TabsLayout {
  protected readonly tabs: TabItem[] = [
    { ruta: '/app/inicio', etiqueta: 'Inicio', icono: '🏠' },
    { ruta: '/app/historial', etiqueta: 'Viajes', icono: '🧾' },
    { ruta: '/app/perfil', etiqueta: 'Perfil', icono: '👤' },
    { ruta: '/app/configuracion', etiqueta: 'Ajustes', icono: '⚙️' },
  ];
}
