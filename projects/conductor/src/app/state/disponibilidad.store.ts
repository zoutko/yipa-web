import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CENTRO_CIUDAD,
  ConductorService,
  Coordenada,
  EstadoConductor,
  ToastService,
} from '@yipa/shared';

/**
 * Estado de conexión del conductor (HU-02) compartido entre Dashboard,
 * Disponibilidad y Solicitudes entrantes.
 * PUT /api/conductores/me/disponibilidad
 */
@Injectable({ providedIn: 'root' })
export class DisponibilidadStore {
  private readonly api = inject(ConductorService);
  private readonly toast = inject(ToastService);

  private readonly _estado = signal<EstadoConductor>('DESCONECTADO');
  private readonly _cambiando = signal(false);

  readonly estado = this._estado.asReadonly();
  readonly cambiando = this._cambiando.asReadonly();
  readonly disponible = computed(() => this._estado() === 'DISPONIBLE');
  readonly ubicacion = signal<Coordenada>(CENTRO_CIUDAD);

  sincronizar(estado: EstadoConductor): void {
    this._estado.set(estado);
  }

  alternar(): void {
    const destino = this.disponible() ? 'DESCONECTADO' : 'DISPONIBLE';
    this._cambiando.set(true);
    this.api
      .cambiarDisponibilidad({ estado: destino, ubicacion: this.ubicacion() })
      .subscribe({
        next: (res) => {
          this._cambiando.set(false);
          this._estado.set(res.estado);
          this.toast.mostrar(
            res.estado === 'DISPONIBLE' ? 'Estás en línea' : 'Te desconectaste',
            res.estado === 'DISPONIBLE' ? 'exito' : 'info',
          );
        },
        error: (e) => {
          this._cambiando.set(false);
          this.toast.desdeHttp(e, 'No pudimos cambiar tu disponibilidad');
        },
      });
  }
}
