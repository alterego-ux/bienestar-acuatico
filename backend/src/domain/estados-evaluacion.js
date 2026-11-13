import { conflicto, prohibido, validacion } from "../utils/errores.js";

const ROLES_EVALUADORES = ["admin", "docente", "evaluador"];
const ROLES_VALIDADORES = ["admin", "docente"];

function exigirRol(usuario, roles) {
  if (!roles.includes(usuario?.rol)) throw prohibido();
}

export function validarEdicionEvaluacion(estado) {
  if (!["borrador", "en_proceso"].includes(estado)) {
    throw conflicto("La evaluación ya fue finalizada; reábrela antes de modificarla.");
  }
}

export function validarFinalizacionEvaluacion(estado, usuario) {
  exigirRol(usuario, ROLES_EVALUADORES);
  validarEdicionEvaluacion(estado);
}

export function validarReaperturaEvaluacion(estado, usuario) {
  exigirRol(usuario, ROLES_EVALUADORES);
  if (estado !== "finalizada") {
    throw conflicto("Solo se puede reabrir una evaluación finalizada que aún no haya sido validada.");
  }
}

export function validarCambioEstadoEvaluacion(estado, nuevoEstado, usuario) {
  exigirRol(usuario, ROLES_VALIDADORES);
  const siguiente = { finalizada: "validada", validada: "cerrada" }[estado];
  if (!siguiente || nuevoEstado !== siguiente) {
    throw conflicto("La transición solicitada no está permitida. El flujo es finalizada → validada → cerrada.");
  }
}

export function validarCalculoFinal(calculo) {
  if (calculo.pend) {
    throw validacion("No se puede avanzar: hay indicadores pendientes o con puntuación inválida.");
  }
  if (calculo.gruposSinDato.length) {
    throw validacion("No se puede avanzar: falta puntuación válida en " + calculo.gruposSinDato.join(", ") + ".");
  }
  if (!calculo.isFinal) {
    throw validacion("No se puede avanzar: el resultado global todavía no es calculable.");
  }
}
