import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import { YIPA_API_CONFIG } from './api.config';
import { MockBackend, MockHttpError } from '../mocks/mock-backend';
import { ApiErrorDto } from '../dto/api.dto';

/**
 * Intercepta `/api/**` y responde con el backend simulado.
 * Para conectar el backend real: `useMocks: false` en `YIPA_API_CONFIG`.
 */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(YIPA_API_CONFIG);
  const backend = inject(MockBackend);

  if (!config.useMocks || !req.url.startsWith('/api')) {
    return next(req);
  }

  const params: Record<string, string> = {};
  req.params.keys().forEach((k) => (params[k] = req.params.get(k) ?? ''));
  const path = req.url.split('?')[0];

  return defer((): Observable<HttpResponse<unknown>> => {
    try {
      const body = backend.handle(req.method, path, req.body, params);
      return of(new HttpResponse({ status: 200, body, url: req.url }));
    } catch (error) {
      const mockError =
        error instanceof MockHttpError
          ? error
          : new MockHttpError(500, 'ERROR_INTERNO', (error as Error).message);
      const payload: ApiErrorDto = {
        timestamp: new Date().toISOString(),
        status: mockError.status,
        code: mockError.code,
        message: mockError.message,
        path,
      };
      return throwError(
        () =>
          new HttpErrorResponse({
            status: mockError.status,
            statusText: mockError.code,
            error: payload,
            url: req.url,
          }),
      );
    }
  }).pipe(delay(config.mockLatencyMs));
};
