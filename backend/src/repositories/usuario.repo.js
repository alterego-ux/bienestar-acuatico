/* =====================================================================
   Repositorio · usuario
   ===================================================================== */
import { query } from "../config/db.js";

const CAMPOS = `u.id, u.nombre, u.email, u.activo, u.creado_en, r.codigo AS rol, r.nombre AS rol_nombre`;

export async function porEmail(email) {
  const { rows } = await query(
    `SELECT ${CAMPOS}, u.password_hash
       FROM usuario u JOIN rol r ON r.id = u.rol_id
      WHERE lower(u.email) = lower($1)`,
    [email]
  );
  return rows[0] || null;
}

export async function porId(id) {
  const { rows } = await query(
    `SELECT ${CAMPOS} FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function listar({ activo } = {}) {
  const cond = activo === undefined ? "" : "WHERE u.activo = $1";
  const params = activo === undefined ? [] : [activo];
  const { rows } = await query(
    `SELECT ${CAMPOS} FROM usuario u JOIN rol r ON r.id = u.rol_id ${cond} ORDER BY u.nombre`,
    params
  );
  return rows;
}

export async function crear({ nombre, email, hash, rolId, activo = true }) {
  const { rows } = await query(
    `INSERT INTO usuario (nombre, email, password_hash, rol_id, activo)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [nombre, email, hash, rolId, activo]
  );
  return porId(rows[0].id);
}

export async function actualizar(id, { nombre, email, rolId, activo, hash }) {
  const { rows } = await query(
    `UPDATE usuario SET
        nombre = COALESCE($2, nombre),
        email = COALESCE($3, email),
        rol_id = COALESCE($4, rol_id),
        activo = COALESCE($5, activo),
        password_hash = COALESCE($6, password_hash)
      WHERE id = $1 RETURNING id`,
    [id, nombre ?? null, email ?? null, rolId ?? null, activo ?? null, hash ?? null]
  );
  return rows[0] ? porId(id) : null;
}

export async function cambiarClave(id, hash) {
  await query("UPDATE usuario SET password_hash = $2 WHERE id = $1", [id, hash]);
}

export async function listarRoles() {
  const { rows } = await query("SELECT id, codigo, nombre, descripcion FROM rol ORDER BY id");
  return rows;
}

export async function idRolPorCodigo(codigo) {
  const { rows } = await query("SELECT id FROM rol WHERE codigo = $1", [codigo]);
  return rows[0] ? rows[0].id : null;
}

export default { porEmail, porId, listar, crear, actualizar, cambiarClave, listarRoles, idRolPorCodigo };
