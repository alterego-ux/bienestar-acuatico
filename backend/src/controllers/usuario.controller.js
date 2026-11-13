/* =====================================================================
   Controlador · usuarios (administración)
   ===================================================================== */
import usuarioService from "../services/usuario.service.js";
import { asyncHandler, ok, creado } from "../utils/http.js";

export const listar = asyncHandler(async (req, res) =>
  ok(res, await usuarioService.listar({ activo: req.query.activo === undefined ? undefined : req.query.activo === "1" }))
);
export const roles = asyncHandler(async (req, res) => ok(res, await usuarioService.roles()));
export const crear = asyncHandler(async (req, res) => creado(res, await usuarioService.crear(req.body, req.usuario)));
export const actualizar = asyncHandler(async (req, res) =>
  ok(res, await usuarioService.actualizar(Number(req.params.id), req.body, req.usuario))
);
export const alternar = asyncHandler(async (req, res) =>
  ok(res, await usuarioService.alternarActivo(Number(req.params.id), req.usuario))
);

export default { listar, roles, crear, actualizar, alternar };
