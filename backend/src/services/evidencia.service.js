/* =====================================================================
   Servicio · evidencias persistentes en Supabase Storage
   ===================================================================== */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import evidenciaRepo from "../repositories/evidencia.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { noEncontrado, validacion, ErrorApp } from "../utils/errores.js";
import config from "../config/env.js";
import { bucketEvidencias } from "../config/storage.js";

function extensionSegura(nombre) {
  const extension = path.extname(nombre || "").toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

function esRutaStorage(valor) {
  // Los registros anteriores guardaban solo el nombre del archivo local.
  // Los nuevos objetos se guardan dentro de una carpeta por respuesta.
  return typeof valor === "string" && valor.includes("/");
}

export async function subir(respuestaId, archivo, usuario) {
  if (!archivo?.buffer) throw validacion("No se recibió ningún archivo.");
  if (!Number.isSafeInteger(respuestaId) || respuestaId < 1) {
    throw validacion("La respuesta indicada no es válida.");
  }
  if (!(await evidenciaRepo.respuestaExiste(respuestaId))) throw noEncontrado("Respuesta");

  const bucket = bucketEvidencias();
  const almacenamiento = `${respuestaId}/${randomUUID()}${extensionSegura(archivo.originalname)}`;
  const { error: errorSubida } = await bucket.upload(almacenamiento, archivo.buffer, {
    contentType: archivo.mimetype || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });

  if (errorSubida) {
    console.error("[storage] No se pudo subir la evidencia:", errorSubida.message);
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
    // Evita dejar un objeto huérfano si falla el INSERT en PostgreSQL.
    const { error: errorLimpieza } = await bucket.remove([almacenamiento]);
    if (errorLimpieza) console.error("[storage] No se pudo limpiar un archivo sin registro:", errorLimpieza.message);
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

  if (esRutaStorage(ev.almacenamiento)) {
    const { data, error } = await bucketEvidencias().download(ev.almacenamiento);
    if (error || !data) {
      console.error("[storage] No se pudo descargar la evidencia:", error?.message || "sin contenido");
      throw noEncontrado("Archivo de evidencia");
    }
    return {
      contenido: Buffer.from(await data.arrayBuffer()),
      nombre: ev.nombre_archivo,
      tipo: ev.tipo_mime || "application/octet-stream",
    };
  }

  // Compatibilidad temporal con evidencias antiguas que se guardaron en disco.
  const ruta = path.isAbsolute(ev.almacenamiento)
    ? ev.almacenamiento
    : path.join(config.uploads.dir, path.basename(ev.almacenamiento));
  if (!fs.existsSync(ruta) || !fs.statSync(ruta).isFile()) throw noEncontrado("Archivo de evidencia");
  return {
    contenido: fs.readFileSync(ruta),
    nombre: ev.nombre_archivo,
    tipo: ev.tipo_mime || "application/octet-stream",
  };
}

export async function eliminar(id, usuario) {
  const ev = await evidenciaRepo.porId(id);
  if (!ev) throw noEncontrado("Evidencia");

  if (esRutaStorage(ev.almacenamiento)) {
    const { error } = await bucketEvidencias().remove([ev.almacenamiento]);
    if (error) {
      console.error("[storage] No se pudo eliminar la evidencia:", error.message);
      throw new ErrorApp("STORAGE_DELETE", "No se pudo eliminar el archivo de evidencia.", 502);
    }
  } else if (ev.almacenamiento) {
    // Compatibilidad con archivos locales antiguos si aún existen.
    const ruta = path.isAbsolute(ev.almacenamiento)
      ? ev.almacenamiento
      : path.join(config.uploads.dir, path.basename(ev.almacenamiento));
    try {
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    } catch (error) {
      console.warn("[evidencia] No se pudo eliminar el archivo local antiguo:", error.message);
    }
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
