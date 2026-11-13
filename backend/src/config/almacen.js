/* =====================================================================
   Almacén de evidencias · Supabase Storage o disco local (volumen Docker)
   ---------------------------------------------------------------------
   STORAGE_DRIVER=auto      (por defecto) usa Supabase si hay URL + clave;
                            si Supabase falla al subir, guarda en local.
   STORAGE_DRIVER=supabase  solo Supabase (si falla, el error se muestra).
   STORAGE_DRIVER=local     solo disco local (UPLOADS_DIR, volumen Docker).

   Cada registro de la tabla `evidencia` guarda dónde quedó su archivo:
     "local:12/uuid.jpg"  → disco local
     "12/uuid.jpg"        → Supabase Storage
     "archivo.jpg"        → formato antiguo (disco local)
   Así puedes cambiar de modo sin perder evidencias anteriores.
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import config from "./env.js";
import { bucketEvidencias } from "./storage.js";

const PREFIJO_LOCAL = "local:";

export function supabaseConfigurado() {
  return Boolean(config.storage.url && config.storage.secretKey);
}

/** Modo efectivo con el que se guardarán las evidencias nuevas. */
export function modoAlmacen() {
  const d = config.storage.driver;
  if (d === "local") return "local";
  if (d === "supabase") return "supabase";
  return supabaseConfigurado() ? "supabase" : "local";
}

export function esLocal(almacenamiento) {
  return typeof almacenamiento === "string" && (almacenamiento.startsWith(PREFIJO_LOCAL) || !almacenamiento.includes("/"));
}

function rutaLocalSegura(almacenamiento) {
  const relativa = almacenamiento.startsWith(PREFIJO_LOCAL) ? almacenamiento.slice(PREFIJO_LOCAL.length) : almacenamiento;
  const base = path.resolve(config.uploads.dir);
  const destino = path.resolve(base, relativa);
  if (destino !== base && !destino.startsWith(base + path.sep)) return null; // evita ../
  return destino;
}

async function guardarLocal(clave, buffer) {
  const destino = rutaLocalSegura(clave);
  if (!destino) throw new Error("Ruta de almacenamiento no válida.");
  await fs.promises.mkdir(path.dirname(destino), { recursive: true });
  await fs.promises.writeFile(destino, buffer);
  return PREFIJO_LOCAL + clave;
}

async function guardarSupabase(clave, buffer, mime) {
  const bucket = bucketEvidencias();
  const subir = () => bucket.upload(clave, buffer, { contentType: mime || "application/octet-stream", cacheControl: "3600", upsert: false });
  let { error } = await subir();
  // Proyecto Supabase nuevo: el bucket aún no existe → se crea (privado) y se reintenta.
  if (error && /bucket not found|not found/i.test(error.message || "")) {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(config.storage.url, config.storage.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: errBucket } = await admin.storage.createBucket(config.storage.bucket, { public: false });
    if (!errBucket || /already exists/i.test(errBucket.message || "")) ({ error } = await subir());
  }
  if (error) throw new Error(error.message || "Error de Supabase Storage");
  return clave;
}

/** Guarda el archivo y devuelve el valor que se almacena en evidencia.almacenamiento. */
export async function guardar(clave, buffer, mime) {
  const modo = modoAlmacen();
  if (modo === "local") return guardarLocal(clave, buffer);
  try {
    return await guardarSupabase(clave, buffer, mime);
  } catch (err) {
    if (config.storage.driver === "supabase") throw err;
    console.error(`[almacen] Supabase falló (${err.message}). Se guarda en disco local como respaldo.`);
    return guardarLocal(clave, buffer);
  }
}

/** Lee el archivo. Devuelve Buffer o null si no existe. */
export async function leer(almacenamiento) {
  if (esLocal(almacenamiento)) {
    const ruta = rutaLocalSegura(almacenamiento);
    if (!ruta || !fs.existsSync(ruta) || !fs.statSync(ruta).isFile()) return null;
    return fs.promises.readFile(ruta);
  }
  const { data, error } = await bucketEvidencias().download(almacenamiento);
  if (error || !data) {
    console.error("[almacen] No se pudo descargar de Supabase:", error?.message || "sin contenido");
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Elimina el archivo. Lanza error solo si Supabase falla. */
export async function borrar(almacenamiento) {
  if (!almacenamiento) return;
  if (esLocal(almacenamiento)) {
    const ruta = rutaLocalSegura(almacenamiento);
    try {
      if (ruta && fs.existsSync(ruta)) await fs.promises.unlink(ruta);
    } catch (e) {
      console.warn("[almacen] No se pudo eliminar el archivo local:", e.message);
    }
    return;
  }
  const { error } = await bucketEvidencias().remove([almacenamiento]);
  if (error) throw new Error(error.message);
}

export default { modoAlmacen, supabaseConfigurado, guardar, leer, borrar, esLocal };
