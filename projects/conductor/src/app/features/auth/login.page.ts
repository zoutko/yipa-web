import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ToastService, YipaButton, YipaTextField } from '@yipa/shared';

/**
 * Pantalla 2 · Login del conductor.
 * POST /api/auth/login (rol = CONDUCTOR)
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
        <span class="etiqueta">CONDUCTOR</span>
      </header>

      <form class="formulario" (submit)="entrar($event)">
        <yipa-text-field
          etiqueta="Correo"
          tipo="email"
          icono="✉️"
          autocomplete="email"
          [(valor)]="email"
          [error]="errorEmail()"
        />
        <yipa-text-field
          etiqueta="Contraseña"
          tipo="password"
          icono="🔒"
          autocomplete="current-password"
          [(valor)]="password"
        />
        <button yipa-button variante="secundario" [bloque]="true" [cargando]="cargando()" type="submit">
          Entrar a conducir
        </button>
        <button yipa-button variante="fantasma" [bloque]="true" type="button" (click)="usarDemo()">
          Usar cuenta demo
        </button>
      </form>

      <p class="pie yipa-subhead">
        ¿Quieres manejar con YIPA?
        <a routerLink="/auth/registro" class="enlace">Regístrate</a>
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
      .etiqueta {
        font-size: var(--yipa-fs-caption);
        letter-spacing: 0.22em;
        font-weight: var(--yipa-fw-semibold);
        background: var(--yipa-secondary);
        color: var(--yipa-text-on-dark);
        padding: 4px 12px;
        border-radius: var(--yipa-radius-pill);
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

  protected readonly email = signal('conductor@yipa.co');
  protected readonly password = signal('yipa1234');
  protected readonly cargando = signal(false);
  protected readonly errorEmail = signal<string | null>(null);

  protected usarDemo(): void {
    this.email.set('conductor@yipa.co');
    this.password.set('yipa1234');
    this.entrar();
  }

  protected entrar(evento?: Event): void {
    evento?.preventDefault();
    const email = this.email().trim();
    this.errorEmail.set(email.includes('@') ? null : 'Escribe un correo válido');
    if (this.errorEmail()) return;

    this.cargando.set(true);
    this.auth.login({ email, password: this.password(), rol: 'CONDUCTOR' }).subscribe({
      next: () => {
        this.cargando.set(false);
        void this.router.navigate(['/app/dashboard']);
      },
      error: (e) => {
        this.cargando.set(false);
        this.toast.desdeHttp(e, 'No pudimos iniciar sesión');
      },
    });
  }
}
