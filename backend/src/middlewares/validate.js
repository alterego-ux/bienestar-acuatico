/* =====================================================================
   Middleware de validación con Zod
   ===================================================================== */
import { validacion } from "../utils/errores.js";

/**
 * @param {import("zod").ZodTypeAny} esquema
 * @param {"body"|"query"|"params"} origen
 */
export function validar(esquema, origen = "body") {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[origen]);
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      }));
      return next(validacion("Datos inválidos.", detalles));
    }
    req[origen] = resultado.data;
    next();
  };
}

export default validar;
