/* =====================================================================
   Servicio · evidencias
   ===================================================================== */
import evidenciaRepo from "../repositories/evidencia.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { noEncontrado, validacion } from "../utils/errores.js";
import config from "../config/env.js";
import fs from "node:fs";
import path from "node:path";

export async function subir(respuestaId, archivo, usuario) {
  if (!archivo) throw validacion("No se recibió ningún archivo.");
  if (!(await evidenciaRepo.respuestaExiste(respuestaId))) throw noEncontrado("Respuesta");
  const ev = await evidenciaRepo.crear({
    respuestaId,
    nombre: archivo.originalname,
    tipo: archivo.mimetype,
    tamano: archivo.size,
    almacenamiento: archivo.filename,
  });
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Evidencia subida: ${archivo.originalname}`, entidad: "evidencia", entidadId: ev.id });
  return ev;
}

export async function listar(respuestaId) {
  return evidenciaRepo.listarPorRespuesta(respuestaId);
}

export async function obtenerArchivo(id) {
  const ev = await evidenciaRepo.porId(id);
  if (!ev) throw noEncontrado("Evidencia");
  if (!ev.almacenamiento) throw noEncontrado("Archivo de evidencia");
  const ruta = path.isAbsolute(ev.almacenamiento)
    ? ev.almacenamiento
    : path.join(config.uploads.dir, path.basename(ev.almacenamiento));
  if (!fs.existsSync(ruta) || !fs.statSync(ruta).isFile()) throw noEncontrado("Archivo de evidencia");
  return { ruta, nombre: ev.nombre_archivo, tipo: ev.tipo_mime || "application/octet-stream" };
}

export async function eliminar(id, usuario) {
  const ev = await evidenciaRepo.porId(id);
  if (!ev) throw noEncontrado("Evidencia");
  await evidenciaRepo.eliminar(id);
  if (ev.almacenamiento) {
    try {
      const ruta = path.isAbsolute(ev.almacenamiento)
        ? ev.almacenamiento
        : path.join(config.uploads.dir, path.basename(ev.almacenamiento));
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    } catch (_) {
      /* el archivo puede no existir */
    }
  }
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Evidencia eliminada: ${ev.nombre_archivo}`, entidad: "evidencia", entidadId: id });
  return { ok: true };
}

export default { subir, listar, obtenerArchivo, eliminar };
