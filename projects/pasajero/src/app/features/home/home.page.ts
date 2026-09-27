import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CENTRO_CIUDAD,
  Lugar,
  LugaresService,
  SessionStore,
  ViajeService,
  YipaAvatar,
  YipaMap,
  YipaSheet,
  toLugar,
} from '@yipa/shared';
import { LUGARES } from '@yipa/shared';
import { SolicitudStore } from '../../state/solicitud.store';

/**
 * Pantalla 4 · Home.
 * Mapa + acceso rápido a HU-01 (solicitar viaje) y a los lugares favoritos.
 * GET /api/lugares · GET /api/viajes/activo
 */
@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaMap, YipaSheet, YipaAvatar],
  template: `
    <section class="yipa-screen">
      <div class="yipa-split">
        <div class="yipa-split__map">
          <yipa-map [origen]="ubicacion" [ruta]="[]">
            <div class="saludo yipa-glass">
              <yipa-avatar [nombre]="session.nombreCompleto()" [tamano]="40" />
              <div>
                <p class="yipa-caption">Hola, {{ session.usuario()?.nombre }}</p>
                <p class="yipa-headline">¿A dónde vamos hoy?</p>
              </div>
            </div>
          </yipa-map>
        </div>

        <div class="yipa-split__panel">
          <yipa-sheet>
            <button class="buscador" type="button" (click)="solicitar()">
              <span class="punto"></span>
              <span class="texto">Buscar destino</span>
              <span class="atajo">Ahora</span>
            </button>

            <div class="favoritos">
              @for (lugar of favoritos(); track lugar.id) {
                <button class="chip" type="button" (click)="irA(lugar)">
                  <span>{{ icono(lugar) }}</span>
                  <span class="chip-texto">{{ lugar.nombre }}</span>
                </button>
              }
            </div>

            <h3 class="yipa-headline seccion">Recientes</h3>
            <div class="yipa-list">
              @for (lugar of recientes(); track lugar.id) {
                <button class="yipa-list-item" type="button" (click)="irA(lugar)">
                  <span class="icono-lista">🕘</span>
                  <span class="yipa-grow">
                    <span class="nombre">{{ lugar.nombre }}</span>
                    <span class="direccion yipa-caption">{{ lugar.direccion }}</span>
                  </span>
                  <span class="chevron">›</span>
                </button>
              }
            </div>
          </yipa-sheet>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .saludo {
        position: absolute;
        top: calc(var(--yipa-sp-4) + env(safe-area-inset-top, 0px));
        left: var(--yipa-sp-4);
        right: var(--yipa-sp-4);
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
        padding: var(--yipa-sp-3);
        box-shadow: var(--yipa-shadow-sm);
      }
      .buscador {
        display: flex;
        align-items: center;
        gap: var(--yipa-sp-3);
        width: 100%;
        padding: var(--yipa-sp-4);
        border: 0;
        border-radius: var(--yipa-radius-md);
        background: var(--yipa-surface);
        box-shadow: var(--yipa-shadow-xs);
        font-size: var(--yipa-fs-body);
        color: var(--yipa-text-secondary);
        cursor: pointer;
        transition: transform var(--yipa-dur-fast) var(--yipa-ease);
      }
      .buscador:active {
        transform: scale(0.98);
      }
      .punto {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--yipa-primary);
        box-shadow: 0 0 0 4px var(--yipa-primary-soft);
      }
      .texto {
        flex: 1;
        text-align: left;
      }
      .atajo {
        font-size: var(--yipa-fs-caption);
        background: var(--yipa-secondary-soft);
        padding: 4px 10px;
        border-radius: var(--yipa-radius-pill);
      }
      .favoritos {
        display: flex;
        gap: var(--yipa-sp-2);
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: 1px solid var(--yipa-border);
        border-radius: var(--yipa-radius-pill);
        background: var(--yipa-surface);
        font-size: var(--yipa-fs-footnote);
        white-space: nowrap;
        cursor: pointer;
      }
      .chip:active {
        transform: scale(0.96);
      }
      .seccion {
        margin-top: var(--yipa-sp-1);
      }
      .nombre,
      .direccion {
        display: block;
      }
      .chevron {
        color: var(--yipa-text-tertiary);
        font-size: 20px;
      }
      .icono-lista {
        font-size: 18px;
      }
    `,
  ],
})
export class HomePage implements OnInit {
  protected readonly session = inject(SessionStore);
  private readonly lugares = inject(LugaresService);
  private readonly viajes = inject(ViajeService);
  private readonly store = inject(SolicitudStore);
  private readonly router = inject(Router);

  protected readonly ubicacion = CENTRO_CIUDAD;
  protected readonly favoritos = signal<Lugar[]>(
    LUGARES.filter((l) => ['casa', 'trabajo', 'favorito'].includes(l.tipo ?? '')).map(toLugar),
  );
  protected readonly recientes = signal<Lugar[]>([]);

  ngOnInit(): void {
    this.store.origen.set({
      id: 'actual',
      nombre: 'Mi ubicación',
      direccion: 'Cra. 14 #12-45, Armenia',
      coordenada: CENTRO_CIUDAD,
      tipo: 'reciente',
    });
    this.lugares.buscar('').subscribe((lista) => this.recientes.set(lista.slice(0, 4)));
    this.viajes.activo().subscribe((viaje) => {
      if (viaje) {
        const ruta = viaje.estado === 'EN_CURSO' ? 'en-curso' : 'seguimiento';
        void this.router.navigate(['/viaje', viaje.id, ruta]);
      }
    });
  }

  protected icono(lugar: Lugar): string {
    return lugar.tipo === 'casa' ? '🏠' : lugar.tipo === 'trabajo' ? '💼' : '⭐';
  }

  protected irA(lugar: Lugar): void {
    this.store.destino.set(lugar);
    void this.router.navigate(['/viaje/solicitar']);
  }

  protected solicitar(): void {
    this.store.destino.set(null);
    void this.router.navigate(['/viaje/solicitar']);
  }
}
