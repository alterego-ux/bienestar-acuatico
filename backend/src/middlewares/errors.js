/* =====================================================================
   Middlewares de error · 404 y manejador central
   ===================================================================== */
import { ErrorApp } from "../utils/errores.js";
import config from "../config/env.js";

export function noEncontrado(req, res) {
  res.status(404).json({ error: { codigo: "RUTA_NO_ENCONTRADA", mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  if (err instanceof ErrorApp) {
    return res.status(err.estado).json({
      error: { codigo: err.codigo, mensaje: err.message, detalles: err.detalles },
    });
  }
  if (err && err.code === "23505" || (err && err.code === "23505")) {
    return res.status(409).json({ error: { codigo: "DUPLICADO", mensaje: "El registro ya existe (valor único duplicado)." } });
  }
  if (err && err.code === "23503") {
    return res.status(409).json({ error: { codigo: "REFERENCIA", mensaje: "Referencia a un registro inexistente o en uso." } });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: { codigo: "ARCHIVO_GRANDE", mensaje: `El archivo supera el máximo de ${config.uploads.maxMB} MB.` } });
  }
  console.error("[error]", err);
  res.status(500).json({
    error: {
      codigo: "ERROR_INTERNO",
      mensaje: "Ocurrió un error inesperado.",
      ...(config.produccion ? {} : { detalle: err && err.message }),
    },
  });
}

export default { noEncontrado, manejadorErrores };
