/* =====================================================================
   Dominio · cálculo del puntaje ICA
   Reproduce exactamente la lógica del frontend (js/app.js: calc, libScores,
   eligible) para no alterar resultados.
   ===================================================================== */
import { clasificar } from "./clasificacion.js";

const TIPOS = ["MBR", "MBA", "MBG"];
const CLAVES_LIBERTAD = [
  ["Hambre, sed y mala nutrición", "Hambre"],
  ["Molestias físicas y térmicas", "Molestias"],
  ["Dolor, lesión y enfermedad", "Dolor"],
  ["Temor y angustia", "Temor"],
  ["Manifestar un comportamiento natural", "Comportamiento natural"],
];

/**
 * @param {Object} p
 * @param {Array}  p.indicadores [{ id, codigo, tipo_medida, libertad, niveles:[puntaje] }]
 * @param {Object} p.respuestas  { [indicadorId]: { puntaje, no_aplica, observacion } }
 * @param {Object} p.pesos       { MBR, MBA, MBG }
 * @returns detalle del cálculo
 */
export function calcular({ indicadores, respuestas = {}, pesos = { MBR: 35, MBA: 35, MBG: 30 } }) {
  const by = { MBR: { s: 0, n: 0 }, MBA: { s: 0, n: 0 }, MBG: { s: 0, n: 0 } };
  let done = 0;
  let pend = 0;
  let na = 0;
  const items = [];

  for (const ind of indicadores) {
    const r = respuestas[ind.id];
    const tipo = ind.tipo_medida;
    let estado;
    const puntajesValidos = (ind.niveles || []).map((n) => Number(n.puntaje !== undefined ? n.puntaje : n));

    if (!r || r.puntaje === undefined || r.puntaje === null) {
      if (r && r.no_aplica) {
        na++;
        estado = "na";
      } else {
        pend++;
        estado = "pe";
      }
    } else if (!puntajesValidos.includes(Number(r.puntaje))) {
      pend++;
      estado = "pe";
    } else {
      done++;
      estado = "ok";
      by[tipo].s += Number(r.puntaje);
      by[tipo].n++;
    }
    items.push({ indicador: ind, respuesta: r || null, estado });
  }

  const avg = {};
  let total = 0;
  const gruposSinDato = [];
  for (const t of TIPOS) {
    avg[t] = by[t].n ? by[t].s / by[t].n : null;
    if (avg[t] === null) gruposSinDato.push(t);
    else total += (avg[t] * Number(pesos[t] || 0)) / 100;
  }

  const isComplete = pend === 0;
  const isFinal = isComplete && gruposSinDato.length === 0;
  return {
    avg,
    by,
    done,
    pend,
    na,
    total,
    cls: isFinal ? clasificar(total) : "Incompleta",
    items,
    count: indicadores.length,
    pesos,
    isComplete,
    isFinal,
    gruposSinDato,
  };
}

/** Cumplimiento por libertad (promedio de indicadores con puntaje válido). */
export function porLibertad(calculo) {
  return CLAVES_LIBERTAD.map(([nombre, clave]) => {
    const scores = calculo.items
      .filter((x) => x.estado === "ok" && String(x.indicador.libertad || "").includes(clave))
      .map((x) => Number(x.respuesta.puntaje));
    return {
      nombre,
      clave,
      valor: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    };
  });
}

/** Criterios internos del prototipo para la constancia simulada. */
export function elegibleParaConstancia(evaluacion, calculo) {
  if (!["finalizada", "validada", "cerrada"].includes(evaluacion.estado))
    return { ok: false, why: "La evaluación aún no está finalizada." };
  if (calculo.pend)
    return { ok: false, why: "Hay indicadores pendientes o con puntuación no permitida." };
  if (calculo.gruposSinDato.length)
    return {
      ok: false,
      why: "No hay puntuaciones aplicables para calcular todos los grupos: " + calculo.gruposSinDato.join(", "),
    };
  if (!calculo.isFinal) return { ok: false, why: "El resultado global todavía no se puede calcular." };
  if (calculo.total < 75) return { ok: false, why: "El puntaje es menor a 75%." };
  if (calculo.items.some((x) => x.estado === "ok" && Number(x.respuesta.puntaje) === 0))
    return { ok: false, why: "Hay indicadores calificados con 0 puntos." };
  return { ok: true };
}

export default { calcular, porLibertad, elegibleParaConstancia };
