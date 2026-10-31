import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Rol, Sesion, Usuario } from './models';

const K_TOKEN = 'bienestar_ng_token';
const K_USER = 'bienestar_ng_usuario';

/**
 * Autenticación del prototipo.
 * La sesión vive en sessionStorage para que no se restaure indefinidamente
 * cuando una persona vuelve al sitio en una visita posterior.
 * Las claves de localStorage de versiones anteriores se limpian una sola vez
 * al leer la sesión, sin tocar tema, predios, evaluaciones ni otros datos.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly token = signal<string | null>(this.leer(K_TOKEN));
  readonly usuario = signal<Usuario | null>(this.leerJson<Usuario>(K_USER));
  readonly logueado = computed(() => !!this.token() && !!this.usuario());
  readonly rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);
  readonly puedeEscribir = computed(() => this.rol() !== null && this.rol() !== 'consultor');
  readonly esAdmin = computed(() => this.rol() === 'admin');
  readonly puedeValidar = computed(() => this.rol() === 'admin' || this.rol() === 'docente');

  async login(email: string, password: string) {
    const s = await this.api.post<Sesion>('/auth/login', { email, password });
    this.guardar(s);
  }

  async registrar(nombre: string, email: string, password: string, rol: Rol) {
    const s = await this.api.post<Sesion>('/auth/registro', { nombre, email, password, rol });
    if (s?.token) this.guardar(s);
  }

  async cambiarClave(actual: string, nueva: string) {
    await this.api.post('/auth/cambiar-clave', { actual, nueva });
  }

  logout() {
    this.token.set(null);
    this.usuario.set(null);
    try {
      sessionStorage.removeItem(K_TOKEN);
      sessionStorage.removeItem(K_USER);
      // Elimina exclusivamente las claves de autenticación antiguas.
      localStorage.removeItem(K_TOKEN);
      localStorage.removeItem(K_USER);
    } catch { /* el navegador puede bloquear el almacenamiento */ }
    // replaceUrl evita que “Atrás” vuelva a presentar la pantalla protegida.
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }

  private guardar(s: Sesion) {
    this.token.set(s.token);
    this.usuario.set(s.usuario);
    try {
      sessionStorage.setItem(K_TOKEN, s.token);
      sessionStorage.setItem(K_USER, JSON.stringify(s.usuario));
      localStorage.removeItem(K_TOKEN);
      localStorage.removeItem(K_USER);
    } catch { /* la sesión sigue activa en memoria si el navegador lo impide */ }
  }

  private limpiarCredencialesAntiguas() {
    try {
      localStorage.removeItem(K_TOKEN);
      localStorage.removeItem(K_USER);
    } catch { /* almacenamiento no disponible */ }
  }

  private leer(k: string): string | null {
    this.limpiarCredencialesAntiguas();
    try { return sessionStorage.getItem(k); } catch { return null; }
  }

  private leerJson<T>(k: string): T | null {
    this.limpiarCredencialesAntiguas();
    try { return JSON.parse(sessionStorage.getItem(k) || 'null') as T | null; }
    catch { return null; }
  }
}
