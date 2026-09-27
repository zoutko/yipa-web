import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  AuthService,
  CategoriaVehiculo,
  ToastService,
  YipaAppBar,
  YipaButton,
  YipaTextField,
} from '@yipa/shared';

/**
 * Pantalla 3 · Registro de conductor + vehículo.
 * POST /api/auth/registro/conductor
 */
@Component({
  selector: 'app-registro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaButton, YipaTextField],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Registro" subtitulo="Conductor" (volver)="atras()" />

      <form class="yipa-scroll" (submit)="registrar($event)">
        <h3 class="yipa-headline">Tus datos</h3>
        <div class="yipa-card campos">
          <yipa-text-field etiqueta="Nombre" [(valor)]="nombre" />
          <yipa-text-field etiqueta="Apellido" [(valor)]="apellido" />
          <yipa-text-field etiqueta="Correo" tipo="email" [(valor)]="email" [error]="errorEmail()" />
          <yipa-text-field etiqueta="Teléfono" tipo="tel" [(valor)]="telefono" />
          <yipa-text-field etiqueta="Licencia de conducción" [(valor)]="licencia" />
          <yipa-text-field
            etiqueta="Contraseña"
            tipo="password"
            [(valor)]="password"
            ayuda="Mínimo 8 caracteres"
            [error]="errorPassword()"
          />
        </div>

        <h3 class="yipa-headline">Tu vehículo</h3>
        <div class="yipa-card campos">
          <yipa-text-field etiqueta="Placa" [(valor)]="placa" placeholder="ABC123" />
          <yipa-text-field etiqueta="Marca" [(valor)]="marca" placeholder="Willys" />
          <yipa-text-field etiqueta="Modelo" [(valor)]="modelo" placeholder="Yipao" />
          <yipa-text-field etiqueta="Color" [(valor)]="color" placeholder="Amarillo" />
          <yipa-text-field etiqueta="Año" tipo="number" [(valor)]="anio" />
          <div class="categorias">
            <span class="yipa-caption">Categoría del servicio</span>
            <div class="chips">
              @for (opcion of categorias; track opcion.valor) {
                <button
                  class="chip"
                  type="button"
                  [class.is-activa]="opcion.valor === categoria()"
                  (click)="categoria.set(opcion.valor)"
                >
                  {{ opcion.icono }} {{ opcion.nombre }}
                </button>
              }
            </div>
          </div>
        </div>

        <button yipa-button [bloque]="true" [cargando]="cargando()" type="submit">
          Crear cuenta de conductor
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
      .categorias {
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
export class RegistroPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);

  protected readonly categorias: Array<{
    valor: CategoriaVehiculo;
    nombre: string;
    icono: string;
  }> = [
    { valor: 'YIPA_X', nombre: 'YIPA X', icono: '🚙' },
    { valor: 'YIPA_XL', nombre: 'YIPA XL', icono: '🚐' },
    { valor: 'YIPA_MOTO', nombre: 'YIPA Moto', icono: '🛵' },
  ];

  protected readonly nombre = signal('');
  protected readonly apellido = signal('');
  protected readonly email = signal('');
  protected readonly telefono = signal('');
  protected readonly licencia = signal('');
  protected readonly password = signal('');
  protected readonly placa = signal('');
  protected readonly marca = signal('');
  protected readonly modelo = signal('');
  protected readonly color = signal('');
  protected readonly anio = signal('2019');
  protected readonly categoria = signal<CategoriaVehiculo>('YIPA_X');
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
      .registrarConductor({
        nombre: this.nombre().trim() || 'Conductor',
        apellido: this.apellido().trim() || 'YIPA',
        email: this.email().trim(),
        telefono: this.telefono().trim(),
        password: this.password(),
        licencia: this.licencia().trim() || 'LIC-000000',
        vehiculo: {
          placa: this.placa().trim().toUpperCase() || 'YIP000',
          marca: this.marca().trim() || 'Willys',
          modelo: this.modelo().trim() || 'Yipao',
          color: this.color().trim() || 'Amarillo',
          anio: Number(this.anio()) || 2019,
          categoria: this.categoria(),
          capacidad: this.categoria() === 'YIPA_MOTO' ? 1 : this.categoria() === 'YIPA_XL' ? 6 : 4,
        },
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.toast.exito('Cuenta creada. ¡A rodar!');
          void this.router.navigate(['/app/dashboard']);
        },
        error: (e) => {
          this.cargando.set(false);
          this.toast.desdeHttp(e, 'No pudimos crear la cuenta');
        },
      });
  }
}
