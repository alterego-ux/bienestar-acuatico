import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; texto: string; tipo: 'ok' | 'err' | 'info'; }
export interface Confirmacion { mensaje: string; ok: () => void; }

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmacion = signal<Confirmacion | null>(null);
  private n = 0;

  toast(texto: string, tipo: Toast['tipo'] = 'ok') {
    const id = ++this.n;
    this.toasts.update((l) => [...l, { id, texto, tipo }]);
    setTimeout(() => this.toasts.update((l) => l.filter((t) => t.id !== id)), 3200);
  }
  error(e: unknown) { this.toast(e instanceof Error ? e.message : 'Ocurrió un error', 'err'); }
  confirmar(mensaje: string, ok: () => void) { this.confirmacion.set({ mensaje, ok }); }
}
