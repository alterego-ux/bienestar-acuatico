/* =====================================================================
   Servicio · evidencias (Supabase Storage o disco local, ver config/almacen.js)
   ===================================================================== */
import { randomUUID } from "node:crypto";
import path from "node:path";
import evidenciaRepo from "../repositories/evidencia.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { noEncontrado, validacion, ErrorApp } from "../utils/errores.js";
import almacen from "../config/almacen.js";

function extensionSegura(nombre) {
  const extension = path.extname(nombre || "").toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

export async function subir(respuestaId, archivo, usuario) {
  if (!archivo?.buffer) throw validacion("No se recibió ningún archivo.");
  if (!Number.isSafeInteger(respuestaId) || respuestaId < 1) {
    throw validacion("La respuesta indicada no es válida.");
  }
  if (!(await evidenciaRepo.respuestaExiste(respuestaId))) throw noEncontrado("Respuesta");

  const clave = `${respuestaId}/${randomUUID()}${extensionSegura(archivo.originalname)}`;
  let almacenamiento;
  try {
    almacenamiento = await almacen.guardar(clave, archivo.buffer, archivo.mimetype);
  } catch (err) {
    console.error("[storage] No se pudo guardar la evidencia:", err.message);
    throw new ErrorApp("STORAGE_UPLOAD", "No se pudo guardar la evidencia en el almacenamiento.", 502);
  }

  let ev;
  try {
    ev = await evidenciaRepo.crear({
      respuestaId,
      nombre: archivo.originalname,
      tipo: archivo.mimetype,
      tamano: archivo.size,
      almacenamiento,
    });
  } catch (error) {
    // Evita dejar un archivo huérfano si falla el INSERT en PostgreSQL.
    await almacen.borrar(almacenamiento).catch((e) => console.error("[storage] No se pudo limpiar un archivo sin registro:", e.message));
    throw error;
  }

  await auditoriaRepo.registrar({
    usuarioId: usuario.id,
    accion: `Evidencia subida: ${archivo.originalname}`,
    entidad: "evidencia",
    entidadId: ev.id,
  });
  return ev;
}

export async function listar(respuestaId) {
  return evidenciaRepo.listarPorRespuesta(respuestaId);
}

export async function obtenerArchivo(id) {
  const ev = await evidenciaRepo.porId(id);
  if (!ev) throw noEncontrado("Evidencia");
  if (!ev.almacenamiento) throw noEncontrado("Archivo de evidencia");

  const contenido = await almacen.leer(ev.almacenamiento);
  if (!contenido) throw noEncontrado("Archivo de evidencia");
  return {
    contenido,
    nombre: ev.nombre_archivo,
    tipo: ev.tipo_mime || "application/octet-stream",
  };
}

export async function eliminar(id, usuario) {
  const ev = await evidenciaRepo.porId(id);
  if (!ev) throw noEncontrado("Evidencia");

  try {
    await almacen.borrar(ev.almacenamiento);
  } catch (error) {
    console.error("[storage] No se pudo eliminar la evidencia:", error.message);
    throw new ErrorApp("STORAGE_DELETE", "No se pudo eliminar el archivo de evidencia.", 502);
  }

  await evidenciaRepo.eliminar(id);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id,
    accion: `Evidencia eliminada: ${ev.nombre_archivo}`,
    entidad: "evidencia",
    entidadId: id,
  });
  return { ok: true };
}

export default { subir, listar, obtenerArchivo, eliminar };
