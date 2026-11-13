/* Reglas de negocio del proyecto nuevo: escala 0/20/55/100 y recomendaciones solo con 0 puntos. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { generarRecomendaciones } from "../src/domain/recomendaciones.js";
import { calcular } from "../src/domain/calculo.js";

const cat = JSON.parse(fs.readFileSync(new URL("../data/catalogo-ica.json", import.meta.url), "utf8"));

test("todos los niveles del catálogo usan estrictamente 0, 20, 55 o 100", () => {
  for (const i of cat.indicadores) for (const n of i.niveles) assert.ok([0, 20, 55, 100].includes(n.puntaje), `${i.codigo}: ${n.puntaje}`);
});

test("las recomendaciones se generan únicamente para criterios con 0 puntos", () => {
  const indicadores = [100, 55, 20, 0, 0].map((_, k) => ({
    id: k + 1, codigo: "X" + k, nombre: "Criterio " + k, tipo_medida: "MBR", libertad: "", recomendacion: "Mejorar " + k,
    niveles: [{ puntaje: 100 }, { puntaje: 55 }, { puntaje: 20 }, { puntaje: 0 }],
  }));
  const respuestas = Object.fromEntries([100, 55, 20, 0, 0].map((p, k) => [k + 1, { puntaje: p }]));
  const recs = generarRecomendaciones(calcular({ indicadores, respuestas }));
  assert.deepEqual(recs.map((r) => r.indicador.codigo).sort(), ["X3", "X4"]);
  assert.ok(recs.every((r) => r.puntaje_ref === 0));
});
