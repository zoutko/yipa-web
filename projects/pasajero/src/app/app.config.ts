import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideYipa } from '@yipa/shared';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    // useMocks: true -> responde el backend simulado en memoria.
    // Para conectar Spring Boot: { baseUrl: 'https://api.yipa.co/api', useMocks: false }
    provideYipa({ baseUrl: '/api', useMocks: true }),
  ],
};
