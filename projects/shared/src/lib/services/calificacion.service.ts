import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { YIPA_API_CONFIG } from '../core/api.config';
import { CalificacionDto, CrearCalificacionRequestDto } from '../dto/api.dto';
import { Calificacion } from '../domain/models';
import { toCalificacion } from '../mappers/mappers';

/**
 * Bounded Context: Calificaciones (HU-08).
 *
 * POST /api/viajes/{id}/calificacion
 */
@Injectable({ providedIn: 'root' })
export class CalificacionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(YIPA_API_CONFIG);

  /**
   * POST /api/viajes/{viajeId}/calificacion
   * Descripción: HU-08. Califica a la contraparte del viaje finalizado.
   * Request:  CrearCalificacionRequestDto { puntuacion 1..5, etiquetas?, comentario? }
   * Response: 201 CalificacionDto
   * Errores:  409 VIAJE_NO_CALIFICABLE · 409 CALIFICACION_DUPLICADA ·
   *           422 PUNTUACION_INVALIDA · 404 VIAJE_NO_ENCONTRADO
   */
  calificar(viajeId: string, req: CrearCalificacionRequestDto): Observable<Calificacion> {
    return this.http
      .post<CalificacionDto>(`${this.config.baseUrl}/viajes/${viajeId}/calificacion`, req)
      .pipe(map(toCalificacion));
  }
}
