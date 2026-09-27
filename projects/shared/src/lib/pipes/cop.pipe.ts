import { Pipe, PipeTransform } from '@angular/core';

/** Formatea pesos colombianos sin decimales: 14200 -> `$ 14.200`. */
@Pipe({ name: 'cop', standalone: true })
export class CopPipe implements PipeTransform {
  private readonly formato = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  transform(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
    return this.formato.format(Math.round(valor));
  }
}
