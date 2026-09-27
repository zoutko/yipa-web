import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  AuthService,
  ToastService,
  YipaAppBar,
  YipaButton,
  YipaTextField,
} from '@yipa/shared';

/**
 * Pantalla 3 · Registro de pasajero.
 * POST /api/auth/registro/pasajero
 */
@Component({
  selector: 'app-registro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaButton, YipaTextField],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Crear cuenta" subtitulo="Pasajero" (volver)="atras()" />

      <form class="yipa-scroll" (submit)="registrar($event)">
        <div class="yipa-card campos">
          <yipa-text-field etiqueta="Nombre" [(valor)]="nombre" placeholder="Valentina" />
          <yipa-text-field etiqueta="Apellido" [(valor)]="apellido" placeholder="Ramírez" />
          <yipa-text-field
            etiqueta="Correo"
            tipo="email"
            [(valor)]="email"
            placeholder="tucorreo@yipa.co"
            [error]="errorEmail()"
          />
          <yipa-text-field
            etiqueta="Teléfono"
            tipo="tel"
            [(valor)]="telefono"
            placeholder="+57 300 000 0000"
          />
          <yipa-text-field
            etiqueta="Contraseña"
            tipo="password"
            [(valor)]="password"
            ayuda="Mínimo 8 caracteres"
            [error]="errorPassword()"
          />
        </div>

        <p class="yipa-caption legal">
          Al continuar aceptas los Términos de Servicio y la Política de Privacidad de YIPA.
        </p>

        <button yipa-button [bloque]="true" [cargando]="cargando()" type="submit">
          Crear cuenta
        </button>
      </form>
    </section>
  `,
  styles: [
    `
      .campos {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-4);
      }
      .legal {
        text-align: center;
      }
    `,
  ],
})
export class RegistroPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);

  protected readonly nombre = signal('');
  protected readonly apellido = signal('');
  protected readonly email = signal('');
  protected readonly telefono = signal('');
  protected readonly password = signal('');
  protected readonly cargando = signal(false);
  protected readonly errorEmail = signal<string | null>(null);
  protected readonly errorPassword = signal<string | null>(null);

  protected atras(): void {
    this.location.back();
  }

  protected registrar(evento: Event): void {
    evento.preventDefault();
    this.errorEmail.set(this.email().includes('@') ? null : 'Correo inválido');
    this.errorPassword.set(this.password().length >= 8 ? null : 'Mínimo 8 caracteres');
    if (this.errorEmail() || this.errorPassword()) return;

    this.cargando.set(true);
    this.auth
      .registrarPasajero({
        nombre: this.nombre().trim() || 'Pasajero',
        apellido: this.apellido().trim() || 'YIPA',
        email: this.email().trim(),
        telefono: this.telefono().trim(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.toast.exito('Cuenta creada. ¡Bienvenido a YIPA!');
          void this.router.navigate(['/app/inicio']);
        },
        error: (e) => {
          this.cargando.set(false);
          this.toast.desdeHttp(e, 'No pudimos crear la cuenta');
        },
      });
  }
}
