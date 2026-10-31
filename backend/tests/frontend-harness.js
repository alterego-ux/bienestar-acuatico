/* =====================================================================
   Arnés de pruebas: carga la lógica del frontend (js/data.js + las
   funciones puras de js/app.js y js/storage.js) dentro de un contexto vm,
   para comparar resultados con el dominio del backend.
   No instala dependencias ni requiere navegador.
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(__dirname, "..", "..");

function extraer(source, inicio, fin) {
  const start = source.indexOf(inicio);
  if (start < 0) throw new Error(`No se encontró "${inicio}"`);
  const end = fin ? source.indexOf(fin, start) : source.indexOf("\n", start);
  if (end <= start) throw new Error(`No se encontró el final de "${inicio}"`);
  return source.slice(start, end);
}

/** Extrae una función completa del frontend desde su firma hasta el `\n}`. */
export function extraerFuncion(source, firma) {
  const start = source.indexOf(firma);
  if (start < 0) throw new Error(`No se encontró "${firma}"`);
  const end = source.indexOf("\n}", start);
  if (end < 0) throw new Error(`No se encontró el cierre de "${firma}"`);
  return source.slice(start, end + 2);
}

/** Crea un contexto con IND, PESOS_BASE, indFor(), clsOf() y calc(). */
export function crearContextoFrontend() {
  const ctx = vm.createContext({ console });
  const data = fs.readFileSync(path.join(RAIZ, "js", "data.js"), "utf8");
  const app = fs.readFileSync(path.join(RAIZ, "js", "app.js"), "utf8");
  const storage = fs.readFileSync(path.join(RAIZ, "js", "storage.js"), "utf8");

  vm.runInContext(data, ctx, { filename: "js/data.js" });
  vm.runInContext(extraer(app, "const clsOf=", null), ctx, { filename: "clsOf" });
  vm.runInContext(extraer(storage, "const indFor=", null), ctx, { filename: "indFor" });
  vm.runInContext("let S={pesos:JSON.parse(JSON.stringify(PESOS_BASE))};", ctx);
  vm.runInContext(extraer(app, "function calc(e){", "function scoreText(c){"), ctx, { filename: "calc" });

  const IND = vm.runInContext("IND", ctx);
  const PESOS_BASE = vm.runInContext("PESOS_BASE", ctx);

  return {
    ctx,
    IND,
    PESOS_BASE,
    frontCalc: (reg, scores) => {
      const resp = {};
      for (const [id, s] of Object.entries(scores)) resp[id] = { score: s };
      return vm.runInContext(`calc(${JSON.stringify({ reg, resp })})`, ctx);
    },
    listarIndicadores: (reg) => (reg === "AREL" ? IND.filter((i) => i.arel) : IND),
  };
}

/** Convierte indicadores del frontend al formato que consume el backend. */
export function indicadoresBackend(IND, reg) {
  const lista = reg === "AREL" ? IND.filter((i) => i.arel) : IND;
  return lista.map((i) => ({
    id: i.id,
    codigo: i.id,
    tipo_medida: i.t,
    libertad: i.lib,
    niveles: i.lv.map((l) => ({ puntaje: l[0] })),
  }));
}

/** Convierte un mapa { id: puntaje | "NA" } al formato de respuestas del backend. */
export function respuestasBackend(scores) {
  const r = {};
  for (const [id, s] of Object.entries(scores)) {
    if (s === "NA") r[id] = { puntaje: null, no_aplica: true };
    else r[id] = { puntaje: s, no_aplica: false };
  }
  return r;
}

/** PRNG determinista (mulberry32) para escenarios reproducibles. */
export function prng(semilla) {
  let a = semilla >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default { crearContextoFrontend, extraerFuncion, indicadoresBackend, respuestasBackend, prng, RAIZ };
