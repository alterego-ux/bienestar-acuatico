import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Agrega el token Bearer y cierra sesión si el servidor responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const t = auth.token();
  const r = t && req.url.startsWith('/api') ? req.clone({ setHeaders: { Authorization: 'Bearer ' + t } }) : req;
  return next(r).pipe(
    catchError((e) => {
      if (e.status === 401 && !req.url.includes('/auth/login') && auth.logueado()) auth.logout();
      return throwError(() => e);
    })
  );
};
