import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { YIPA_API_CONFIG, ToastService, YipaAppBar } from '@yipa/shared';

interface Ajuste {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

/**
 * Pantalla 14 · Configuración.
 * Preferencias locales de la demo + estado de conexión con el backend.
 */
@Component({
  selector: 'app-configuracion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Configuración" [conVolver]="false" />

      <div class="yipa-scroll">
        <h3 class="yipa-headline">Preferencias</h3>
        <div class="yipa-card lista">
          @for (ajuste of ajustes(); track ajuste.id) {
            <label class="fila">
              <span class="yipa-grow">
                <span class="nombre">{{ ajuste.nombre }}</span>
                <span class="yipa-caption">{{ ajuste.descripcion }}</span>
              </span>
              <input
                class="switch"
                type="checkbox"
                [checked]="ajuste.activo"
                (change)="alternar(ajuste.id)"
              />
            </label>
          }
        </div>

        <h3 class="yipa-headline">Conexión</h3>
        <div class="yipa-card lista">
          <div class="fila">
            <span class="yipa-grow nombre">Origen de datos</span>
            <span class="valor">{{ config.useMocks ? 'Mock en memoria' : 'Backend real' }}</span>
          </div>
          <div class="fila">
            <span class="yipa-grow nombre">Base URL</span>
            <span class="valor">{{ config.baseUrl }}</span>
          </div>
          <div class="fila">
            <span class="yipa-grow nombre">Polling</span>
            <span class="valor">{{ config.pollingIntervalMs }} ms</span>
          </div>
        </div>

        <p class="yipa-caption nota">
          YIPA · MVP académico. Los datos son simulados; al desactivar
          <code>useMocks</code> las mismas pantallas consumen la API Spring Boot.
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .lista {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-3);
      }
      .fila {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .nombre {
        display: block;
        font-weight: var(--yipa-fw-medium);
      }
      .valor {
        font-size: var(--yipa-fs-footnote);
        color: var(--yipa-text-secondary);
      }
      .switch {
        width: 46px;
        height: 28px;
        appearance: none;
        border-radius: var(--yipa-radius-pill);
        background: rgba(32, 33, 36, 0.16);
        position: relative;
        cursor: pointer;
        transition: background var(--yipa-dur-base) var(--yipa-ease);
        flex: none;
      }
      .switch::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #fff;
        box-shadow: var(--yipa-shadow-xs);
        transition: transform var(--yipa-dur-base) var(--yipa-ease);
      }
      .switch:checked {
        background: var(--yipa-success);
      }
      .switch:checked::after {
        transform: translateX(18px);
      }
      .nota {
        text-align: center;
      }
    `,
  ],
})
export class ConfiguracionPage {
  protected readonly config = inject(YIPA_API_CONFIG);
  private readonly toast = inject(ToastService);

  protected readonly ajustes = signal<Ajuste[]>([
    {
      id: 'notificaciones',
      nombre: 'Notificaciones push',
      descripcion: 'Avisos del estado del viaje',
      activo: true,
    },
    {
      id: 'ubicacion',
      nombre: 'Ubicación en segundo plano',
      descripcion: 'Mejora el emparejamiento',
      activo: true,
    },
    {
      id: 'recibos',
      nombre: 'Recibos por correo',
      descripcion: 'Enviar resumen de tarifa al finalizar',
      activo: false,
    },
    {
      id: 'accesibilidad',
      nombre: 'Texto grande',
      descripcion: 'Aumenta el tamaño de la tipografía',
      activo: false,
    },
  ]);

  protected alternar(id: string): void {
    this.ajustes.update((lista) =>
      lista.map((a) => (a.id === id ? { ...a, activo: !a.activo } : a)),
    );
    this.toast.mostrar('Preferencia actualizada');
  }
}
