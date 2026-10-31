/* =====================================================================
   Servicio · recomendaciones y plan de mejora
   ===================================================================== */
import evaluacionRepo from "../repositories/evaluacion.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import cat from "../repositories/indicador.repo.js";
import { calcularEvaluacion } from "./calculo.service.js";
import { generarRecomendaciones, planDesdeRecomendaciones } from "../domain/recomendaciones.js";
import { noEncontrado, validacion } from "../utils/errores.js";

export async function generar(evalId, usuario) {
  const e = await evaluacionRepo.porId(evalId);
  if (!e) throw noEncontrado("Evaluación");
  const calc = await calcularEvaluacion(e);

  const indicadores = await cat.indicadores({ modalidad: e.reg });
  const porCodigo = new Map(indicadores.map((i) => [i.codigo, i]));
  const recs = generarRecomendaciones(calc, { especie: e.esp || "", sistemas: [] }).map((r) => ({
    ...r,
    indicador_id: porCodigo.get(r.indicador.codigo)?.id || null,
  }));

  await evaluacionRepo.reemplazarRecomendaciones(
    evalId,
    recs.map((r) => ({
      indicador_id: r.indicador_id,
      titulo: r.titulo,
      texto: r.texto,
      puntaje_ref: r.puntaje_ref,
      orden: r.orden,
    }))
  );
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Recomendaciones generadas: ${e.predio_nombre}`, entidad: "evaluacion", entidadId: evalId });
  return evaluacionRepo.porId(evalId);
}

export async function listar(evalId) {
  const e = await evaluacionRepo.porId(evalId);
  if (!e) throw noEncontrado("Evaluación");
  return e.recs;
}

export async function plan(evalId) {
  const e = await evaluacionRepo.porId(evalId);
  if (!e) throw noEncontrado("Evaluación");
  return e.plan;
}

export async function generarPlan(evalId, usuario) {
  let e = await evaluacionRepo.porId(evalId);
  if (!e) throw noEncontrado("Evaluación");
  if (!e.recs.length) e = await generar(evalId, usuario); // se generan al vuelo (solo criterios con 0 puntos)
  if (!e.recs.length) throw validacion("No hay criterios con 0 puntos: no se requiere plan de mejora.");
  const plan = planDesdeRecomendaciones(e.recs, "");
  await evaluacionRepo.reemplazarPlan(evalId, plan);
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Plan de mejora creado: ${e.predio_nombre}`, entidad: "evaluacion", entidadId: evalId });
  return evaluacionRepo.porId(evalId);
}

export async function actualizarItem(evalId, itemId, cambios) {
  const ok = await evaluacionRepo.marcarItemPlan(evalId, itemId, cambios);
  if (!ok) throw noEncontrado("Acción del plan");
  return (await evaluacionRepo.porId(evalId)).plan;
}

export default { generar, listar, plan, generarPlan, actualizarItem };
