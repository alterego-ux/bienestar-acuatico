/* =====================================================================
   Controlador · evaluaciones
   ===================================================================== */
import evaluacionService from "../services/evaluacion.service.js";
import { asyncHandler, ok, creado } from "../utils/http.js";

export const listar = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.listar({
    predioId: req.query.predio ? Number(req.query.predio) : undefined,
    estado: req.query.estado,
    desde: req.query.desde,
    hasta: req.query.hasta,
    modalidad: req.query.modalidad,
    limite: req.query.limite,
  }))
);

export const porId = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.porIdConCalculo(Number(req.params.id)))
);

export const respuestas = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.respuestas(Number(req.params.id)))
);

export const crear = asyncHandler(async (req, res) =>
  creado(res, await evaluacionService.crear(req.body, req.usuario))
);

export const actualizar = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.actualizar(Number(req.params.id), req.body, req.usuario))
);

export const eliminar = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.eliminar(Number(req.params.id), req.usuario))
);

export const guardarRespuesta = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.guardarRespuesta(Number(req.params.id), req.params.indicador, req.body, req.usuario))
);

export const finalizar = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.finalizar(Number(req.params.id), req.usuario, { reabrir: req.query.reabrir === "1" }))
);

export const reabrir = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.finalizar(Number(req.params.id), req.usuario, { reabrir: true }))
);

export const cambiarEstado = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.cambiarEstado(Number(req.params.id), req.body.estado, req.usuario))
);

export const recalcular = asyncHandler(async (req, res) =>
  ok(res, await evaluacionService.recalcular(Number(req.params.id), req.usuario))
);

export default {
  listar, porId, respuestas, crear, actualizar, eliminar, guardarRespuesta,
  finalizar, reabrir, cambiarEstado, recalcular,
};
