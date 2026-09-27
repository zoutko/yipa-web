import { Injectable, computed, signal } from '@angular/core';
import { RolUsuario, Usuario } from '../domain/models';
import { AuthResponseDto } from '../dto/api.dto';

const CLAVE = 'yipa.session';

interface SesionPersistida {
  token: string;
  refreshToken: string;
  usuario: Usuario;
}

/**
 * Estado de sesión compartido (signals). Persiste en `localStorage` para que
 * un refresh del navegador no saque al usuario durante la demo.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _token = signal<string | null>(null);
  private readonly _usuario = signal<Usuario | null>(null);

  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._token() !== null);
  readonly rol = computed<RolUsuario | null>(() => this._usuario()?.rol ?? null);
  readonly nombreCompleto = computed(() => {
    const u = this._usuario();
    return u ? `${u.nombre} ${u.apellido}` : '';
  });
  readonly iniciales = computed(() => {
    const u = this._usuario();
    return u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase() : 'YP';
  });

  constructor() {
    this.restaurar();
  }

  iniciar(respuesta: AuthResponseDto): void {
    this._token.set(respuesta.accessToken);
    this._usuario.set(respuesta.usuario);
    this.persistir({
      token: respuesta.accessToken,
      refreshToken: respuesta.refreshToken,
      usuario: respuesta.usuario,
    });
  }

  actualizarUsuario(usuario: Usuario): void {
    this._usuario.set(usuario);
    const actual = this.leer();
    if (actual) this.persistir({ ...actual, usuario });
  }

  cerrar(): void {
    this._token.set(null);
    this._usuario.set(null);
    localStorage.removeItem(CLAVE);
  }

  private restaurar(): void {
    const sesion = this.leer();
    if (!sesion) return;
    this._token.set(sesion.token);
    this._usuario.set(sesion.usuario);
  }

  private leer(): SesionPersistida | null {
    try {
      const raw = localStorage.getItem(CLAVE);
      return raw ? (JSON.parse(raw) as SesionPersistida) : null;
    } catch {
      return null;
    }
  }

  private persistir(sesion: SesionPersistida): void {
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
  }
}
