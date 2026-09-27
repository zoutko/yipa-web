import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ToastService, YipaButton, YipaTextField } from '@yipa/shared';

/**
 * Pantalla 2 · Login.
 * POST /api/auth/login  (rol = PASAJERO)
 */
@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, YipaButton, YipaTextField],
  template: `
    <section class="yipa-screen pantalla">
      <header class="cabecera">
        <span class="jeep">🚙</span>
        <h1 class="marca">YIPA</h1>
        <p class="yipa-subhead">Entra y pide tu viaje</p>
      </header>

      <form class="formulario" (submit)="entrar($event)">
        <yipa-text-field
          etiqueta="Correo"
          placeholder="tucorreo@yipa.co"
          tipo="email"
          icono="✉️"
          autocomplete="email"
          [(valor)]="email"
          [error]="errores().email"
        />
        <yipa-text-field
          etiqueta="Contraseña"
          placeholder="••••••••"
          tipo="password"
          icono="🔒"
          autocomplete="current-password"
          [(valor)]="password"
          [error]="errores().password"
        />

        <button yipa-button variante="primario" [bloque]="true" [cargando]="cargando()" type="submit">
          Iniciar sesión
        </button>
        <button yipa-button variante="fantasma" [bloque]="true" type="button" (click)="usarDemo()">
          Usar cuenta demo
        </button>
      </form>

      <p class="pie yipa-subhead">
        ¿Nueva en YIPA? <a routerLink="/auth/registro" class="enlace">Crea tu cuenta</a>
      </p>
    </section>
  `,
  styles: [
    `
      .pantalla {
        justify-content: center;
        gap: var(--yipa-sp-8);
        padding: var(--yipa-sp-6);
        background: radial-gradient(130% 60% at 50% 0%, #ffffff 0%, var(--yipa-bg) 55%);
      }
      .cabecera {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--yipa-sp-1);
      }
      .jeep {
        font-size: 52px;
      }
      .marca {
        font-size: 2.4rem;
        letter-spacing: 0.2em;
        margin-left: 0.2em;
        font-weight: var(--yipa-fw-bold);
      }
      .formulario {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-4);
        width: 100%;
        max-width: 460px;
        margin-inline: auto;
      }
      .pie {
        text-align: center;
      }
      .enlace {
        color: var(--yipa-primary-dark);
        font-weight: var(--yipa-fw-semibold);
      }
    `,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly email = signal('pasajero@yipa.co');
  protected readonly password = signal('yipa1234');
  protected readonly cargando = signal(false);
  protected readonly errores = signal<{ email: string | null; password: string | null }>({
    email: null,
    password: null,
  });

  protected usarDemo(): void {
    this.email.set('pasajero@yipa.co');
    this.password.set('yipa1234');
    this.entrar();
  }

  protected entrar(evento?: Event): void {
    evento?.preventDefault();
    const email = this.email().trim();
    const password = this.password();
    this.errores.set({
      email: email.includes('@') ? null : 'Escribe un correo válido',
      password: password.length >= 4 ? null : 'Mínimo 4 caracteres',
    });
    if (this.errores().email || this.errores().password) return;

    this.cargando.set(true);
    this.auth.login({ email, password, rol: 'PASAJERO' }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.toast.exito('¡Bienvenida de vuelta!');
        void this.router.navigate(['/app/inicio']);
      },
      error: (e) => {
        this.cargando.set(false);
        this.toast.desdeHttp(e, 'No pudimos iniciar sesión');
      },
    });
  }
}
