/* =====================================================================
   Servicio · evaluaciones (creación, diligenciamiento, cierre)
   ===================================================================== */
import evaluacionRepo from "../repositories/evaluacion.repo.js";
import cat from "../repositories/indicador.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { calcularEvaluacion } from "./calculo.service.js";
import { clasificar } from "../domain/clasificacion.js";
import { noEncontrado, validacion, conflicto } from "../utils/errores.js";
import { query } from "../config/db.js";
import predioService from "./predio.service.js";
import recomendacionService from "./recomendacion.service.js";

async function idModalidad(codigo) {
  const { rows } = await query("SELECT id FROM modalidad WHERE codigo = $1", [codigo]);
  return rows[0] ? rows[0].id : null;
}
async function idEspecie(nombreOCodigo) {
  if (!nombreOCodigo) return null;
  const { rows } = await query(
    "SELECT id FROM especie WHERE lower(codigo) = lower($1) OR lower(nombre_comun) = lower($1)",
    [nombreOCodigo]
  );
  return rows[0] ? rows[0].id : null;
}
export async function listar(filtros = {}) {
  return evaluacionRepo.listar(filtros);
}

export async function porId(id) {
  const e = await evaluacionRepo.porId(id);
  if (!e) throw noEncontrado("Evaluación");
  return e;
}

export async function porIdConCalculo(id) {
  const e = await porId(id);
  return { evaluacion: e, calculo: await calcularEvaluacion(e) };
}

/** Respuestas crudas de una evaluación (sin calcular). */
export async function respuestas(id) {
  await porId(id); // valida existencia
  return evaluacionRepo.respuestasDe(id);
}

export async function crear(payload, usuario) {
  const predioId = payload.predioId || payload.pid;
  if (!predioId) throw validacion("Selecciona un predio.");
  if (!payload.fecha) throw validacion("Indica la fecha.");

  // 1) El predio y su inventario (los lotes se definieron al registrar el predio).
  const predio = await predioService.porId(predioId);
  if (!predio.act) throw validacion("El predio está inactivo; actívalo para evaluarlo.");

  // 2) Especie: cada especie del predio se evalúa por separado.
  const especieId = payload.especieId || (await idEspecie(payload.esp || (payload.peces && payload.peces.esp)));
  if (!especieId) throw validacion("Selecciona la especie que vas a evaluar.");
  await predioService.planMuestreo(predioId, especieId); // valida que la especie esté en el predio

  // 3) Modalidad: se deriva del tipo de productor del predio (PMG o AREL).
  const codigoModalidad = predio.modalidad || payload.reg;
  if (!codigoModalidad) throw validacion("No se pudo determinar la modalidad (PMG/AREL) del predio.");
  const modalidadId = await idModalidad(codigoModalidad);
  if (!modalidadId) throw validacion("Modalidad no válida.");
  const planFinal = await predioService.planMuestreo(predioId, especieId, codigoModalidad);

  // 4) Muestreo dinámico: <4 lotes → todos · 4–9 → 3 · >9 → 4.
  const requeridos = planFinal.requeridos;
  const sel = Array.isArray(payload.sel) ? [...new Set(payload.sel)] : [];
  const validos = new Set(planFinal.nombresLotes);
  if (sel.some((n) => !validos.has(n))) throw validacion("Hay lotes seleccionados que no existen en el predio.");
  if (sel.length !== requeridos)
    throw validacion(`Según la tabla del ICA debes evaluar ${requeridos} de ${planFinal.lotes} lote(s); seleccionaste ${sel.length}.`);

  // 5) Auditoría: el evaluador SIEMPRE es la persona con sesión iniciada (no un rol genérico
  //    ni quien registró el predio). Se ignora cualquier `ev` enviado por el cliente.
  const id = await evaluacionRepo.crear({
    predioId,
    evaluadorId: usuario.id,
    modalidadId,
    especieId,
    fecha: payload.fecha,
    evaluadorNombre: usuario.nombre,
    lotes: planFinal.lotes,
    estado: "en_proceso",
    sel,
    peces: payload.peces || null,
  });
  await auditoriaRepo.registrar({
    usuarioId: usuario.id,
    accion: `Evaluación creada (${predio.n} · ${planFinal.especie}) por ${usuario.nombre}`,
    entidad: "evaluacion",
    entidadId: id,
  });
  return porId(id);
}

