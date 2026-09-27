import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CalificacionService,
  ToastService,
  Viaje,
  ViajeService,
  YipaAppBar,
  YipaAvatar,
  YipaButton,
  YipaRating,
  YipaTextField,
} from '@yipa/shared';

const ETIQUETAS = [
  'Conducción segura',
  'Muy amable',
  'Carro limpio',
  'Puntual',
  'Buena música',
  'Excelente ruta',
];

/**
 * Pantalla 11 · Calificación del conductor (HU-08).
 * POST /api/viajes/{id}/calificacion
 */
@Component({
  selector: 'app-calificar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaAvatar, YipaButton, YipaRating, YipaTextField],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Calificar viaje" (volver)="volver()" />

      <div class="yipa-scroll">
        @if (viaje()?.conductor; as c) {
          <div class="conductor">
            <yipa-avatar [nombre]="c.nombre" [fotoUrl]="c.fotoUrl" [tamano]="84" />
            <h2 class="yipa-title-2">¿Cómo estuvo {{ c.nombre }}?</h2>
            <p class="yipa-subhead">{{ c.vehiculo.marca }} {{ c.vehiculo.modelo }}</p>
          </div>
        }

        <div class="estrellas">
          <yipa-rating [(valor)]="puntuacion" [editable]="true" [tamano]="42" />
        </div>

        <div class="etiquetas">
          @for (etiqueta of etiquetas; track etiqueta) {
            <button
              class="chip"
              type="button"
              [class.is-activa]="seleccionadas().includes(etiqueta)"
              (click)="alternar(etiqueta)"
            >
              {{ etiqueta }}
            </button>
          }
        </div>

        <yipa-text-field
          etiqueta="Comentario (opcional)"
          placeholder="Cuéntanos más sobre tu viaje"
          [(valor)]="comentario"
        />

        <button
          yipa-button
          [bloque]="true"
          [cargando]="enviando()"
          [disabled]="puntuacion() === 0"
          type="button"
          (click)="enviar()"
        >
          Enviar calificación
        </button>
        <button yipa-button variante="fantasma" [bloque]="true" type="button" (click)="omitir()">
          Ahora no
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .conductor {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--yipa-sp-2);
        text-align: center;
        padding-top: var(--yipa-sp-4);
      }
      .estrellas {
        display: flex;
        justify-content: center;
      }
      .etiquetas {
        display: flex;
        flex-wrap: wrap;
        gap: var(--yipa-sp-2);
        justify-content: center;
      }
      .chip {
        padding: 8px 14px;
        border-radius: var(--yipa-radius-pill);
        border: 1px solid var(--yipa-border);
        background: var(--yipa-surface);
        font-size: var(--yipa-fs-footnote);
        cursor: pointer;
        transition: transform var(--yipa-dur-fast) var(--yipa-ease);
      }
      .chip:active {
        transform: scale(0.95);
      }
      .chip.is-activa {
        border-color: var(--yipa-primary);
        background: var(--yipa-primary-soft);
        font-weight: var(--yipa-fw-semibold);
      }
    `,
  ],
})
export class CalificarPage implements OnInit {
  readonly viajeId = input.required<string>();

  private readonly viajes = inject(ViajeService);
  private readonly calificaciones = inject(CalificacionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly etiquetas = ETIQUETAS;
  protected readonly viaje = signal<Viaje | null>(null);
  protected readonly puntuacion = signal(0);
  protected readonly seleccionadas = signal<string[]>([]);
  protected readonly comentario = signal('');
  protected readonly enviando = signal(false);

  ngOnInit(): void {
    this.viajes.obtener(this.viajeId()).subscribe({
      next: (viaje) => this.viaje.set(viaje),
      error: (e) => this.toast.desdeHttp(e, 'No pudimos cargar el viaje'),
    });
  }

  protected alternar(etiqueta: string): void {
    const actuales = this.seleccionadas();
    this.seleccionadas.set(
      actuales.includes(etiqueta)
        ? actuales.filter((e) => e !== etiqueta)
        : [...actuales, etiqueta],
    );
  }

  protected enviar(): void {
    const puntuacion = this.puntuacion();
    if (puntuacion < 1 || puntuacion > 5) return;
    this.enviando.set(true);
    this.calificaciones
      .calificar(this.viajeId(), {
        puntuacion: puntuacion as 1 | 2 | 3 | 4 | 5,
        etiquetas: this.seleccionadas(),
        comentario: this.comentario() || undefined,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.toast.exito('¡Gracias por tu calificación!');
          void this.router.navigate(['/app/inicio']);
        },
        error: (e) => {
          this.enviando.set(false);
          this.toast.desdeHttp(e, 'No pudimos enviar la calificación');
        },
      });
  }

  protected omitir(): void {
    void this.router.navigate(['/app/inicio']);
  }

  protected volver(): void {
    void this.router.navigate(['/viaje', this.viajeId(), 'finalizado']);
  }
}
