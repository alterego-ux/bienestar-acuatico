import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validarCambioEstadoEvaluacion,
  validarCalculoFinal,
  validarEdicionEvaluacion,
  validarFinalizacionEvaluacion,
  validarReaperturaEvaluacion,
} from "../src/domain/estados-evaluacion.js";
import { estadoSchema, evaluacionSchema, registroSchema } from "../src/routes/schemas.js";

const evaluador = { rol: "evaluador" };
const docente = { rol: "docente" };
const consultor = { rol: "consultor" };
const calculoCompleto = { pend: 0, gruposSinDato: [], isFinal: true };

function assertError(fn, { codigo, estado }) {
  assert.throws(fn, (error) => error.codigo === codigo && error.estado === estado);
}

test("solo una evaluación en curso se puede finalizar y debe tener cálculo completo", () => {
  assert.doesNotThrow(() => validarFinalizacionEvaluacion("en_proceso", evaluador));
  assert.doesNotThrow(() => validarCalculoFinal(calculoCompleto));
  assertError(() => validarFinalizacionEvaluacion("validada", evaluador), { codigo: "CONFLICTO", estado: 409 });
  assertError(() => validarFinalizacionEvaluacion("en_proceso", consultor), { codigo: "PROHIBIDO", estado: 403 });
  assertError(() => validarCalculoFinal({ ...calculoCompleto, pend: 1 }), { codigo: "VALIDACION", estado: 422 });
  assertError(() => validarCalculoFinal({ ...calculoCompleto, gruposSinDato: ["MBR"] }), { codigo: "VALIDACION", estado: 422 });
  assertError(() => validarCalculoFinal({ ...calculoCompleto, isFinal: false }), { codigo: "VALIDACION", estado: 422 });
});

test("solo docente o admin puede validar y cerrar siguiendo el orden permitido", () => {
  assert.doesNotThrow(() => validarCambioEstadoEvaluacion("finalizada", "validada", docente));
  assert.doesNotThrow(() => validarCambioEstadoEvaluacion("validada", "cerrada", { rol: "admin" }));
  assertError(() => validarCambioEstadoEvaluacion("finalizada", "validada", evaluador), { codigo: "PROHIBIDO", estado: 403 });
  assertError(() => validarCambioEstadoEvaluacion("finalizada", "cerrada", docente), { codigo: "CONFLICTO", estado: 409 });
  assertError(() => validarCambioEstadoEvaluacion("en_proceso", "validada", docente), { codigo: "CONFLICTO", estado: 409 });
});

test("editar o reabrir requiere una acción válida sobre una evaluación finalizada", () => {
  assert.doesNotThrow(() => validarEdicionEvaluacion("en_proceso"));
  assertError(() => validarEdicionEvaluacion("finalizada"), { codigo: "CONFLICTO", estado: 409 });
  assert.doesNotThrow(() => validarReaperturaEvaluacion("finalizada", evaluador));
  assertError(() => validarReaperturaEvaluacion("validada", docente), { codigo: "CONFLICTO", estado: 409 });
  assertError(() => validarReaperturaEvaluacion("finalizada", consultor), { codigo: "PROHIBIDO", estado: 403 });
});

test("los esquemas API no permiten asignar roles ni saltarse las rutas de estado", () => {
  assert.equal(registroSchema.safeParse({
    nombre: "Cuenta de prueba",
    email: "prueba@example.com",
    password: "pass1234",
    rol: "admin",
  }).success, false);
  assert.equal(evaluacionSchema.partial().safeParse({ estado: "finalizada" }).success, false);
  assert.equal(estadoSchema.safeParse({ estado: "finalizada" }).success, false);
  assert.equal(estadoSchema.safeParse({ estado: "validada" }).success, true);
});
