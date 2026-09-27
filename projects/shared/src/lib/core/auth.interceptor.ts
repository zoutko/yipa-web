import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../services/session.store';

/**
 * Añade `Authorization: Bearer <token>` y el rol activo a cada llamada `/api`.
 * El backend Spring Boot leerá el JWT; el parámetro `rol` existe solo mientras
 * se usan mocks (el backend real lo deduce del token).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const token = session.token();
  if (!token || !req.url.startsWith('/api')) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      setParams: req.params.has('rol') ? {} : { rol: session.rol() ?? 'PASAJERO' },
    }),
  );
};
