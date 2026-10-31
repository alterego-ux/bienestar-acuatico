/* =====================================================================
   Errores de aplicación · clase base y fábricas
   ===================================================================== */

export class ErrorApp extends Error {
  constructor(codigo, mensaje, estado = 400, detalles = null) {
    super(mensaje);
    this.name = "ErrorApp";
    this.codigo = codigo;
    this.estado = estado;
    this.detalles = detalles;
  }
}

export const noEncontrado = (entidad = "Recurso") =>
  new ErrorApp("NO_ENCONTRADO", `${entidad} no encontrado.`, 404);

export const noAutorizado = (mensaje = "No autenticado.") =>
  new ErrorApp("NO_AUTORIZADO", mensaje, 401);

export const prohibido = (mensaje = "No tienes permiso para esta acción.") =>
  new ErrorApp("PROHIBIDO", mensaje, 403);

export const conflicto = (mensaje, detalles = null) =>
  new ErrorApp("CONFLICTO", mensaje, 409, detalles);

export const validacion = (mensaje, detalles = null) =>
  new ErrorApp("VALIDACION", mensaje, 422, detalles);

export default { ErrorApp, noEncontrado, noAutorizado, prohibido, conflicto, validacion };
