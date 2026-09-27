import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthService,
  MetodoPago,
  Pasajero,
  SessionStore,
  ToastService,
  YipaAppBar,
  YipaAvatar,
  YipaButton,
  YipaRating,
  YipaTextField,
} from '@yipa/shared';

/**
 * Pantalla 13 · Perfil del pasajero.
 * GET /api/usuarios/me · PUT /api/usuarios/me
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaAvatar, YipaButton, YipaRating, YipaTextField],
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
          <p class="yipa-caption">{{ perfil()?.viajesRealizados ?? 0 }} viajes con YIPA</p>
        </div>

        <div class="yipa-card campos">
          <yipa-text-field etiqueta="Nombre" [(valor)]="nombre" />
          <yipa-text-field etiqueta="Apellido" [(valor)]="apellido" />
          <yipa-text-field etiqueta="Teléfono" tipo="tel" [(valor)]="telefono" />
          <div class="pagos">
            <span class="yipa-caption">Método de pago preferido</span>
            <div class="chips">
              @for (metodo of metodos; track metodo) {
                <button
                  class="chip"
                  type="button"
                  [class.is-activa]="metodo === metodoPago()"
                  (click)="metodoPago.set(metodo)"
                >
                  {{ metodo }}
                </button>
              }
            </div>
          </div>
        </div>

        <button yipa-button [bloque]="true" [cargando]="guardando()" type="button" (click)="guardar()">
          Guardar cambios
        </button>
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
      .campos {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-4);
      }
      .pagos {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
      .chips {
        display: flex;
        gap: var(--yipa-sp-2);
        flex-wrap: wrap;
      }
      .chip {
        padding: 8px 14px;
        border-radius: var(--yipa-radius-pill);
        border: 1px solid var(--yipa-border);
        background: var(--yipa-surface);
        font-size: var(--yipa-fs-footnote);
        cursor: pointer;
      }
      .chip.is-activa {
        border-color: var(--yipa-primary);
        background: var(--yipa-primary-soft);
        font-weight: var(--yipa-fw-semibold);
      }
    `,
  ],
})
export class PerfilPage implements OnInit {
  protected readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly metodos: MetodoPago[] = ['TARJETA', 'EFECTIVO', 'BILLETERA'];
  protected readonly perfil = signal<Pasajero | null>(null);
  protected readonly nombre = signal('');
  protected readonly apellido = signal('');
  protected readonly telefono = signal('');
  protected readonly metodoPago = signal<MetodoPago>('TARJETA');
  protected readonly guardando = signal(false);

  ngOnInit(): void {
    this.auth.perfilPasajero().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.nombre.set(perfil.nombre);
        this.apellido.set(perfil.apellido);
        this.telefono.set(perfil.telefono);
        this.metodoPago.set(perfil.metodoPagoPreferido);
      },
      error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar tu perfil'),
    });
  }

  protected guardar(): void {
    this.guardando.set(true);
    this.auth
      .actualizarPerfil({
        nombre: this.nombre(),
        apellido: this.apellido(),
        telefono: this.telefono(),
        metodoPagoPreferido: this.metodoPago(),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.toast.exito('Perfil actualizado');
        },
        error: (e) => {
          this.guardando.set(false);
          this.toast.desdeHttp(e, 'No pudimos guardar los cambios');
        },
      });
  }

  protected salir(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
