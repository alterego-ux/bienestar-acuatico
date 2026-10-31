/* =====================================================================
   Servicio · predios
   Normaliza el payload (acepta ids o nombres) y delega en el repositorio.
   ===================================================================== */
import predioRepo from "../repositories/predio.repo.js";
import cat from "../repositories/indicador.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { noEncontrado, validacion } from "../utils/errores.js";
import { query } from "../config/db.js";
import { muestreoDetalle } from "../domain/muestreo.js";

async function mapaPorNombre(tabla, columna = "nombre") {
  const { rows } = await query(`SELECT id, ${columna} AS nombre FROM ${tabla}`);
  return new Map(rows.map((r) => [String(r.nombre).toLowerCase(), r.id]));
}

async function normalizar(payload) {
  const errores = [];
  const cod = (payload.cod || "").trim();
  const n = (payload.n || "").trim();
  const resp = (payload.resp || "").trim();
  const mail = (payload.mail || "").trim();
  const telefono = String(payload.telefono || "").trim();
  if (telefono && !/^[+()0-9 .-]{7,40}$/.test(telefono)) errores.push("teléfono de contacto válido");
  if (!cod) errores.push("código");
  if (!n) errores.push("nombre");
  if (!resp) errores.push("responsable");
  if (!/^\S+@\S+\.\S+$/.test(mail)) errores.push("correo válido");

  const tipos = await mapaPorNombre("tipo_productor");
  const sistemas = await mapaPorNombre("sistema_productivo");
  const especies = await mapaPorNombre("especie", "nombre_comun");

  let tipoId = payload.tipoId || null;
  if (!tipoId && payload.tipo) tipoId = tipos.get(String(payload.tipo).toLowerCase()) || null;
  if (!tipoId) errores.push("tipo de predio");

  let depId = payload.depId || null;
  let munId = payload.munId || null;
  const departamento = payload.dep || payload.departamento;
  if (!depId && departamento) {
    const { depId: dId, munId: mId } = await predioRepo.obtenerOCrearUbicacion(
      departamento,
      payload.mun || payload.municipio
    );
    depId = dId;
    munId = mId;
  }
  if (!depId) errores.push("departamento");
  if (!munId) errores.push("municipio");

  if ((payload.lat && Number.isNaN(Number(payload.lat))) || (payload.lng && Number.isNaN(Number(payload.lng)))) {
    errores.push("coordenadas numéricas");
  }
  if (errores.length) throw validacion("Revisa: " + errores.join(", ") + ".", errores);

  const sisNombres = payload.sis || [];
  const sisIds = [];
  for (const s of sisNombres) {
    const id = typeof s === "number" ? s : sistemas.get(String(s).toLowerCase());
    if (id) sisIds.push(id);
  }

  const inv = (payload.inv || [])
    .map((r) => ({
      espId: r.espId || (r.esp ? especies.get(String(r.esp).toLowerCase()) : null),
      cant: Number(r.cant) || 0,
      peso: Number(r.peso) || 0,
      lotes: Number(r.lotes) || 0,
    }))
    .filter((r) => r.espId);

  // Los lotes se crean al registrar el predio: cada especie debe indicar cuántos lotes siembra
  // y no puede repetirse (cada especie se evalúa por separado).
  if (!inv.length) throw validacion("Registra al menos una especie con su número de lotes sembrados.");
  const vistas = new Set();
  for (const r of inv) {
    if (!(r.lotes >= 1) || !Number.isInteger(r.lotes))
      throw validacion("Indica el número de lotes sembrados (entero ≥ 1) para cada especie.");
    if (vistas.has(r.espId)) throw validacion("Una misma especie no puede repetirse en el inventario del predio.");
    vistas.add(r.espId);
  }

  return {
    cod, n, resp, mail, telefono, tipoId, depId, munId,
    ver: payload.ver || "", dir: payload.dir || "",
    lat: payload.lat === "" || payload.lat === undefined ? null : Number(payload.lat),
    lng: payload.lng === "" || payload.lng === undefined ? null : Number(payload.lng),
    act: payload.act !== false,
    sisIds, inv,
  };
}

export async function listar({ texto } = {}) {
  return predioRepo.listar({ texto });
}

export async function porId(id) {
  const p = await predioRepo.porId(id);
  if (!p) throw noEncontrado("Predio");
  return p;
}

export async function crear(payload, usuarioId) {
  const datos = await normalizar(payload);
  const id = await predioRepo.crear(datos);
  await auditoriaRepo.registrar({ usuarioId, accion: `Predio creado: ${datos.n}`, entidad: "predio", entidadId: id });
  return predioRepo.porId(id);
}

export async function actualizar(id, payload, usuarioId) {
  const existe = await predioRepo.porId(id);
  if (!existe) throw noEncontrado("Predio");
  const datos = await normalizar({ ...payload, cod: payload.cod || existe.cod });
  await predioRepo.actualizar(id, datos);
  await auditoriaRepo.registrar({ usuarioId, accion: `Predio editado: ${datos.n}`, entidad: "predio", entidadId: id });
  return predioRepo.porId(id);
}

export async function eliminar(id, usuarioId) {
  const p = await predioRepo.porId(id);
  if (!p) throw noEncontrado("Predio");
  await predioRepo.eliminar(id);
  await auditoriaRepo.registrar({ usuarioId, accion: `Predio eliminado: ${p.n}`, entidad: "predio", entidadId: id });
  return { ok: true };
}

/**
 * Plan de muestreo de una especie del predio: lotes sembrados (definidos al registrar el predio),
 * modalidad y cuántos lotes deben evaluarse según la tabla del ICA.
 */
export async function planMuestreo(predioId, especieId, modalidadForzada = null) {
  const p = await porId(predioId);
  const fila = (p.inv || []).find((r) => Number(r.espId) === Number(especieId));
  if (!fila) throw validacion("Esa especie no está registrada en el inventario del predio.");
  const modalidad = p.modalidad || modalidadForzada || null;
  const det = muestreoDetalle(fila.lotes, modalidad || "PMG");
  return {
    predioId: p.id,
    especieId: fila.espId,
    especie: fila.esp,
    modalidad,
    pesoPromedio: fila.peso,
    ...det,
    nombresLotes: Array.from({ length: det.lotes }, (_, i) => `Lote ${i + 1}`),
  };
}

void cat;

export default { listar, porId, crear, actualizar, eliminar, planMuestreo };
