import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { YIPA_API_CONFIG } from '../core/api.config';
import { EstimacionTarifaRequestDto, EstimacionTarifaResponseDto } from '../dto/api.dto';
import { OpcionCategoria } from '../domain/models';
import { toTarifa } from '../mappers/mappers';

export interface EstimacionTarifa {
  distanciaKm: number;
  duracionMin: number;
  opciones: OpcionCategoria[];
}

/**
 * Bounded Context: Tarifas (HU-07).
 *
 * POST /api/tarifas/estimacion
 */
@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(YIPA_API_CONFIG);

  /**
   * POST /api/tarifas/estimacion
   * Descripción: calcula la tarifa estimada por categoría antes de solicitar.
   * Request:  EstimacionTarifaRequestDto { origen, destino, categoria? }
   * Response: 200 EstimacionTarifaResponseDto
   * Errores:  400 ORIGEN_DESTINO_REQUERIDOS · 422 RUTA_NO_CALCULABLE · 503 SERVICIO_TARIFAS_NO_DISPONIBLE
   */
  estimar(req: EstimacionTarifaRequestDto): Observable<EstimacionTarifa> {
    return this.http
      .post<EstimacionTarifaResponseDto>(`${this.config.baseUrl}/tarifas/estimacion`, req)
      .pipe(
        map((res) => ({
          distanciaKm: res.distanciaKm,
          duracionMin: res.duracionMin,
          opciones: res.opciones.map((o) => ({
            categoria: o.categoria,
            nombre: o.nombre,
            descripcion: o.descripcion,
            capacidad: o.capacidad,
            icono: o.icono,
            etaMinutos: o.etaMinutos,
            tarifa: toTarifa(o.tarifa),
          })),
        })),
      );
  }
}
