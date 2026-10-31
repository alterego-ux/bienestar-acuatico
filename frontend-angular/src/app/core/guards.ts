import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Rol } from './models';

export const authGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.logueado() ? true : inject(Router).createUrlTree(['/login']);
};
export const publicoGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.logueado() ? inject(Router).createUrlTree(['/app/inicio']) : true;
};
export const rolGuard = (...roles: Rol[]): CanActivateFn => () => {
  const a = inject(AuthService);
  return a.rol() && roles.includes(a.rol()!) ? true : inject(Router).createUrlTree(['/app/inicio']);
};
