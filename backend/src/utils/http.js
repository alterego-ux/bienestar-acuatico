/* =====================================================================
   Utilidades HTTP · asyncHandler y respuestas normalizadas
   ===================================================================== */

/** Envuelve controladores async para capturar errores hacia next(). */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Respuesta JSON estándar { datos, meta }. */
export function ok(res, datos, { estado = 200, meta } = {}) {
  return res.status(estado).json(meta ? { datos, meta } : { datos });
}

export function creado(res, datos) {
  return ok(res, datos, { estado: 201 });
}

/** Extrae paginación simple de la query. */
export function paginacion(req) {
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const tamano = Math.min(200, Math.max(1, Number(req.query.tamano) || 50));
  return { pagina, tamano, offset: (pagina - 1) * tamano, meta: { pagina, tamano } };
}

export default { asyncHandler, ok, creado, paginacion };
