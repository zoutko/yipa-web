import { InjectionToken } from '@angular/core';

/**
 * Configuración de la capa de API.
 *
 * `useMocks: true` activa el `mockBackendInterceptor`, que responde en memoria
 * a todas las rutas `/api/**`. Para conectar el backend real (Spring Boot)
 * basta con poner `useMocks: false` y apuntar `baseUrl` al gateway.
 */
export interface YipaApiConfig {
  baseUrl: string;
  useMocks: boolean;
  /** Latencia simulada (ms) para que la UI muestre estados de carga reales. */
  mockLatencyMs: number;
  /** Intervalo de polling para seguimiento en vivo (HU-05/HU-06). */
  pollingIntervalMs: number;
}

export const YIPA_API_CONFIG = new InjectionToken<YipaApiConfig>('YIPA_API_CONFIG');

export const DEFAULT_API_CONFIG: YipaApiConfig = {
  baseUrl: '/api',
  useMocks: true,
  mockLatencyMs: 450,
  pollingIntervalMs: 2000,
};
