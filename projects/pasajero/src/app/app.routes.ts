import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from '@yipa/shared';

/**
 * Mapa de rutas · YIPA Pasajero
 *
 *  /                       Splash            (arranque, restaura sesión)
 *  /auth/login             Login             (HU previa)
 *  /auth/registro          Registro
 *  /app/inicio             Home              (HU-01 entrada)
 *  /app/historial          Historial         (HU-09)
 *  /app/perfil             Perfil
 *  /app/configuracion      Configuración
 *  /viaje/solicitar        Solicitar viaje   (HU-01, HU-07)
 *  /viaje/esperando/:id    Esperando conductor (HU-03, HU-10)
 *  /viaje/:id/seguimiento  Seguimiento       (HU-05, HU-06, HU-10)
 *  /viaje/:id/en-curso     Viaje en curso    (HU-06)
 *  /viaje/:id/finalizado   Viaje finalizado  (HU-06)
 *  /viaje/:id/tarifa       Resumen de tarifa (HU-07)
 *  /viaje/:id/calificar    Calificación      (HU-08)
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'auth',
    canActivate: [invitadoGuard('/app/inicio')],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'registro',
        loadComponent: () => import('./features/auth/registro.page').then((m) => m.RegistroPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard('/auth/login')],
    loadComponent: () => import('./layout/tabs.layout').then((m) => m.TabsLayout),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./features/historial/historial.page').then((m) => m.HistorialPage),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion.page').then((m) => m.ConfiguracionPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
  {
    path: 'viaje',
    canActivate: [authGuard('/auth/login')],
    children: [
      {
        path: 'solicitar',
        loadComponent: () =>
          import('./features/viaje/solicitar.page').then((m) => m.SolicitarPage),
      },
      {
        path: 'esperando/:solicitudId',
        loadComponent: () =>
          import('./features/viaje/esperando.page').then((m) => m.EsperandoPage),
      },
      {
        path: ':viajeId/seguimiento',
        loadComponent: () =>
          import('./features/viaje/seguimiento.page').then((m) => m.SeguimientoPage),
      },
      {
        path: ':viajeId/en-curso',
        loadComponent: () => import('./features/viaje/en-curso.page').then((m) => m.EnCursoPage),
      },
      {
        path: ':viajeId/finalizado',
        loadComponent: () =>
          import('./features/viaje/finalizado.page').then((m) => m.FinalizadoPage),
      },
      {
        path: ':viajeId/tarifa',
        loadComponent: () => import('./features/viaje/tarifa.page').then((m) => m.TarifaPage),
      },
      {
        path: ':viajeId/calificar',
        loadComponent: () => import('./features/viaje/calificar.page').then((m) => m.CalificarPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
