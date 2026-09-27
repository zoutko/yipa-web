import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { YIPA_API_CONFIG } from '../core/api.config';
import {
  ActualizarPerfilRequestDto,
  AuthResponseDto,
  ConductorDto,
  LoginRequestDto,
  PasajeroDto,
  RegistroConductorRequestDto,
  RegistroPasajeroRequestDto,
} from '../dto/api.dto';
import { Conductor, Pasajero } from '../domain/models';
import { toConductor, toPasajero } from '../mappers/mappers';
import { SessionStore } from './session.store';

/**
 * Bounded Context: Pasajeros / Conductores (identidad).
 *
 * POST   /api/auth/login
 * POST   /api/auth/registro/pasajero
 * POST   /api/auth/registro/conductor
 * GET    /api/usuarios/me
 * PUT    /api/usuarios/me
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(YIPA_API_CONFIG);
  private readonly session = inject(SessionStore);

  /**
   * POST /api/auth/login
   * Request:  LoginRequestDto { email, password, rol }
   * Response: 200 AuthResponseDto
   * Errores:  400 CREDENCIALES_INVALIDAS · 401 CREDENCIALES_INVALIDAS · 423 CUENTA_BLOQUEADA
   */
  login(req: LoginRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.config.baseUrl}/auth/login`, req)
      .pipe(tap((res) => this.session.iniciar(res)));
  }

  /**
   * POST /api/auth/registro/pasajero
   * Request:  RegistroPasajeroRequestDto
   * Response: 201 AuthResponseDto
   * Errores:  409 EMAIL_YA_REGISTRADO · 422 EMAIL_INVALIDO / PASSWORD_DEBIL
   */
  registrarPasajero(req: RegistroPasajeroRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.config.baseUrl}/auth/registro/pasajero`, req)
      .pipe(tap((res) => this.session.iniciar(res)));
  }

  /**
   * POST /api/auth/registro/conductor
   * Request:  RegistroConductorRequestDto (incluye licencia y vehículo)
   * Response: 201 AuthResponseDto
   * Errores:  409 EMAIL_YA_REGISTRADO · 409 PLACA_YA_REGISTRADA · 422 DATOS_VEHICULO_INVALIDOS
   */
  registrarConductor(req: RegistroConductorRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.config.baseUrl}/auth/registro/conductor`, req)
      .pipe(tap((res) => this.session.iniciar(res)));
  }

  /**
   * GET /api/usuarios/me
   * Response: 200 PasajeroDto | ConductorDto
   * Errores:  401 NO_AUTENTICADO
   */
  perfilPasajero(): Observable<Pasajero> {
    return this.http
      .get<PasajeroDto>(`${this.config.baseUrl}/usuarios/me`)
      .pipe(map(toPasajero), tap((p) => this.session.actualizarUsuario(p)));
  }

  perfilConductor(): Observable<Conductor> {
    return this.http
      .get<ConductorDto>(`${this.config.baseUrl}/usuarios/me`)
      .pipe(map(toConductor), tap((c) => this.session.actualizarUsuario(c)));
  }

  /**
   * PUT /api/usuarios/me
   * Request:  ActualizarPerfilRequestDto
   * Response: 200 PasajeroDto | ConductorDto
   * Errores:  401 NO_AUTENTICADO · 422 DATOS_INVALIDOS
   */
  actualizarPerfil(req: ActualizarPerfilRequestDto): Observable<Pasajero | Conductor> {
    return this.http.put<PasajeroDto | ConductorDto>(`${this.config.baseUrl}/usuarios/me`, req).pipe(
      map((dto) => (dto.rol === 'CONDUCTOR' ? toConductor(dto as ConductorDto) : toPasajero(dto as PasajeroDto))),
      tap((u) => this.session.actualizarUsuario(u)),
    );
  }

  logout(): void {
    this.session.cerrar();
  }
}
