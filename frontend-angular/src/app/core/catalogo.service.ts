import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Departamento, Especie, Indicador } from './models';

/** Catálogos de solo lectura con caché en memoria. */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private api = inject(ApiService);
  private cache = new Map<string, Promise<unknown>>();
  private memo<T>(k: string, f: () => Promise<T>): Promise<T> {
    if (!this.cache.has(k)) this.cache.set(k, f().catch((e) => { this.cache.delete(k); throw e; }));
    return this.cache.get(k) as Promise<T>;
  }
  especies() { return this.memo('esp', () => this.api.get<Especie[]>('/catalogos/especies')); }
  departamentos() { return this.memo('dep', () => this.api.get<Departamento[]>('/catalogos/departamentos')); }
  tiposProductor() { return this.memo('tp', () => this.api.get<{ id: number; nombre?: string; n?: string }[]>('/catalogos/tipos-productor')); }
  sistemas() { return this.memo('sis', () => this.api.get<{ id: number; nombre?: string; n?: string }[]>('/catalogos/sistemas')); }
  indicadores(modalidad?: string) { return this.memo('ind' + modalidad, () => this.api.get<Indicador[]>('/catalogos/indicadores', { modalidad })); }
  libertades() { return this.memo('lib', () => this.api.get<{ id: number; nombre: string; descripcion: string }[]>('/catalogos/libertades')); }
}
