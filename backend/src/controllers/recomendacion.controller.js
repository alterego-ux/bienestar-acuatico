/* =====================================================================
   Controlador · recomendaciones y plan de mejora
   ===================================================================== */
import recService from "../services/recomendacion.service.js";
import { asyncHandler, ok, creado } from "../utils/http.js";

export const generar = asyncHandler(async (req, res) =>
  ok(res, await recService.generar(Number(req.params.id), req.usuario))
);
export const listar = asyncHandler(async (req, res) => ok(res, await recService.listar(Number(req.params.id))));
export const plan = asyncHandler(async (req, res) => ok(res, await recService.plan(Number(req.params.id))));
export const generarPlan = asyncHandler(async (req, res) =>
  creado(res, await recService.generarPlan(Number(req.params.id), req.usuario))
);
export const actualizarItem = asyncHandler(async (req, res) =>
  ok(res, await recService.actualizarItem(Number(req.params.id), Number(req.params.itemId), req.body))
);

export default { generar, listar, plan, generarPlan, actualizarItem };
