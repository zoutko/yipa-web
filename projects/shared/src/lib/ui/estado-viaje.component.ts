import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoViaje } from '../domain/models';

interface Paso {
  estado: EstadoViaje;
  etiqueta: string;
}

const PASOS: Paso[] = [
  { estado: 'BUSCANDO_CONDUCTOR', etiqueta: 'Buscando conductor' },
  { estado: 'CONDUCTOR_ASIGNADO', etiqueta: 'Conductor asignado' },
  { estado: 'CONDUCTOR_EN_CAMINO', etiqueta: 'En camino a ti' },
  { estado: 'CONDUCTOR_LLEGO', etiqueta: 'Llegó al punto' },
  { estado: 'EN_CURSO', etiqueta: 'Viaje en curso' },
  { estado: 'FINALIZADO', etiqueta: 'Finalizado' },
];

export const ETIQUETA_ESTADO: Record<EstadoViaje, string> = {
  BUSCANDO_CONDUCTOR: 'Buscando conductor',
  CONDUCTOR_ASIGNADO: 'Conductor asignado',
  CONDUCTOR_EN_CAMINO: 'Conductor en camino',
  CONDUCTOR_LLEGO: 'Conductor en el punto',
  EN_CURSO: 'Viaje en curso',
  FINALIZADO: 'Viaje finalizado',
  CANCELADO: 'Viaje cancelado',
};

/** HU-06: línea de tiempo del estado del viaje. */
@Component({
  selector: 'yipa-estado-viaje',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (estado() === 'CANCELADO') {
      <div class="cancelado">Viaje cancelado</div>
    } @else {
      <ol class="linea">
        @for (paso of pasos(); track paso.estado) {
          <li class="paso" [class.is-hecho]="paso.hecho" [class.is-actual]="paso.actual">
            <span class="marca"></span>
            <span class="texto">{{ paso.etiqueta }}</span>
          </li>
        }
      </ol>
    }
  `,
  styles: [
    `
      .linea {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        gap: 4px;
      }
      .paso {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .marca {
        height: 4px;
        border-radius: var(--yipa-radius-pill);
        background: rgba(32, 33, 36, 0.12);
        transition: background var(--yipa-dur-slow) var(--yipa-ease);
      }
      .is-hecho .marca {
        background: var(--yipa-secondary);
      }
      .is-actual .marca {
        background: var(--yipa-primary);
        animation: yipa-fade-in 1.2s ease-in-out infinite alternate;
      }
      .texto {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--yipa-text-tertiary);
        text-align: center;
        line-height: 1.2;
      }
      .is-actual .texto {
        color: var(--yipa-text);
        font-weight: var(--yipa-fw-semibold);
      }
      .cancelado {
        padding: var(--yipa-sp-2) var(--yipa-sp-3);
        border-radius: var(--yipa-radius-md);
        background: rgba(255, 59, 48, 0.12);
        color: var(--yipa-error);
        font-weight: var(--yipa-fw-semibold);
        text-align: center;
        font-size: var(--yipa-fs-subhead);
      }
      @media (min-width: 768px) {
        .texto {
          font-size: 11px;
        }
      }
    `,
  ],
})
export class YipaEstadoViaje {
  readonly estado = input.required<EstadoViaje>();

  protected readonly pasos = computed(() => {
    const indiceActual = PASOS.findIndex((p) => p.estado === this.estado());
    return PASOS.map((paso, i) => ({
      ...paso,
      hecho: i < indiceActual,
      actual: i === indiceActual,
    }));
  });
}
