import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, takeWhile, timer } from 'rxjs';
import { YIPA_API_CONFIG } from '../core/api.config';
import {
  CrearSolicitudRequestDto,
  OfertaViajeDto,
  RechazarSolicitudRequestDto,
  SolicitudViajeDto,
  ViajeDto,
} from '../dto/api.dto';
import { OfertaViaje, SolicitudViaje, Viaje } from '../domain/models';
import { toOferta, toSolicitud, toViaje } from '../mappers/mappers';

/**
 * Bounded Context: Emparejamiento (HU-01, HU-03, HU-04).
 *
 * POST /api/solicitudes
 * GET  /api/solicitudes/{id}
 * GET  /api/conductores/me/solicitudes
 * POST /api/solicitudes/{id}/aceptar
 * POST /api/solicitudes/{id}/rechazar
 */
@Injectable({ providedIn: 'root' })
export class EmparejamientoService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(YIPA_API_CONFIG);

  /**
   * POST /api/solicitudes
   * Descripción: HU-01. El pasajero solicita un viaje; el contexto de
   *              Emparejamiento inicia la búsqueda de conductor (HU-03).
   * Request:  CrearSolicitudRequestDto
   * Response: 201 SolicitudViajeDto (estado = BUSCANDO)
   * Errores:  400 ORIGEN_DESTINO_REQUERIDOS · 409 VIAJE_ACTIVO_EXISTENTE ·
   *           422 ZONA_NO_CUBIERTA · 402 METODO_PAGO_RECHAZADO
   */
  crearSolicitud(req: CrearSolicitudRequestDto): Observable<SolicitudViaje> {
    return this.http
      .post<SolicitudViajeDto>(`${this.config.baseUrl}/solicitudes`, req)
      .pipe(map(toSolicitud));
  }

  /**
   * GET /api/solicitudes/{id}
   * Descripción: estado del emparejamiento. En producción se sustituye por
   *              WebSocket/SSE (`/ws/solicitudes/{id}`); el polling queda como fallback.
   * Response: 200 SolicitudViajeDto
   * Errores:  404 SOLICITUD_NO_ENCONTRADA
   */
  obtenerSolicitud(id: string): Observable<SolicitudViaje> {
    return this.http
      .get<SolicitudViajeDto>(`${this.config.baseUrl}/solicitudes/${id}`)
      .pipe(map(toSolicitud));
  }

  /** Polling hasta que el emparejamiento termine (aceptada, cancelada o expirada). */
  observarSolicitud(id: string): Observable<SolicitudViaje> {
    return timer(0, this.config.pollingIntervalMs).pipe(
      switchMap(() => this.obtenerSolicitud(id)),
      takeWhile((s) => s.estado === 'BUSCANDO' || s.estado === 'OFRECIDA', true),
    );
  }

  /**
   * GET /api/conductores/me/solicitudes
   * Descripción: HU-04. Solicitudes ofrecidas al conductor conectado.
   * Response: 200 OfertaViajeDto[]
   * Errores:  401 NO_AUTENTICADO · 409 CONDUCTOR_NO_DISPONIBLE
   */
  solicitudesEntrantes(): Observable<OfertaViaje[]> {
    return this.http
      .get<OfertaViajeDto[]>(`${this.config.baseUrl}/conductores/me/solicitudes`)
      .pipe(map((lista) => lista.map(toOferta)));
  }

  /** Stream de ofertas entrantes (polling; en producción WebSocket). */
  observarSolicitudesEntrantes(): Observable<OfertaViaje[]> {
    return timer(0, this.config.pollingIntervalMs).pipe(
      switchMap(() => this.solicitudesEntrantes()),
    );
  }

  /**
   * POST /api/solicitudes/{id}/aceptar
   * Descripción: HU-04. El conductor acepta; se crea el Viaje.
   * Response: 200 ViajeDto
   * Errores:  410 SOLICITUD_EXPIRADA · 409 CONDUCTOR_OCUPADO · 404 SOLICITUD_NO_ENCONTRADA
   */
  aceptar(solicitudId: string): Observable<Viaje> {
    return this.http
      .post<ViajeDto>(`${this.config.baseUrl}/solicitudes/${solicitudId}/aceptar`, {})
      .pipe(map(toViaje));
  }

  /**
   * DELETE /api/solicitudes/{id}
   * Descripción: HU-10. El pasajero cancela mientras no hay conductor asignado.
   * Request:  —
   * Response: 200 { solicitudId, estado: 'CANCELADA' }
   * Errores:  404 SOLICITUD_NO_ENCONTRADA · 409 SOLICITUD_YA_ACEPTADA
   */
  cancelarSolicitud(solicitudId: string): Observable<{ solicitudId: string; estado: string }> {
    return this.http.delete<{ solicitudId: string; estado: string }>(
      `${this.config.baseUrl}/solicitudes/${solicitudId}`,
    );
  }

  /**
   * POST /api/solicitudes/{id}/rechazar
   * Descripción: HU-04. El conductor rechaza; emparejamiento reasigna.
   * Request:  RechazarSolicitudRequestDto
   * Response: 200 { solicitudId, estado }
   * Errores:  404 SOLICITUD_NO_ENCONTRADA · 410 SOLICITUD_EXPIRADA
   */
  rechazar(
    solicitudId: string,
    req: RechazarSolicitudRequestDto = {},
  ): Observable<{ solicitudId: string; estado: string }> {
    return this.http.post<{ solicitudId: string; estado: string }>(
      `${this.config.baseUrl}/solicitudes/${solicitudId}/rechazar`,
      req,
    );
  }
}
