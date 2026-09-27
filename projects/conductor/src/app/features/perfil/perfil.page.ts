import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthService,
  Conductor,
  SessionStore,
  ToastService,
  YipaAppBar,
  YipaAvatar,
  YipaButton,
  YipaRating,
} from '@yipa/shared';

/**
 * Pantalla 12 · Perfil del conductor (datos personales + vehículo).
 * GET /api/usuarios/me
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaAvatar, YipaButton, YipaRating],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Perfil" [conVolver]="false" />

      <div class="yipa-scroll">
        <div class="cabecera">
          <yipa-avatar
            [nombre]="session.nombreCompleto()"
            [fotoUrl]="perfil()?.fotoUrl"
            [tamano]="88"
          />
          <h2 class="yipa-title-2">{{ session.nombreCompleto() }}</h2>
          <yipa-rating [valor]="perfil()?.calificacionPromedio ?? 0" [tamano]="16" />
          @if (perfil(); as c) {
            <span class="verificado" [class.is-ok]="c.documentosVerificados">
              {{ c.documentosVerificados ? 'Documentos verificados' : 'Verificación pendiente' }}
            </span>
          }
        </div>

        @if (perfil(); as c) {
          <div class="yipa-card lista">
            <div class="fila">
              <span class="yipa-grow">Viajes completados</span>
              <strong>{{ c.viajesCompletados }}</strong>
            </div>
            <div class="fila">
              <span class="yipa-grow">Licencia</span>
              <strong>{{ c.licencia }}</strong>
            </div>
            <div class="fila">
              <span class="yipa-grow">Teléfono</span>
              <strong>{{ c.telefono }}</strong>
            </div>
          </div>

          <h3 class="yipa-headline">Vehículo</h3>
          <div class="yipa-card vehiculo">
            <span class="icono">{{ icono(c.vehiculo.categoria) }}</span>
            <div class="yipa-grow">
              <p class="modelo">{{ c.vehiculo.marca }} {{ c.vehiculo.modelo }}</p>
              <p class="yipa-caption">
                {{ c.vehiculo.color }} · {{ c.vehiculo.anio }} · {{ c.vehiculo.capacidad }} plazas
              </p>
            </div>
            <span class="placa">{{ c.vehiculo.placa }}</span>
          </div>
        }

        <button yipa-button variante="peligro" [bloque]="true" type="button" (click)="salir()">
          Cerrar sesión
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .cabecera {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--yipa-sp-2);
        padding-top: var(--yipa-sp-3);
      }
      .verificado {
        font-size: var(--yipa-fs-caption);
        padding: 4px 12px;
        border-radius: var(--yipa-radius-pill);
        background: var(--yipa-secondary-soft);
        color: var(--yipa-text-secondary);
      }
      .verificado.is-ok {
        background: rgba(52, 199, 89, 0.14);
        color: var(--yipa-success);
      }
      .lista {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
      .fila {
        display: flex;
        gap: var(--yipa-sp-3);
      }
      .vehiculo {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
      }
      .icono {
        font-size: 30px;
      }
      .modelo {
        font-weight: var(--yipa-fw-semibold);
      }
      .placa {
        font-family: var(--yipa-font-mono, monospace);
        font-weight: var(--yipa-fw-bold);
        letter-spacing: 0.08em;
        background: var(--yipa-primary-soft);
        padding: 6px 10px;
        border-radius: var(--yipa-radius-sm);
      }
    `,
  ],
})
export class PerfilPage implements OnInit {
  protected readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly perfil = signal<Conductor | null>(null);

  ngOnInit(): void {
    this.auth.perfilConductor().subscribe({
      next: (perfil) => this.perfil.set(perfil),
      error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar tu perfil'),
    });
  }

  protected icono(categoria: string): string {
    return categoria === 'YIPA_MOTO' ? '🛵' : categoria === 'YIPA_XL' ? '🚐' : '🚙';
  }

  protected salir(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
