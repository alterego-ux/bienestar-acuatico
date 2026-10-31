/* =====================================================================
   Controlador · autenticación
   ===================================================================== */
import authService from "../services/auth.service.js";
import { asyncHandler, ok, creado } from "../utils/http.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  return ok(res, await authService.login({ email, password }));
});

export const registro = asyncHandler(async (req, res) => {
  return creado(res, await authService.registrar(req.body));
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, await authService.me(req.usuario.id));
});

export const cambiarClave = asyncHandler(async (req, res) => {
  return ok(res, await authService.cambiarClave(req.usuario.id, req.body));
});

export default { login, registro, me, cambiarClave };
