/* =====================================================================
   Controlador · evidencias
   ===================================================================== */
import evidenciaService from "../services/evidencia.service.js";
import { asyncHandler, ok, creado } from "../utils/http.js";

export const subir = asyncHandler(async (req, res) => {
  const respuestaId = Number(req.body.respuesta_id || req.query.respuesta_id);
  return creado(res, await evidenciaService.subir(respuestaId, req.file, req.usuario));
});

export const listar = asyncHandler(async (req, res) =>
  ok(res, await evidenciaService.listar(Number(req.params.respuestaId)))
);

export const archivo = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      error: { codigo: "ID_INVALIDO", mensaje: "La evidencia indicada no es válida." },
    });
  }

  const ev = await evidenciaService.obtenerArchivo(id);
  const tipo = String(ev.tipo || "application/octet-stream").toLowerCase();
  const inline = /^image\/(jpeg|jpg|png|gif|webp|avif|bmp|tiff)$/.test(tipo)
    || /^video\/(mp4|webm|ogg|quicktime)$/.test(tipo)
    || tipo === "application/pdf";
  const nombreSeguro = String(ev.nombre || "evidencia")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/[\r\n"\\]/g, "_")
    .slice(0, 160);

  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${nombreSeguro}"`);
  res.setHeader("Content-Length", String(ev.contenido.length));
  res.type(tipo);
  return res.send(ev.contenido);
});

export const eliminar = asyncHandler(async (req, res) =>
  ok(res, await evidenciaService.eliminar(Number(req.params.id), req.usuario))
);

export default { subir, listar, archivo, eliminar };
