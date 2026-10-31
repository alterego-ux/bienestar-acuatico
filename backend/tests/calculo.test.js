/* =====================================================================
   Pruebas del dominio de cálculo ICA (backend) y de equivalencia con el
   frontend (js/app.js) — Node --test.
   ===================================================================== */
import { test } from "node:test";
import assert from "node:assert/strict";

import { calcular, porLibertad, elegibleParaConstancia } from "../src/domain/calculo.js";
import { clasificar } from "../src/domain/clasificacion.js";
import {
  crearContextoFrontend,
  indicadoresBackend,
  respuestasBackend,
  prng,
} from "./frontend-harness.js";

const FE = crearContextoFrontend();

function escenario(reg, score = 100) {
  const scores = {};
  for (const i of FE.listarIndicadores(reg)) scores[i.id] = score;
  return scores;
}

function calcBackend(reg, scores) {
  return calcular({
    indicadores: indicadoresBackend(FE.IND, reg),
    respuestas: respuestasBackend(scores),
    pesos: FE.PESOS_BASE[reg],
  });
}

test("catálogo: 23 indicadores PMG y 15 aplicables a AREL", () => {
  assert.equal(FE.listarIndicadores("PMG").length, 23);
  assert.equal(FE.listarIndicadores("AREL").length, 15);
});

test("pesos base suman 100% en ambas modalidades", () => {
  const suma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  assert.equal(suma(FE.PESOS_BASE.PMG), 100);
  assert.equal(suma(FE.PESOS_BASE.AREL), 100);
});

test("PMG con todos los indicadores en 100 da 100% y es final", () => {
  const c = calcBackend("PMG", escenario("PMG", 100));
  assert.equal(c.total, 100);
  assert.equal(c.isFinal, true);
  assert.equal(c.pend, 0);
  assert.equal(c.cls, "Excelente");
});

test("AREL con todos los indicadores en 100 da 100% y es final", () => {
  const c = calcBackend("AREL", escenario("AREL", 100));
  assert.equal(c.total, 100);
  assert.equal(c.isFinal, true);
});

test("PMG ponderado (MBR=100, MBA=55, MBG=0) da 54,25", () => {
  const scores = {};
  for (const i of FE.listarIndicadores("PMG")) scores[i.id] = i.t === "MBR" ? 100 : i.t === "MBA" ? 55 : 0;
  const c = calcBackend("PMG", scores);
  assert.ok(Math.abs(c.total - 54.25) < 1e-9, `esperado 54.25, recibido ${c.total}`);
});

test("AREL ponderado (MBR=100, MBA=55, MBG=0) da 62", () => {
  const scores = {};
  for (const i of FE.listarIndicadores("AREL")) scores[i.id] = i.t === "MBR" ? 100 : i.t === "MBA" ? 55 : 0;
  const c = calcBackend("AREL", scores);
  assert.ok(Math.abs(c.total - 62) < 1e-9, `esperado 62, recibido ${c.total}`);
});

test("indicador pendiente impide el resultado definitivo", () => {
  const scores = escenario("PMG", 100);
  delete scores[FE.listarIndicadores("PMG")[0].id];
  const c = calcBackend("PMG", scores);
  assert.equal(c.pend, 1);
  assert.equal(c.isFinal, false);
});

test("puntuación no permitida se trata como pendiente", () => {
  const scores = escenario("PMG", 100);
  scores[FE.listarIndicadores("PMG")[0].id] = 999;
  const c = calcBackend("PMG", scores);
  assert.equal(c.pend, 1);
  assert.equal(c.isFinal, false);
});

test("un grupo sin puntuación aplicable se detecta (N/A)", () => {
  const scores = escenario("PMG", 100);
  for (const i of FE.listarIndicadores("PMG").filter((x) => x.t === "MBR")) scores[i.id] = "NA";
  const c = calcBackend("PMG", scores);
  assert.ok(c.gruposSinDato.includes("MBR"));
  assert.equal(c.isFinal, false);
});

test("clasificación por umbrales", () => {
  assert.equal(clasificar(49.999), "Bajo");
  assert.equal(clasificar(50), "Medio");
  assert.equal(clasificar(74.999), "Medio");
  assert.equal(clasificar(75), "Alto");
  assert.equal(clasificar(89.999), "Alto");
  assert.equal(clasificar(90), "Excelente");
});

test("equivalencia backend/frontend con escenarios aleatorios (PMG y AREL)", () => {
  const azar = prng(20241017);
  const niveles = ["NA", 0, 20, 55, 100];
  for (const reg of ["PMG", "AREL"]) {
    const indicadores = FE.listarIndicadores(reg);
    for (let caso = 0; caso < 40; caso++) {
      const scores = {};
      for (const i of indicadores) {
        if (azar() < 0.12) continue; // deja alguno pendiente a propósito
        scores[i.id] = niveles[Math.floor(azar() * niveles.length)];
      }
      const cb = calcBackend(reg, scores);
      const cf = FE.frontCalc(reg, scores);
      assert.ok(Math.abs(cb.total - cf.total) < 1e-9, `${reg} caso ${caso}: backend ${cb.total} ≠ frontend ${cf.total}`);
      assert.equal(cb.pend, cf.pend, `${reg} caso ${caso}: pend`);
      assert.equal(cb.na, cf.na, `${reg} caso ${caso}: na`);
      assert.equal(cb.done, cf.done, `${reg} caso ${caso}: done`);
      assert.equal(cb.isFinal, cf.isFinal, `${reg} caso ${caso}: isFinal`);
      assert.equal(cb.cls, cf.cls, `${reg} caso ${caso}: cls`);
      // Array.from evita el desajuste de prototipos entre reinos de vm.
      assert.deepEqual([...cb.gruposSinDato], [...cf.gruposSinDato], `${reg} caso ${caso}: gruposSinDato`);
    }
  }
});

test("cumplimiento por libertad coincide con las 5 libertades", () => {
  const scores = escenario("PMG", 100);
  const c = calcBackend("PMG", scores);
  const libs = porLibertad(c);
  assert.equal(libs.length, 5);
  for (const l of libs) assert.equal(l.valor, 100, `libertad ${l.nombre} debería ser 100`);
});

test("constancia: exige finalizada, sin pendientes, ≥75% y ningún 0", () => {
  const c100 = calcBackend("PMG", escenario("PMG", 100));
  assert.equal(elegibleParaConstancia({ estado: "finalizada" }, c100).ok, true);
  assert.equal(elegibleParaConstancia({ estado: "en_proceso" }, c100).ok, false);

  const conCero = escenario("PMG", 100);
  conCero[FE.listarIndicadores("PMG")[0].id] = 0;
  const cCero = calcBackend("PMG", conCero);
  assert.equal(elegibleParaConstancia({ estado: "finalizada" }, cCero).ok, false);
});
