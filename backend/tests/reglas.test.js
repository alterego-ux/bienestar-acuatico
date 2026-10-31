/* =====================================================================
   Pruebas de reglas de referencia y calculadoras de indicadores.
   Equivalencia con js/app.js (depthRange, applyCalc).
   ===================================================================== */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { depthRange, umbralesMortalidad, aplicarCalculadora } from "../src/domain/reglas.js";
import { RAIZ, extraerFuncion } from "./frontend-harness.js";

const ctx = vm.createContext({ console });
const app = fs.readFileSync(path.join(RAIZ, "js", "app.js"), "utf8");
vm.runInContext(extraerFuncion(app, "function depthRange(reg,isJaula){"), ctx, { filename: "depthRange" });
const feDepth = (reg, jaula) => vm.runInContext(`depthRange(${JSON.stringify(reg)},${!!jaula})`, ctx);

test("depthRange: PMG jaula 2–5 m; resto 0,6–1,5 m; AREL siempre 0,6–1,5", () => {
  assert.deepEqual(depthRange("PMG", true), [2, 5]);
  assert.deepEqual(depthRange("PMG", false), [0.6, 1.5]);
  assert.deepEqual(depthRange("AREL", true), [0.6, 1.5]);
  assert.deepEqual(depthRange("AREL", false), [0.6, 1.5]);
});

test("equivalencia depthRange con el frontend", () => {
  for (const reg of ["PMG", "AREL"]) {
    for (const jaula of [true, false]) {
      assert.deepEqual(depthRange(reg, jaula), Array.from(feDepth(reg, jaula)), `${reg}/${jaula}`);
    }
  }
});

test("umbrales de mortalidad: cachama 1/2/3, otras 10/12/15", () => {
  assert.deepEqual(umbralesMortalidad("cachama"), [1, 2, 3]);
  assert.deepEqual(umbralesMortalidad("tilapia"), [10, 12, 15]);
  assert.deepEqual(umbralesMortalidad("trucha"), [10, 12, 15]);
});

test("calculadora de dietas", () => {
  assert.equal(aplicarCalculadora("dietas", { d_dias: 20 }).puntaje, 100);
  assert.equal(aplicarCalculadora("dietas", { d_dias: 30 }).puntaje, 55);
  assert.equal(aplicarCalculadora("dietas", { d_dias: 45 }).puntaje, 55);
  assert.equal(aplicarCalculadora("dietas", { d_dias: 60 }).puntaje, 20);
  assert.equal(aplicarCalculadora("dietas", { d_sin: true }).puntaje, 0);
});

test("calculadora de profundidad (contexto de modalidad)", () => {
  assert.equal(aplicarCalculadora("profundidad", { p_prof: 3, p_jaula: true }, { modalidad: "PMG" }).puntaje, 100);
  assert.equal(aplicarCalculadora("profundidad", { p_prof: 3, p_jaula: true }, { modalidad: "AREL" }).puntaje, 0);
  assert.equal(aplicarCalculadora("profundidad", { p_prof: 1, p_med: false }, { modalidad: "PMG" }).puntaje, 100);
  assert.equal(aplicarCalculadora("profundidad", { p_prof: 3, p_med: true }, { modalidad: "PMG" }).puntaje, 55);
  assert.equal(aplicarCalculadora("profundidad", { p_prof: 3, p_med: false }, { modalidad: "PMG" }).puntaje, 0);
});

test("calculadora de tamaño", () => {
  assert.equal(aplicarCalculadora("tamano", { t_tot: 100, t_prom: 95 }).puntaje, 100);
  assert.equal(aplicarCalculadora("tamano", { t_tot: 100, t_prom: 85 }).puntaje, 55);
  assert.equal(aplicarCalculadora("tamano", { t_tot: 100, t_prom: 75 }).puntaje, 20);
  assert.equal(aplicarCalculadora("tamano", { t_tot: 100, t_prom: 50 }).puntaje, 0);
  assert.equal(aplicarCalculadora("tamano", { t_tot: 0, t_prom: 0 }), null);
});

test("calculadora de lesiones", () => {
  assert.equal(aplicarCalculadora("lesiones", { l_tot: 100, l_dan: 4 }).puntaje, 100);
  assert.equal(aplicarCalculadora("lesiones", { l_tot: 100, l_dan: 10 }).puntaje, 55);
  assert.equal(aplicarCalculadora("lesiones", { l_tot: 100, l_dan: 20 }).puntaje, 20);
  assert.equal(aplicarCalculadora("lesiones", { l_tot: 100, l_dan: 30 }).puntaje, 0);
});

test("calculadora de mortalidad según especie", () => {
  assert.equal(aplicarCalculadora("mortalidad", { m_mue: 1, m_pob: 100 }, { codigoEspecie: "cachama" }).puntaje, 100);
  assert.equal(aplicarCalculadora("mortalidad", { m_mue: 2, m_pob: 100 }, { codigoEspecie: "cachama" }).puntaje, 55);
  assert.equal(aplicarCalculadora("mortalidad", { m_mue: 3, m_pob: 100 }, { codigoEspecie: "cachama" }).puntaje, 20);
  assert.equal(aplicarCalculadora("mortalidad", { m_mue: 4, m_pob: 100 }, { codigoEspecie: "cachama" }).puntaje, 0);
  assert.equal(aplicarCalculadora("mortalidad", { m_mue: 10, m_pob: 100 }, { codigoEspecie: "tilapia" }).puntaje, 100);
  assert.equal(aplicarCalculadora("mortalidad", { m_sin: true }, {}).puntaje, 0);
});

test("calculadora de capacitación", () => {
  assert.equal(aplicarCalculadora("capacitacion", { k_tot: 4, k_con: 4, k_cer: 4 }).puntaje, 100);
  assert.equal(aplicarCalculadora("capacitacion", { k_tot: 4, k_con: 4, k_cer: 1 }).puntaje, 55);
  assert.equal(aplicarCalculadora("capacitacion", { k_tot: 4, k_con: 3, k_cer: 3 }).puntaje, 55);
  assert.equal(aplicarCalculadora("capacitacion", { k_tot: 4, k_con: 3, k_cer: 0 }).puntaje, 20);
  assert.equal(aplicarCalculadora("capacitacion", { k_tot: 4, k_con: 1, k_cer: 0 }).puntaje, 0);
});

test("calculadora desconocida devuelve null", () => {
  assert.equal(aplicarCalculadora("inexistente", {}), null);
});
