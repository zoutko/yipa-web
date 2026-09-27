import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DEFAULT_API_CONFIG, YIPA_API_CONFIG, YipaApiConfig } from './api.config';
import { mockBackendInterceptor } from './mock-backend.interceptor';
import { authInterceptor } from './auth.interceptor';

/**
 * Registra HttpClient + interceptores (auth y mocks) y la configuración de API.
 *
 * Producción:
 * ```ts
 * provideYipa({ baseUrl: 'https://api.yipa.co/api', useMocks: false })
 * ```
 */
export function provideYipa(config: Partial<YipaApiConfig> = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: YIPA_API_CONFIG, useValue: { ...DEFAULT_API_CONFIG, ...config } },
    provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
  ]);
}
