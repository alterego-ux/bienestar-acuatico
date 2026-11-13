/* =====================================================================
   Middleware de autenticación y autorización por rol
   ===================================================================== */
import { query } from "../config/db.js";
import { leerBearer, verificarToken } from "../utils/jwt.js";
import { noAutorizado, prohibido } from "../utils/errores.js";

export async function autenticar(req, res, next) {
  try {
    const token = leerBearer(req);
    if (!token) throw noAutorizado("Falta el token de acceso.");
    const datos = verificarToken(token);
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.email, u.activo, r.codigo AS rol
         FROM usuario u JOIN rol r ON r.id = u.rol_id
        WHERE u.id = $1`,
      [datos.id]
    );
    const usuario = rows[0];
    if (!usuario) throw noAutorizado("El usuario no existe.");
    if (!usuario.activo) throw noAutorizado("El usuario está inactivo.");
    req.usuario = usuario;
    next();
  } catch (err) {
    next(err);
  }
}

export function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return next(noAutorizado());
    if (roles.length && !roles.includes(req.usuario.rol)) {
      return next(prohibido(`Requiere uno de los roles: ${roles.join(", ")}.`));
    }
    next();
  };
}

/** Autenticación opcional: adjunta usuario si hay token válido, pero no falla. */
export async function autenticarOpcional(req, res, next) {
  const token = leerBearer(req);
  if (!token) return next();
  try {
    const datos = verificarToken(token);
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.email, u.activo, r.codigo AS rol
         FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = $1`,
      [datos.id]
    );
    if (rows[0] && rows[0].activo) req.usuario = rows[0];
  } catch (_) {
    /* silencioso */
  }
  next();
}

export default { autenticar, requiereRol, autenticarOpcional };
