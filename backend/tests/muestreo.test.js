/* =====================================================================
   Pruebas de reglas de muestreo (PMG y AREL) y su equivalencia con el
   frontend (js/app.js: muestreo).
   ===================================================================== */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { muestreo, muestreoDesdeReglas, muestreoDetalle } from "../src/domain/muestreo.js";
import { RAIZ, extraerFuncion } from "./frontend-harness.js";

const ctx = vm.createContext({ console });
const app = fs.readFileSync(path.join(RAIZ, "js", "app.js"), "utf8");
vm.runInContext(extraerFuncion(app, 'function muestreo(n,reg="PMG"){'), ctx, { filename: "muestreo" });
const feMuestreo = (n, reg) => vm.runInContext(`muestreo(${JSON.stringify(n)},${JSON.stringify(reg)})`, ctx);

test("PMG: <4 lotes → todos; 4–9 → 3; >9 → 4", () => {
  assert.equal(muestreo(1), 1);
  assert.equal(muestreo(3), 3);
  assert.equal(muestreo(4), 3);
  assert.equal(muestreo(9), 3);
  assert.equal(muestreo(10), 4);
  assert.equal(muestreo(50), 4);
});

test("AREL: <4 → todos; ≥4 → sin definir (null, no se extrapola)", () => {
  assert.equal(muestreo(2, "AREL"), 2);
  assert.equal(muestreo(3, "AREL"), 3);
  assert.equal(muestreo(4, "AREL"), null);
  assert.equal(muestreo(10, "AREL"), null);
});

test("valores inválidos devuelven null", () => {
  assert.equal(muestreo(0), null);
  assert.equal(muestreo(-2), null);
  assert.equal(muestreo(NaN), null);
});

test("equivalencia con el frontend para 0..15 lotes", () => {
  for (let n = 0; n <= 15; n++) {
    for (const reg of ["PMG", "AREL"]) {
      assert.equal(muestreo(n, reg), feMuestreo(n, reg), `n=${n} reg=${reg}`);
    }
  }
});

test("muestreoDesdeReglas respeta la tabla parametrizada", () => {
  const reglas = [
    { min_lotes: 1, max_lotes: 3, lotes_a_muestrear: null },
    { min_lotes: 4, max_lotes: 9, lotes_a_muestrear: 3 },
    { min_lotes: 10, max_lotes: null, lotes_a_muestrear: 4 },
  ];
  assert.equal(muestreoDesdeReglas(2, reglas), 2);
  assert.equal(muestreoDesdeReglas(6, reglas), 3);
  assert.equal(muestreoDesdeReglas(20, reglas), 4);
});

test("muestreoDetalle: tabla ICA (<4 todos, 4–9 → 3, >9 → 4)", () => {
  const caso = (n, mod = "PMG") => muestreoDetalle(n, mod);
  assert.deepEqual([caso(1).requeridos, caso(1).todos], [1, true]);
  assert.deepEqual([caso(3).requeridos, caso(3).todos], [3, true]);
  assert.deepEqual([caso(4).requeridos, caso(4).todos], [3, false]);
  assert.equal(caso(9).requeridos, 3);
  assert.equal(caso(10).requeridos, 4);
  assert.equal(caso(25).requeridos, 4);
  assert.equal(caso(0).requeridos, null);
  assert.equal(caso(5).extrapolada, false);
});

test("muestreoDetalle AREL: <4 definido por la Tabla 30; ≥4 se marca como extrapolada", () => {
  assert.equal(muestreoDetalle(3, "AREL").extrapolada, false);
  assert.equal(muestreoDetalle(3, "AREL").requeridos, 3);
  assert.equal(muestreoDetalle(6, "AREL").requeridos, 3);
  assert.equal(muestreoDetalle(6, "AREL").extrapolada, true);
});
