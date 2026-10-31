import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export const API_URL = '/api';

export class ErrorApi extends Error {
  constructor(public codigo: string, mensaje: string, public estado = 0, public detalles?: unknown) { super(mensaje); }
}

/** Cliente HTTP: desenvuelve `{ datos }` y normaliza los errores del backend. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private async run<T>(obs: ReturnType<HttpClient['get']>): Promise<T> {
    try {
      const r = (await firstValueFrom(obs)) as { datos?: T } | null;
      return (r && 'datos' in r ? r.datos : r) as T;
    } catch (e) {
      const h = e as HttpErrorResponse;
      const err = (h.error && h.error.error) || {};
      if (h.status === 0) throw new ErrorApi('RED', 'No se pudo contactar el servidor. ¿Está encendido el backend (npm start)?', 0);
      throw new ErrorApi(err.codigo || 'HTTP_' + h.status, err.mensaje || 'Error ' + h.status, h.status, err.detalles);
    }
  }
  get<T>(ruta: string, query?: Record<string, string | number | undefined | null>) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    return this.run<T>(this.http.get(API_URL + ruta, { params }));
  }
  async blob(ruta: string): Promise<Blob> {
    try {
      return await firstValueFrom(this.http.get(API_URL + ruta, { responseType: 'blob' }));
    } catch (e) {
      const h = e as HttpErrorResponse;
      type ErrorPayload = { codigo?: string; mensaje?: string; detalles?: unknown };
      let err: ErrorPayload = {};
      if (h.error instanceof Blob) {
        try { err = (JSON.parse(await h.error.text()) as { error?: ErrorPayload }).error || {}; } catch { /* respuesta no JSON */ }
      } else if (h.error?.error) err = h.error.error as ErrorPayload;
      if (!h.status) throw new ErrorApi('RED', 'No se pudo contactar el servidor para descargar la evidencia.', 0);
      throw new ErrorApi(err.codigo || 'HTTP_' + h.status, err.mensaje || 'No se pudo cargar el archivo de evidencia.', h.status, err.detalles);
    }
  }
  post<T>(ruta: string, cuerpo: unknown = {}) { return this.run<T>(this.http.post(API_URL + ruta, cuerpo)); }
  put<T>(ruta: string, cuerpo: unknown) { return this.run<T>(this.http.put(API_URL + ruta, cuerpo)); }
  patch<T>(ruta: string, cuerpo: unknown = {}) { return this.run<T>(this.http.patch(API_URL + ruta, cuerpo)); }
  delete<T>(ruta: string) { return this.run<T>(this.http.delete(API_URL + ruta)); }
}
