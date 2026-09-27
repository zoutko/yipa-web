import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from '@yipa/shared';

/**
 * Mapa de rutas · YIPA Conductor
 *
 *  /                          Splash
 *  /auth/login                Login
 *  /auth/registro             Registro (conductor + vehículo)
 *  /app/dashboard             Dashboard          (HU-02, métricas)
 *  /app/disponibilidad        Disponibilidad     (HU-02)
 *  /app/solicitudes           Solicitudes entrantes (HU-03, HU-04)
 *  /app/historial             Historial          (HU-09)
 *  /app/perfil                Perfil
 *  /solicitudes/:id           Detalle de solicitud (HU-04)
 *  /viaje/:id/asignado        Viaje asignado     (HU-05, HU-06)
 *  /viaje/:id/navegacion      Navegación         (HU-05, HU-06)
 *  /viaje/:id/finalizado      Viaje finalizado   (HU-07)
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'auth',
    canActivate: [invitadoGuard('/app/dashboard')],
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
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'disponibilidad',
        loadComponent: () =>
          import('./features/disponibilidad/disponibilidad.page').then(
            (m) => m.DisponibilidadPage,
          ),
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/solicitudes/solicitudes.page').then((m) => m.SolicitudesPage),
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
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'solicitudes/:solicitudId',
    canActivate: [authGuard('/auth/login')],
    loadComponent: () =>
      import('./features/solicitudes/detalle.page').then((m) => m.DetalleSolicitudPage),
  },
  {
    path: 'viaje',
    canActivate: [authGuard('/auth/login')],
    children: [
      {
        path: ':viajeId/asignado',
        loadComponent: () => import('./features/viaje/asignado.page').then((m) => m.AsignadoPage),
      },
      {
        path: ':viajeId/navegacion',
        loadComponent: () =>
          import('./features/viaje/navegacion.page').then((m) => m.NavegacionPage),
      },
      {
        path: ':viajeId/finalizado',
        loadComponent: () =>
          import('./features/viaje/finalizado.page').then((m) => m.FinalizadoPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
