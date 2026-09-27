import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, takeWhile, timer } from 'rxjs';
import { YIPA_API_CONFIG } from '../core/api.config';
import {
  CambiarEstadoViajeRequestDto,
  CancelacionResponseDto,
  CancelarViajeRequestDto,
  PageDto,
  UbicacionConductorResponseDto,
  ViajeDto,
  ViajeHistorialDto,
} from '../dto/api.dto';
import { ResumenViajeHistorial, RolUsuario, Viaje } from '../domain/models';
import { toHistorial, toViaje } from '../mappers/mappers';

export interface PaginaHistorial {
  items: ResumenViajeHistorial[];
  page: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
}

/**
 * Bounded Context: Viajes (HU-05, HU-06, HU-09, HU-10).
 *
 * GET  /api/viajes/activo
 * GET  /api/viajes/{id}
 * GET  /api/viajes/{id}/ubicacion-conductor
 * POST /api/viajes/{id}/estado
 * POST /api/viajes/{id}/cancelacion
 * GET  /api/viajes
 */
@Injectable({ providedIn: 'root' })
export class ViajeService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(YIPA_API_CONFIG);

  /**
   * GET /api/viajes/{id}
   * Descripción: HU-06. Estado completo del viaje (incluye histórico de estados).
   * Response: 200 ViajeDto
   * Errores:  404 VIAJE_NO_ENCONTRADO · 403 VIAJE_AJENO
   */
  obtener(id: string): Observable<Viaje> {
    return this.http.get<ViajeDto>(`${this.config.baseUrl}/viajes/${id}`).pipe(map(toViaje));
  }

  /**
   * GET /api/viajes/activo
   * Descripción: viaje en curso del usuario autenticado (reanudar sesión).
   * Response: 200 ViajeDto | null
   */
  activo(): Observable<Viaje | null> {
    return this.http
      .get<ViajeDto | null>(`${this.config.baseUrl}/viajes/activo`)
      .pipe(map((dto) => (dto ? toViaje(dto) : null)));
  }

  /** HU-05/HU-06: stream del viaje hasta que finalice o se cancele. */
  observar(id: string): Observable<Viaje> {
    return timer(0, this.config.pollingIntervalMs).pipe(
      switchMap(() => this.obtener(id)),
      takeWhile((v) => v.estado !== 'FINALIZADO' && v.estado !== 'CANCELADO', true),
    );
  }

  /**
   * GET /api/viajes/{id}/ubicacion-conductor
   * Descripción: HU-05. Posición en vivo del conductor + ETA.
   *              Producción: WebSocket `/ws/viajes/{id}/ubicacion`.
   * Response: 200 UbicacionConductorResponseDto
   * Errores:  404 VIAJE_NO_ENCONTRADO · 409 SIN_CONDUCTOR_ASIGNADO
   */
  ubicacionConductor(id: string): Observable<UbicacionConductorResponseDto> {
    return this.http.get<UbicacionConductorResponseDto>(
      `${this.config.baseUrl}/viajes/${id}/ubicacion-conductor`,
    );
  }

  /**
   * POST /api/viajes/{id}/estado
   * Descripción: transiciones ejecutadas por el conductor.
   * Request:  CambiarEstadoViajeRequestDto { accion, ubicacion? }
   * Response: 200 ViajeDto
   * Errores:  409 TRANSICION_INVALIDA · 403 VIAJE_AJENO · 404 VIAJE_NO_ENCONTRADO
   */
  cambiarEstado(id: string, req: CambiarEstadoViajeRequestDto): Observable<Viaje> {
    return this.http
      .post<ViajeDto>(`${this.config.baseUrl}/viajes/${id}/estado`, req)
      .pipe(map(toViaje));
  }

  /**
   * POST /api/viajes/{id}/cancelacion
   * Descripción: HU-10. Cancela el viaje y aplica política de penalización.
   * Request:  CancelarViajeRequestDto { motivo, comentario? }
   * Response: 200 CancelacionResponseDto
   * Errores:  409 VIAJE_NO_CANCELABLE · 404 VIAJE_NO_ENCONTRADO
   */
  cancelar(id: string, req: CancelarViajeRequestDto): Observable<CancelacionResponseDto> {
    return this.http.post<CancelacionResponseDto>(
      `${this.config.baseUrl}/viajes/${id}/cancelacion`,
      req,
    );
  }

  /**
   * GET /api/viajes?rol=&page=&size=
   * Descripción: HU-09. Historial paginado del usuario.
   * Response: 200 PageDto<ViajeHistorialDto>
   * Errores:  401 NO_AUTENTICADO
   */
  historial(rol: RolUsuario, page = 0, size = 10): Observable<PaginaHistorial> {
    const params = new HttpParams()
      .set('rol', rol)
      .set('page', String(page))
      .set('size', String(size));
    return this.http
      .get<PageDto<ViajeHistorialDto>>(`${this.config.baseUrl}/viajes`, { params })
      .pipe(
        map((pagina) => ({
          items: pagina.content.map(toHistorial),
          page: pagina.page,
          totalPages: pagina.totalPages,
          totalElements: pagina.totalElements,
          last: pagina.last,
        })),
      );
  }
}
