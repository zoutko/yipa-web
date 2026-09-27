import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore, ViajeService, YipaSplash } from '@yipa/shared';
import { catchError, of } from 'rxjs';

/**
 * Pantalla 1 · Splash.
 * Restaura la sesión y decide el destino: login, viaje activo o home.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [YipaSplash],
  template: `<yipa-splash lema="Pide tu YIPA en segundos" />`,
})
export class SplashPage implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly viajes = inject(ViajeService);

  ngOnInit(): void {
    setTimeout(() => this.decidirDestino(), 1600);
  }

  private decidirDestino(): void {
    if (!this.session.autenticado()) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    this.viajes
      .activo()
      .pipe(catchError(() => of(null)))
      .subscribe((viaje) => {
        if (!viaje) {
          void this.router.navigate(['/app/inicio']);
          return;
        }
        const ruta = viaje.estado === 'EN_CURSO' ? 'en-curso' : 'seguimiento';
        void this.router.navigate(['/viaje', viaje.id, ruta]);
      });
  }
}
