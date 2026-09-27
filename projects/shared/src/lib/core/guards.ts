import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../services/session.store';

/** Bloquea rutas privadas y recuerda el destino para volver tras el login. */
export const authGuard =
  (rutaLogin = '/auth/login'): CanActivateFn =>
  (_route, state) => {
    const session = inject(SessionStore);
    const router = inject(Router);
    if (session.autenticado()) return true;
    return router.createUrlTree([rutaLogin], { queryParams: { redirigir: state.url } });
  };

/** Evita que un usuario autenticado vuelva a login/registro. */
export const invitadoGuard =
  (rutaHome = '/app'): CanActivateFn =>
  () => {
    const session = inject(SessionStore);
    const router = inject(Router);
    return session.autenticado() ? router.createUrlTree([rutaHome]) : true;
  };
