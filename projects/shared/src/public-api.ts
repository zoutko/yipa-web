/*
 * API pública de la librería compartida YIPA.
 * Consumida por las apps `pasajero` y `conductor` vía el alias `@yipa/shared`.
 */

// Dominio y contratos
export * from './lib/domain/models';
export * from './lib/dto/api.dto';
export * from './lib/mappers/mappers';

// Núcleo
export * from './lib/core/api.config';
export * from './lib/core/provide-yipa';
export * from './lib/core/guards';
export * from './lib/core/geo.util';
export * from './lib/core/auth.interceptor';
export * from './lib/core/mock-backend.interceptor';

// Servicios (capa de acceso a API)
export * from './lib/services/session.store';
export * from './lib/services/auth.service';
export * from './lib/services/lugares.service';
export * from './lib/services/tarifa.service';
export * from './lib/services/emparejamiento.service';
export * from './lib/services/viaje.service';
export * from './lib/services/conductor.service';
export * from './lib/services/calificacion.service';
export * from './lib/services/toast.service';

// Mocks
export * from './lib/mocks/mock-data';
export * from './lib/mocks/mock-backend';

// Component library
export * from './lib/ui/button.component';
export * from './lib/ui/app-bar.component';
export * from './lib/ui/sheet.component';
export * from './lib/ui/avatar.component';
export * from './lib/ui/rating.component';
export * from './lib/ui/map.component';
export * from './lib/ui/toast-host.component';
export * from './lib/ui/tab-bar.component';
export * from './lib/ui/text-field.component';
export * from './lib/ui/estado-viaje.component';
export * from './lib/ui/tarifa-desglose.component';
export * from './lib/ui/empty-state.component';
export * from './lib/ui/splash.component';

// Pipes
export * from './lib/pipes/cop.pipe';
export * from './lib/pipes/fecha-relativa.pipe';
