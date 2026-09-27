import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorDto } from '../dto/api.dto';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: 'exito' | 'error' | 'info' | 'advertencia';
}

/** Notificaciones efímeras estilo iOS (banner superior). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private contador = 0;
  readonly toasts = signal<Toast[]>([]);

  mostrar(mensaje: string, tipo: Toast['tipo'] = 'info', duracionMs = 3200): void {
    const id = ++this.contador;
    this.toasts.update((lista) => [...lista, { id, mensaje, tipo }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'exito');
  }

  error(mensaje: string): void {
    this.mostrar(mensaje, 'error', 4200);
  }

  /** Traduce un `HttpErrorResponse` del backend (formato `ApiErrorDto`) a un toast. */
  desdeHttp(error: unknown, fallback = 'Ocurrió un error inesperado'): void {
    const api = (error as HttpErrorResponse)?.error as ApiErrorDto | undefined;
    this.error(api?.message ?? fallback);
  }

  cerrar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }
}