export async function actualizar(id, payload, usuario) {
  const e = await porId(id);
  const campos = {};
  if (payload.fecha) campos.fecha = payload.fecha;
  if (payload.lotes !== undefined) campos.lotes = Number(payload.lotes) || 0;
  if (payload.estado) campos.estado = payload.estado;
  if (payload.etapa) campos.etapa = payload.etapa;
  if (payload.reg) campos.modalidadId = await idModalidad(payload.reg);
  await evaluacionRepo.actualizarCabecera(id, campos);
  if (Array.isArray(payload.sel)) await evaluacionRepo.reemplazarLotes(id, payload.sel);
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Evaluación editada: ${e.predio_nombre}`, entidad: "evaluacion", entidadId: id });
  return porId(id);
}

export async function eliminar(id, usuario) {
  const e = await porId(id);
  await evaluacionRepo.eliminar(id);
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Evaluación eliminada: ${e.predio_nombre}`, entidad: "evaluacion", entidadId: id });
  return { ok: true };
}

export async function guardarRespuesta(evalId, indicadorCodigo, datos, usuario) {
  const e = await porId(evalId);
  if (["validada", "cerrada"].includes(e.est))
    throw conflicto("La evaluación está validada o cerrada; no admite cambios.");
  const lista = await cat.indicadores({ modalidad: e.reg });
  const ind = lista.find((i) => i.codigo === indicadorCodigo);
  if (!ind) throw noEncontrado(`Indicador ${indicadorCodigo}`);

  const score = datos.score;
  const noAplica = datos.no_aplica === true || score === "NA";
  let puntaje = null;
  if (!noAplica) {
    if (score === undefined || score === null || score === "") throw validacion("Selecciona un resultado.");
    puntaje = Number(score);
    const validos = (ind.niveles || []).map((nv) => Number(nv.puntaje));
    if (!validos.includes(puntaje)) throw validacion("Puntaje no permitido para este indicador.");
  }

  await evaluacionRepo.upsertRespuesta(evalId, ind.id, {
    puntaje,
    noAplica,
    observacion: datos.obs || "",
    calc: datos.calc || null,
  });
  if (e.est === "borrador" || e.est === "en_proceso") {
    await evaluacionRepo.actualizarCabecera(evalId, { estado: "en_proceso" });
  }
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Indicador ${indicadorCodigo} guardado`, entidad: "respuesta", entidadId: evalId });
  return porId(evalId);
}

export async function finalizar(id, usuario, { reabrir = false } = {}) {
  const e = await porId(id);
  if (reabrir) {
    if (["validada", "cerrada"].includes(e.est)) throw conflicto("No se puede reabrir una evaluación validada o cerrada.");
    await evaluacionRepo.actualizarCabecera(id, { estado: "en_proceso" });
    await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Evaluación reabierta: ${e.predio_nombre}`, entidad: "evaluacion", entidadId: id });
    return porId(id);
  }
  const calc = await calcularEvaluacion(e);
  if (calc.pend) throw validacion("No se puede finalizar: hay indicadores pendientes o con puntuación inválida.");
  if (calc.gruposSinDato.length)
    throw validacion("No se puede finalizar: falta puntuación válida en " + calc.gruposSinDato.join(", ") + ".");
  await evaluacionRepo.actualizarCabecera(id, {
    estado: "finalizada",
    puntaje: Number(calc.total.toFixed(2)),
    clasificacion: clasificar(calc.total),
    cerrado: true,
  });
  // Retroalimentación automática: recomendaciones únicamente de los criterios con 0 puntos.
  await recomendacionService.generar(id, usuario);
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Evaluación finalizada: ${e.predio_nombre} (${e.esp}) por ${usuario.nombre}`, entidad: "evaluacion", entidadId: id });
  return { evaluacion: await porId(id), calculo: calc };
}

export async function cambiarEstado(id, nuevoEstado, usuario) {
  const permitidos = ["borrador", "en_proceso", "finalizada", "validada", "cerrada"];
  if (!permitidos.includes(nuevoEstado)) throw validacion("Estado no válido.");
  const e = await porId(id);
  const campos = { estado: nuevoEstado };
  if (["finalizada", "validada", "cerrada"].includes(nuevoEstado)) {
    const calc = await calcularEvaluacion(e);
    if (calc.isFinal) {
      campos.puntaje = Number(calc.total.toFixed(2));
      campos.clasificacion = clasificar(calc.total);
    }
  }
  await evaluacionRepo.actualizarCabecera(id, campos);
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Estado → ${nuevoEstado}: ${e.predio_nombre}`, entidad: "evaluacion", entidadId: id });
  return porId(id);
}

/** Recalcula y almacena el puntaje global (sin cambiar de estado). */
export async function recalcular(id, usuario) {
  const e = await porId(id);
  const calc = await calcularEvaluacion(e);
  if (calc.isFinal) {
    await evaluacionRepo.actualizarCabecera(id, {
      puntaje: Number(calc.total.toFixed(2)),
      clasificacion: clasificar(calc.total),
    });
  }
  void usuario;
  return calc;
}

export default {
  listar, porId, porIdConCalculo, respuestas, crear, actualizar, eliminar, guardarRespuesta,
  finalizar, cambiarEstado, recalcular,
};
