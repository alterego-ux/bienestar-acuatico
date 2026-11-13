/* =====================================================================
   Repositorio · auditoría
   ===================================================================== */
import { query } from "../config/db.js";

export async function registrar({ usuarioId = null, accion, entidad = "", entidadId = null }) {
  await query(
    "INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id) VALUES ($1,$2,$3,$4)",
    [usuarioId, String(accion).slice(0, 200), String(entidad).slice(0, 60), entidadId]
  );
}

export async function listar({ entidad, usuarioId, limite = 200 } = {}) {
  const cond = [];
  const params = [];
  if (entidad) { params.push(entidad); cond.push(`a.entidad = $${params.length}`); }
  if (usuarioId) { params.push(usuarioId); cond.push(`a.usuario_id = $${params.length}`); }
  params.push(Math.min(Number(limite) || 200, 1000));
  const where = cond.length ? `WHERE ${cond.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT a.id, a.accion, a.entidad, a.entidad_id, a.fecha_hora,
            COALESCE(u.nombre, 'Sistema') AS usuario
       FROM auditoria a LEFT JOIN usuario u ON u.id = a.usuario_id
       ${where} ORDER BY a.fecha_hora DESC LIMIT $${params.length}`,
    params
  );
  return rows;
}

export default { registrar, listar };
