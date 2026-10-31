export type Rol = 'admin' | 'docente' | 'evaluador' | 'consultor';
export type Estado = 'borrador' | 'en_proceso' | 'finalizada' | 'validada' | 'cerrada';
export type TipoMedida = 'MBR' | 'MBA' | 'MBG';

export interface Usuario { id: number; nombre: string; email: string; rol: Rol; rolNombre?: string; activo: boolean; creado_en?: string; rol_nombre?: string; }
export interface Sesion { token: string; usuario: Usuario; }

export interface InventarioItem { id?: number; espId?: number; espCodigo?: string; esp: string; cant: number | string; peso: number | string; lotes: number | string; }
export interface Predio {
  id: number; cod: string; n: string; resp: string; mail: string; telefono?: string | null; ver?: string; dir?: string;
  lat?: string | null; lng?: string | null; act: boolean; tipo?: string; tipo_id?: number; modalidad?: 'PMG' | 'AREL' | null;
  dep?: string; dep_id?: number; mun?: string; mun_id?: number; sis: string[]; inv: InventarioItem[];
}
export interface Especie { id: number; codigo: string; n: string; nombre_cientifico?: string; tipo_agua?: string; temp_min: string; temp_max: string; od_min: string; ph_min: string; turb?: string; mort?: string; act: boolean; }
export interface Departamento { id: number; nombre: string; municipios: string[]; }
export interface Nivel { puntaje: number; descripcion: string; }
export interface Indicador { id: number; codigo: string; n: string; lib: string; q: string; met: string; na: string; rec: string; t: TipoMedida; niveles: Nivel[]; arel: boolean; aplica_pmg: boolean; }
export interface Respuesta { id: number; indicador_id: number; score: number | string | null; puntaje: number | null; no_aplica: boolean; obs: string; calc: Record<string, unknown>; evid: unknown[]; }
export interface Rec { id: string; n: string; t: string; sc: number; }
export interface PlanItem { id: number; a: string; r: string; p: 'Alta' | 'Media' | 'Baja'; d: string | null; completado: boolean; }
export interface Evaluacion {
  id: number; predio_id: number; fecha: string; ev: string; lotes: number; est: Estado; reg: 'PMG' | 'AREL';
  predio_nombre: string; predio_codigo: string; predio_responsable?: string; esp: string | null; evaluador: string; sel: string[];
  puntaje_global: number | null; clasificacion: string | null; cr: string; up: string;
  resp?: Record<string, Respuesta>; recs?: Rec[]; plan?: PlanItem[]; peces?: unknown;
}
export interface ItemCalculo {
  indicador: { id: number; codigo: string; tipo_medida: TipoMedida; libertad: string; nombre: string; recomendacion: string; niveles: Nivel[] };
  respuesta: { puntaje: number | null; no_aplica: boolean; observacion: string };
  estado: 'ok' | 'pe' | 'na';
}
export interface Calculo {
  avg: Record<TipoMedida, number | null>; by: Record<string, { s: number; n: number }>;
  done: number; pend: number; na: number; total: number; cls: string; count: number;
  pesos: Record<TipoMedida, number>; isComplete: boolean; isFinal: boolean; gruposSinDato: string[]; items: ItemCalculo[];
}
export interface RecomendacionInforme { codigo: string; nombre: string; puntaje: number; texto: string; }
export interface EvaluacionDetalle { evaluacion: Evaluacion; calculo: Calculo; }
export interface Resumen {
  totales: { evaluaciones: number; completadas: number; predios: number; promedio: number | null; altoExcelente: number; criticos: number };
  porMedida: Record<TipoMedida, number | null>; distribucion: Record<string, number>;
  serie: { id: number; fecha: string; predio: string; puntaje: number; clasificacion: string }[];
  hallazgos: { codigo: string; nombre: string; n: number; promedio: number; bajos: number }[];
}
export interface Auditoria { id: number; accion: string; entidad: string; entidad_id: number | null; fecha_hora: string; usuario: string; }

export const ESTADOS: Record<string, string> = { borrador: 'Borrador', en_proceso: 'En proceso', finalizada: 'Finalizada', validada: 'Validada', cerrada: 'Cerrada' };
export const MEDIDAS: Record<TipoMedida, { n: string; full: string; c: string }> = {
  MBR: { n: 'Recursos', full: 'Medidas basadas en los recursos', c: '#2a6f97' },
  MBA: { n: 'Animal', full: 'Medidas basadas en el animal', c: '#2e7d5b' },
  MBG: { n: 'Gestión', full: 'Medidas basadas en la gestión', c: '#6b5b95' },
};
export const COLOR_CLS: Record<string, string> = { Excelente: '#2e7d5b', Alto: '#2a6f97', Medio: '#b7791f', Bajo: '#b03a3a', Incompleta: '#7b8794' };

/** Plan de muestreo que calcula el servidor según la tabla del ICA (<4 → todos · 4–9 → 3 · >9 → 4). */
export interface PlanMuestreo {
  predioId: number; especieId: number; especie: string; modalidad: 'PMG' | 'AREL' | null; pesoPromedio: number;
  lotes: number; requeridos: number | null; todos: boolean; regla: string; extrapolada: boolean; nombresLotes: string[];
}
