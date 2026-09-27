import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { YIPA_API_CONFIG } from '../core/api.config';
import {
  DisponibilidadRequestDto,
  DisponibilidadResponseDto,
  ResumenConductorDto,
  UbicacionRequestDto,
} from '../dto/api.dto';
import { ResumenConductor } from '../domain/models';
import { toResumenConductor } from '../mappers/mappers';

/**
 * Bounded Context: Conductores (HU-02).
 *
 * PUT  /api/conductores/me/disponibilidad
 * POST /api/conductores/me/ubicacion
 * GET  /api/conductores/me/resumen
 */
@Injectable({ providedIn: 'root' })
export class ConductorService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(YIPA_API_CONFIG);

  /**
   * PUT /api/conductores/me/disponibilidad
   * Descripción: HU-02. El conductor se conecta o desconecta.
   * Request:  DisponibilidadRequestDto { estado, ubicacion }
   * Response: 200 DisponibilidadResponseDto
   * Errores:  409 VIAJE_ACTIVO_EXISTENTE · 403 DOCUMENTOS_NO_VERIFICADOS · 400 ESTADO_INVALIDO
   */
  cambiarDisponibilidad(req: DisponibilidadRequestDto): Observable<DisponibilidadResponseDto> {
    return this.http.put<DisponibilidadResponseDto>(
      `${this.config.baseUrl}/conductores/me/disponibilidad`,
      req,
    );
  }

  /**
   * POST /api/conductores/me/ubicacion
   * Descripción: heartbeat de posición (cada 5 s con el conductor conectado).
   *              Producción: canal WebSocket `/ws/conductores/ubicacion`.
   * Request:  UbicacionRequestDto
   * Response: 202 { registradoEn }
   * Errores:  409 CONDUCTOR_DESCONECTADO
   */
  reportarUbicacion(req: UbicacionRequestDto): Observable<{ registradoEn: string }> {
    return this.http.post<{ registradoEn: string }>(
      `${this.config.baseUrl}/conductores/me/ubicacion`,
      req,
    );
  }

  /**
   * GET /api/conductores/me/resumen
   * Descripción: métricas del dashboard (ganancias, viajes, aceptación).
   * Response: 200 ResumenConductorDto
   * Errores:  401 NO_AUTENTICADO
   */
  resumen(): Observable<ResumenConductor> {
    return this.http
      .get<ResumenConductorDto>(`${this.config.baseUrl}/conductores/me/resumen`)
      .pipe(map(toResumenConductor));
  }
}
