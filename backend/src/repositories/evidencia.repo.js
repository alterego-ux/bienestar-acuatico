/* =====================================================================
   Repositorio · evidencias
   ===================================================================== */
import { query } from "../config/db.js";

export async function crear({ respuestaId, nombre, tipo, tamano, almacenamiento }) {
  const { rows } = await query(
    `INSERT INTO evidencia (respuesta_id, nombre_archivo, tipo_mime, tamano_bytes, almacenamiento)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, nombre_archivo AS name, tipo_mime AS type, tamano_bytes AS size`,
    [respuestaId, nombre, tipo || "", tamano || 0, almacenamiento || ""]
  );
  return rows[0];
}

export async function listarPorRespuesta(respuestaId) {
  const { rows } = await query(
    `SELECT id, nombre_archivo AS name, tipo_mime AS type, tamano_bytes AS size, almacenamiento, subido_en
       FROM evidencia WHERE respuesta_id = $1 ORDER BY id`,
    [respuestaId]
  );
  return rows;
}

export async function porId(id) {
  const { rows } = await query("SELECT * FROM evidencia WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function eliminar(id) {
  const { rows } = await query("DELETE FROM evidencia WHERE id = $1 RETURNING almacenamiento", [id]);
  return rows[0] || null;
}

/** Comprueba que la respuesta pertenece a una evaluación accesible. */
export async function respuestaExiste(respuestaId) {
  const { rows } = await query("SELECT id FROM respuesta_indicador WHERE id = $1", [respuestaId]);
  return !!rows[0];
}

export default { crear, listarPorRespuesta, porId, eliminar, respuestaExiste };
