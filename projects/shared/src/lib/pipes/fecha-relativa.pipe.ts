import { Pipe, PipeTransform } from '@angular/core';

/** "hace 5 min", "ayer", "12 mar" — formato compacto para historial. */
@Pipe({ name: 'fechaRelativa', standalone: true })
export class FechaRelativaPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    if (!iso) return '—';
    const fecha = new Date(iso);
    const minutos = Math.round((Date.now() - fecha.getTime()) / 60000);
    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.round(horas / 24);
    if (dias === 1) return 'ayer';
    if (dias < 7) return `hace ${dias} días`;
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }
}
