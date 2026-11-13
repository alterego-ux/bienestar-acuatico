import { Injectable, signal } from '@angular/core';

export type Tema = 'light' | 'dark';
const K = 'bienestar_tema';

/** Tema claro/oscuro: respeta la preferencia guardada y, si no hay, la del sistema. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.inicial());
  constructor() { this.aplicar(this.tema()); }

  alternar() {
    const t: Tema = this.tema() === 'dark' ? 'light' : 'dark';
    this.tema.set(t); this.aplicar(t);
    try { localStorage.setItem(K, t); } catch { /* sin storage */ }
  }
  private inicial(): Tema {
    try { const g = localStorage.getItem(K); if (g === 'light' || g === 'dark') return g; } catch { /* sin storage */ }
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  private aplicar(t: Tema) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#071923' : '#f2f7f6');
  }
}
