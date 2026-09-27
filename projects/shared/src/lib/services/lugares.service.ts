import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { YIPA_API_CONFIG } from '../core/api.config';
import { LugarDto } from '../dto/api.dto';
import { Lugar } from '../domain/models';
import { toLugar } from '../mappers/mappers';

/**
 * Bounded Context: Viajes (sub-dominio geografía / direcciones).
 *
 * GET /api/lugares?q={texto}
 */
@Injectable({ providedIn: 'root' })
export class LugaresService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(YIPA_API_CONFIG);

  /**
   * GET /api/lugares
   * Descripción: autocompletado de direcciones/puntos de interés.
   * Request:  query param `q` (texto libre, mínimo 0 caracteres)
   * Response: 200 LugarDto[]
   * Errores:  429 DEMASIADAS_PETICIONES
   */
  buscar(q: string): Observable<Lugar[]> {
    return this.http
      .get<LugarDto[]>(`${this.config.baseUrl}/lugares`, { params: new HttpParams().set('q', q) })
      .pipe(map((lista) => lista.map(toLugar)));
  }
}
