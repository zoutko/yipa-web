import { Injectable, computed, signal } from '@angular/core';
import { CategoriaVehiculo, Lugar, MetodoPago, OpcionCategoria } from '@yipa/shared';

/**
 * Estado del flujo "solicitar viaje" (HU-01/HU-07) compartido entre Home y
 * la pantalla de solicitud. Vive en memoria: es un borrador, no una entidad.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudStore {
  readonly origen = signal<Lugar | null>(null);
  readonly destino = signal<Lugar | null>(null);
  readonly categoria = signal<CategoriaVehiculo>('YIPA_X');
  readonly metodoPago = signal<MetodoPago>('TARJETA');
  readonly nota = signal('');
  readonly opciones = signal<OpcionCategoria[]>([]);

  readonly opcionSeleccionada = computed(
    () => this.opciones().find((o) => o.categoria === this.categoria()) ?? null,
  );
  readonly listaParaSolicitar = computed(() => !!this.origen() && !!this.destino());

  reiniciar(): void {
    this.destino.set(null);
    this.nota.set('');
    this.opciones.set([]);
    this.categoria.set('YIPA_X');
  }
}
