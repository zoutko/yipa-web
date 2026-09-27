import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  CENTRO_CIUDAD,
  CopPipe,
  EmparejamientoService,
  Lugar,
  LugaresService,
  MetodoPago,
  OpcionCategoria,
  TarifaService,
  ToastService,
  YipaAppBar,
  YipaButton,
  YipaMap,
  YipaSheet,
  YipaTextField,
  fromLugar,
  generarRuta,
} from '@yipa/shared';
import { SolicitudStore } from '../../state/solicitud.store';

/**
 * Pantalla 5 · Solicitar viaje (HU-01 + HU-07).
 * GET  /api/lugares?q=
 * POST /api/tarifas/estimacion
 * POST /api/solicitudes
 */
@Component({
  selector: 'app-solicitar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaAppBar, YipaButton, YipaMap, YipaSheet, YipaTextField, CopPipe],
  template: `
    <section class="yipa-screen">
      <yipa-app-bar titulo="Solicitar viaje" (volver)="atras()" />

      <div class="yipa-split">
        <div class="yipa-split__map">
          <yipa-map
            [origen]="store.origen()?.coordenada"
            [destino]="store.destino()?.coordenada"
            [ruta]="rutaPreview()"
          />
        </div>

        <div class="yipa-split__panel">
          <yipa-sheet>
            <div class="trayecto">
              <div class="linea">
                <span class="punto origen"></span>
                <span class="barra"></span>
                <span class="punto destino"></span>
              </div>
              <div class="direcciones">
                <p class="dir">{{ store.origen()?.nombre ?? 'Mi ubicación' }}</p>
                <p class="dir" [class.is-vacio]="!store.destino()">
                  {{ store.destino()?.nombre ?? 'Elige tu destino' }}
                </p>
              </div>
            </div>

            @if (!store.destino()) {
              <yipa-text-field
                etiqueta="Destino"
                placeholder="Busca un lugar en Armenia"
                icono="🔎"
                [(valor)]="consulta"
                (valorChange)="buscar($event)"
              />
              <div class="yipa-list">
                @for (lugar of resultados(); track lugar.id) {
                  <button class="yipa-list-item" type="button" (click)="elegir(lugar)">
                    <span>📍</span>
                    <span class="yipa-grow">
                      <span class="nombre">{{ lugar.nombre }}</span>
                      <span class="yipa-caption">{{ lugar.direccion }}</span>
                    </span>
                  </button>
                }
              </div>
            } @else {
              <h3 class="yipa-headline">Elige tu YIPA</h3>
              @if (cargandoTarifa()) {
                <p class="yipa-caption">Calculando tarifa…</p>
              }
              <div class="opciones">
                @for (opcion of store.opciones(); track opcion.categoria) {
                  <button
                    class="opcion"
                    type="button"
                    [class.is-activa]="opcion.categoria === store.categoria()"
                    (click)="store.categoria.set(opcion.categoria)"
                  >
                    <span class="icono">{{ opcion.icono }}</span>
                    <span class="yipa-grow info">
                      <span class="nombre">{{ opcion.nombre }}</span>
                      <span class="yipa-caption">
                        {{ opcion.descripcion }} · {{ opcion.etaMinutos }} min
                      </span>
                    </span>
                    <span class="precio">{{ opcion.tarifa.total | cop }}</span>
                  </button>
                }
              </div>

              <div class="pagos">
                @for (metodo of metodos; track metodo.valor) {
                  <button
                    class="chip"
                    type="button"
                    [class.is-activa]="metodo.valor === store.metodoPago()"
                    (click)="store.metodoPago.set(metodo.valor)"
                  >
                    {{ metodo.icono }} {{ metodo.nombre }}
                  </button>
                }
              </div>

              <yipa-text-field
                etiqueta="Nota para el conductor (opcional)"
                placeholder="Ej: portón amarillo"
                [(valor)]="nota"
              />

              <div class="acciones">
                <button yipa-button variante="fantasma" type="button" (click)="cambiarDestino()">
                  Cambiar
                </button>
                <button
                  yipa-button
                  class="yipa-grow"
                  [cargando]="enviando()"
                  [disabled]="!puedeSolicitar()"
                  type="button"
                  (click)="confirmar()"
                >
                  Confirmar {{ total() | cop }}
                </button>
              </div>
            }
          </yipa-sheet>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .trayecto {
        display: flex;
        gap: var(--yipa-sp-3);
        align-items: stretch;
      }
      .linea {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6px 0;
      }
      .punto {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .punto.origen {
        background: var(--yipa-secondary);
      }
      .punto.destino {
        background: var(--yipa-primary);
      }
      .barra {
        flex: 1;
        width: 2px;
        background: repeating-linear-gradient(
          var(--yipa-border) 0 4px,
          transparent 4px 8px
        );
      }
      .direcciones {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--yipa-sp-3);
      }
      .dir {
        font-size: var(--yipa-fs-body);
        font-weight: var(--yipa-fw-medium);
      }
      .dir.is-vacio {
        color: var(--yipa-text-tertiary);
      }
      .opciones {
        display: flex;
        flex-direction: column;
        gap: var(--yipa-sp-2);
      }
      .opcion {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
        padding: var(--yipa-sp-3);
        border: 1.5px solid transparent;
        border-radius: var(--yipa-radius-md);
        background: var(--yipa-surface);
        cursor: pointer;
        text-align: left;
        transition: border-color var(--yipa-dur-base) var(--yipa-ease),
          transform var(--yipa-dur-fast);
      }
      .opcion:active {
        transform: scale(0.99);
      }
      .opcion.is-activa {
        border-color: var(--yipa-primary);
        background: var(--yipa-primary-soft);
      }
      .icono {
        font-size: 26px;
      }
      .info {
        display: flex;
        flex-direction: column;
      }
      .nombre {
        display: block;
        font-weight: var(--yipa-fw-semibold);
      }
      .precio {
        font-weight: var(--yipa-fw-bold);
      }
      .pagos {
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
      .acciones {
        display: flex;
        gap: var(--yipa-sp-3);
      }
    `,
  ],
})
export class SolicitarPage implements OnInit {
  protected readonly store = inject(SolicitudStore);
  private readonly lugares = inject(LugaresService);
  private readonly tarifas = inject(TarifaService);
  private readonly emparejamiento = inject(EmparejamientoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly consulta = signal('');
  protected readonly resultados = signal<Lugar[]>([]);
  protected readonly cargandoTarifa = signal(false);
  protected readonly enviando = signal(false);
  protected readonly nota = signal('');

  protected readonly metodos: Array<{ valor: MetodoPago; nombre: string; icono: string }> = [
    { valor: 'TARJETA', nombre: 'Tarjeta', icono: '💳' },
    { valor: 'EFECTIVO', nombre: 'Efectivo', icono: '💵' },
    { valor: 'BILLETERA', nombre: 'Billetera', icono: '👛' },
  ];

  protected readonly rutaPreview = computed(() => {
    const origen = this.store.origen()?.coordenada;
    const destino = this.store.destino()?.coordenada;
    return origen && destino ? generarRuta(origen, destino) : [];
  });
  protected readonly total = computed(() => this.store.opcionSeleccionada()?.tarifa.total ?? 0);
  protected readonly puedeSolicitar = computed(
    () => this.store.listaParaSolicitar() && !!this.store.opcionSeleccionada(),
  );

  ngOnInit(): void {
    if (!this.store.origen()) {
      this.store.origen.set({
        id: 'actual',
        nombre: 'Mi ubicación',
        direccion: 'Cra. 14 #12-45, Armenia',
        coordenada: CENTRO_CIUDAD,
        tipo: 'reciente',
      });
    }
    this.buscar('');
    if (this.store.destino()) this.estimar();
  }

  protected atras(): void {
    this.location.back();
  }

  protected buscar(texto: string): void {
    this.lugares.buscar(texto).subscribe((lista) => this.resultados.set(lista));
  }

  protected elegir(lugar: Lugar): void {
    this.store.destino.set(lugar);
    this.estimar();
  }

  protected cambiarDestino(): void {
    this.store.destino.set(null);
    this.store.opciones.set([]);
    this.consulta.set('');
    this.buscar('');
  }

  private estimar(): void {
    const origen = this.store.origen()?.coordenada;
    const destino = this.store.destino()?.coordenada;
    if (!origen || !destino) return;
    this.cargandoTarifa.set(true);
    this.tarifas.estimar({ origen, destino }).subscribe({
      next: (estimacion) => {
        this.cargandoTarifa.set(false);
        this.store.opciones.set(estimacion.opciones);
        const actual: OpcionCategoria | undefined = estimacion.opciones[0];
        if (actual && !this.store.opcionSeleccionada()) this.store.categoria.set(actual.categoria);
      },
      error: (e) => {
        this.cargandoTarifa.set(false);
        this.toast.desdeHttp(e, 'No pudimos calcular la tarifa');
      },
    });
  }

  protected confirmar(): void {
    const origen = this.store.origen();
    const destino = this.store.destino();
    if (!origen || !destino) return;

    this.enviando.set(true);
    this.store.nota.set(this.nota());
    this.emparejamiento
      .crearSolicitud({
        origen: fromLugar(origen),
        destino: fromLugar(destino),
        categoria: this.store.categoria(),
        metodoPago: this.store.metodoPago(),
        notaParaConductor: this.nota() || undefined,
      })
      .subscribe({
        next: (solicitud) => {
          this.enviando.set(false);
          void this.router.navigate(['/viaje/esperando', solicitud.id]);
        },
        error: (e) => {
          this.enviando.set(false);
          this.toast.desdeHttp(e, 'No pudimos crear la solicitud');
        },
      });
  }
}
