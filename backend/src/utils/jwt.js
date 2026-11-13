/* =====================================================================
   Utilidades JWT
   ===================================================================== */
import jwt from "jsonwebtoken";
import config from "./../config/env.js";
import { noAutorizado } from "./errores.js";

export function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    config.jwt.secreto,
    { expiresIn: config.jwt.expira }
  );
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, config.jwt.secreto);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw noAutorizado("La sesión expiró. Vuelve a iniciar sesión.");
    throw noAutorizado("Token inválido.");
  }
}

export function leerBearer(req) {
  const cabecera = req.headers.authorization || "";
  const [tipo, token] = cabecera.split(" ");
  if (tipo !== "Bearer" || !token) return null;
  return token;
}

export default { firmarToken, verificarToken, leerBearer };
