/* =====================================================================
   Controlador · predios
   ===================================================================== */
import predioService from "../services/predio.service.js";
import { asyncHandler, ok, creado } from "../utils/http.js";

export const listar = asyncHandler(async (req, res) =>
  ok(res, await predioService.listar({ texto: req.query.q || req.query.texto }))
);
export const porId = asyncHandler(async (req, res) => ok(res, await predioService.porId(Number(req.params.id))));
export const crear = asyncHandler(async (req, res) => creado(res, await predioService.crear(req.body, req.usuario.id)));
export const actualizar = asyncHandler(async (req, res) =>
  ok(res, await predioService.actualizar(Number(req.params.id), req.body, req.usuario.id))
);
export const eliminar = asyncHandler(async (req, res) =>
  ok(res, await predioService.eliminar(Number(req.params.id), req.usuario.id))
);

export const planMuestreo = asyncHandler(async (req, res) =>
  ok(res, await predioService.planMuestreo(Number(req.params.id), Number(req.query.especie)))
);

export default { listar, porId, crear, actualizar, eliminar, planMuestreo };
