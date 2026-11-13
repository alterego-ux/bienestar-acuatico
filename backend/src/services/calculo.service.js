/* =====================================================================
   Servicio de cálculo · combina repositorio + dominio
   ===================================================================== */
import cat from "../repositories/indicador.repo.js";
import evaluacionRepo from "../repositories/evaluacion.repo.js";
import { calcular, porLibertad, elegibleParaConstancia } from "../domain/calculo.js";
import { query } from "../config/db.js";

async function pesosDe(modalidadCodigo) {
  const { rows } = await query(
    `SELECT tm.codigo AS tipo, po.peso_pct AS peso
       FROM ponderacion po
       JOIN modalidad m ON m.id = po.modalidad_id
       JOIN tipo_medida tm ON tm.id = po.tipo_medida_id
      WHERE m.codigo = $1`,
    [modalidadCodigo]
  );
  const pesos = { MBR: 0, MBA: 0, MBG: 0 };
  for (const r of rows) pesos[r.tipo] = Number(r.peso);
  return pesos;
}

/** Calcula el detalle de una evaluación ya cargada (con .resp). */
export async function calcularEvaluacion(evaluacion) {
  const indicadores = await cat.indicadoresCalculo({ modalidad: evaluacion.reg });
  const pesos = await pesosDe(evaluacion.reg);
  const respuestas = {};
  for (const ind of indicadores) {
    const r = evaluacion.resp[ind.codigo];
    if (r) respuestas[ind.id] = { puntaje: r.no_aplica ? null : r.puntaje, no_aplica: !!r.no_aplica, observacion: r.obs };
  }
  const calc = calcular({ indicadores, respuestas, pesos });
  const libertades = porLibertad(calc);
  return {
    ...calc,
    libertades,
    elegible: elegibleParaConstancia({ estado: evaluacion.est }, calc),
  };
}

export async function calcularPorId(evalId) {
  const e = await evaluacionRepo.porId(evalId);
  if (!e) return null;
  return { evaluacion: e, calculo: await calcularEvaluacion(e) };
}

/** Texto de puntaje compatible con el frontend. */
export function puntajeTexto(c) {
  if (c.isFinal) return `${Math.round(c.total)}%`;
  if (c.pend) return `Parcial · ${c.done + c.na}/${c.count}`;
  return "No calculable";
}

export { pesosDe };

export default { calcularEvaluacion, calcularPorId, puntajeTexto, pesosDe };
