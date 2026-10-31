import { Routes } from '@angular/router';
import { authGuard, publicoGuard, rolGuard } from './core/guards';

export const routes: Routes = [
  { path: '', title: 'Bienestar Acuático · Evaluación ICA', loadComponent: () => import('./pages/landing').then((m) => m.Landing) },
  { path: 'login', title: 'Ingresar · Bienestar Acuático', canActivate: [publicoGuard], loadComponent: () => import('./pages/auth').then((m) => m.Login) },
  { path: 'registro', title: 'Registro · Bienestar Acuático', canActivate: [publicoGuard], loadComponent: () => import('./pages/auth').then((m) => m.Registro) },
  {
    path: 'app', canActivate: [authGuard], loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', title: 'Inicio', loadComponent: () => import('./pages/inicio').then((m) => m.Inicio) },
      // Predios: lista → ficha del predio (con historial embebido y botón de evaluar) → edición.
      { path: 'predios', title: 'Predios', loadComponent: () => import('./pages/predios').then((m) => m.Predios) },
      { path: 'predios/nuevo', title: 'Registrar predio', canActivate: [rolGuard('admin', 'docente', 'evaluador')], loadComponent: () => import('./pages/predios').then((m) => m.PredioForm) },
      { path: 'predios/:id', title: 'Predio', loadComponent: () => import('./pages/predio-detalle').then((m) => m.PredioDetalle) },
      { path: 'predios/:id/editar', title: 'Editar predio', loadComponent: () => import('./pages/predios').then((m) => m.PredioForm) },
      { path: 'predios/:id/evaluar', title: 'Nueva evaluación', canActivate: [rolGuard('admin', 'docente', 'evaluador')], loadComponent: () => import('./pages/evaluaciones').then((m) => m.EvalWizard) },
      { path: 'evaluaciones', title: 'Evaluaciones en curso', loadComponent: () => import('./pages/evaluaciones').then((m) => m.Evaluaciones) },
      { path: 'evaluacion/:id/indicadores', title: 'Indicadores', loadComponent: () => import('./pages/indicadores').then((m) => m.IndLista) },
      { path: 'evaluacion/:id/indicador/:codigo', title: 'Indicador', loadComponent: () => import('./pages/indicadores').then((m) => m.IndDetalle) },
      { path: 'evaluacion/:id/resumen', title: 'Resumen', loadComponent: () => import('./pages/resultados').then((m) => m.Resumen) },
      { path: 'evaluacion/:id/resultados', title: 'Resultados', loadComponent: () => import('./pages/resultados').then((m) => m.Resultado) },
      { path: 'informe/:id', title: 'Informe', loadComponent: () => import('./pages/consultas').then((m) => m.Informe) },
      { path: 'tablero', title: 'Tablero', loadComponent: () => import('./pages/consultas').then((m) => m.Tablero) },
      { path: 'especies', title: 'Especies', loadComponent: () => import('./pages/consultas').then((m) => m.Especies) },
      { path: 'administracion', title: 'Administración', canActivate: [rolGuard('admin')], loadComponent: () => import('./pages/admin').then((m) => m.Admin) },
      { path: 'configuracion', title: 'Configuración', loadComponent: () => import('./pages/otras').then((m) => m.Config) },
      { path: 'conocenos', title: 'Conócenos', loadComponent: () => import('./pages/otras').then((m) => m.Conocenos) },
      { path: 'ayuda', title: 'Ayuda', loadComponent: () => import('./pages/otras').then((m) => m.Ayuda) },
      // Rutas antiguas: la evaluación ahora se inicia desde cada predio y el historial vive dentro del predio.
      { path: 'evaluacion/nueva', pathMatch: 'full', redirectTo: 'predios' },
      { path: 'historial', pathMatch: 'full', redirectTo: 'predios' },
      { path: 'resultados', pathMatch: 'full', redirectTo: 'predios' },
    ],
  },
  { path: '**', redirectTo: '' },
];
