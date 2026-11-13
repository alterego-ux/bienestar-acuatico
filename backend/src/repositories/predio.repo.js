/* =====================================================================
   Repositorio · predio (con sistemas y lotes)
   ===================================================================== */
import { query, transaccion } from "../config/db.js";

const SELECT_BASE = `
  SELECT p.id, p.codigo AS cod, p.nombre AS n, p.responsable AS resp, p.email AS mail,
         p.telefono_contacto AS telefono, p.vereda AS ver, p.direccion AS dir, p.latitud AS lat, p.longitud AS lng,
         p.activo AS act, p.creado_en,
         tp.id AS tipo_id, tp.nombre AS tipo, mo.codigo AS modalidad,
         d.id AS dep_id, d.nombre AS dep,
         m.id AS mun_id, m.nombre AS mun
    FROM predio p
    LEFT JOIN tipo_productor tp ON tp.id = p.tipo_productor_id
    LEFT JOIN modalidad mo ON mo.id = tp.modalidad_id
    LEFT JOIN departamento d ON d.id = p.departamento_id
    LEFT JOIN municipio m ON m.id = p.municipio_id`;

async function hidratar(filas) {
  if (!filas.length) return filas;
  const ids = filas.map((f) => f.id);
  const { rows: sis } = await query(
    `SELECT ps.predio_id, sp.nombre
       FROM predio_sistema ps JOIN sistema_productivo sp ON sp.id = ps.sistema_productivo_id
      WHERE ps.predio_id = ANY($1::int[])`,
    [ids]
  );
  const { rows: inv } = await query(
    `SELECT l.id, l.predio_id, l.especie_id, e.codigo AS esp_codigo, e.nombre_comun AS esp, l.cantidad AS cant,
            l.peso_promedio_g AS peso, l.numero_lotes AS lotes
       FROM lote_predio l LEFT JOIN especie e ON e.id = l.especie_id
      WHERE l.predio_id = ANY($1::int[])`,
    [ids]
  );
  const sisMap = new Map();
  for (const s of sis) {
    if (!sisMap.has(s.predio_id)) sisMap.set(s.predio_id, []);
    sisMap.get(s.predio_id).push(s.nombre);
  }
  const invMap = new Map();
  for (const l of inv) {
    if (!invMap.has(l.predio_id)) invMap.set(l.predio_id, []);
    invMap.get(l.predio_id).push({ id: l.id, espId: l.especie_id, espCodigo: l.esp_codigo, esp: l.esp, cant: l.cant, peso: l.peso, lotes: l.lotes });
  }
  return filas.map((f) => ({ ...f, sis: sisMap.get(f.id) || [], inv: invMap.get(f.id) || [] }));
}

export async function listar({ texto } = {}) {
  const params = [];
  let where = "";
  if (texto) {
    params.push(`%${texto.toLowerCase()}%`);
    where = `WHERE (lower(p.nombre) LIKE $1 OR lower(p.codigo) LIKE $1 OR lower(p.responsable) LIKE $1
              OR lower(COALESCE(m.nombre,'')) LIKE $1 OR lower(COALESCE(d.nombre,'')) LIKE $1)`;
  }
  const { rows } = await query(`${SELECT_BASE} ${where} ORDER BY p.codigo`, params);
  return hidratar(rows);
}

export async function porId(id) {
  const { rows } = await query(`${SELECT_BASE} WHERE p.id = $1`, [id]);
  if (!rows[0]) return null;
  const [p] = await hidratar(rows);
  return p;
}

export async function obtenerOCrearUbicacion(depNombre, munNombre) {
  if (!depNombre) return { depId: null, munId: null };
  const dep = await query(
    `INSERT INTO departamento (nombre) VALUES ($1)
     ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
    [depNombre]
  );
  const depId = dep.rows[0].id;
  if (!munNombre) return { depId, munId: null };
  const mun = await query(
    `INSERT INTO municipio (nombre, departamento_id) VALUES ($1,$2)
     ON CONFLICT (nombre, departamento_id) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
    [munNombre, depId]
  );
  return { depId, munId: mun.rows[0].id };
}

export async function crear(datos) {
  return transaccion(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO predio (codigo, nombre, responsable, email, telefono_contacto, tipo_productor_id, departamento_id,
         municipio_id, vereda, direccion, latitud, longitud, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        datos.cod, datos.n, datos.resp, datos.mail, datos.telefono || null, datos.tipoId, datos.depId, datos.munId,
        datos.ver || "", datos.dir || "", datos.lat, datos.lng, datos.act !== false,
      ]
    );
    const id = rows[0].id;
    await guardarRelaciones(db, id, datos.sisIds, datos.inv);
    return id;
  });
}

export async function actualizar(id, datos) {
  return transaccion(async (db) => {
    await db.query(
      `UPDATE predio SET codigo=$2, nombre=$3, responsable=$4, email=$5, telefono_contacto=$6, tipo_productor_id=$7,
         departamento_id=$8, municipio_id=$9, vereda=$10, direccion=$11, latitud=$12, longitud=$13, activo=$14
       WHERE id=$1`,
      [
        id, datos.cod, datos.n, datos.resp, datos.mail, datos.telefono || null, datos.tipoId, datos.depId, datos.munId,
        datos.ver || "", datos.dir || "", datos.lat, datos.lng, datos.act !== false,
      ]
    );
    await db.query("DELETE FROM predio_sistema WHERE predio_id=$1", [id]);
    await db.query("DELETE FROM lote_predio WHERE predio_id=$1", [id]);
    await guardarRelaciones(db, id, datos.sisIds, datos.inv);
    return id;
  });
}

async function guardarRelaciones(db, id, sisIds = [], inv = []) {
  for (const sid of sisIds) {
    await db.query(
      "INSERT INTO predio_sistema (predio_id, sistema_productivo_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [id, sid]
    );
  }
  for (const l of inv) {
    await db.query(
      "INSERT INTO lote_predio (predio_id, especie_id, cantidad, peso_promedio_g, numero_lotes) VALUES ($1,$2,$3,$4,$5)",
      [id, l.espId || null, l.cant || 0, l.peso || 0, l.lotes || 0]
    );
  }
}

export async function eliminar(id) {
  const { rowCount } = await query("DELETE FROM predio WHERE id=$1", [id]);
  return rowCount > 0;
}

export default { listar, porId, crear, actualizar, eliminar, obtenerOCrearUbicacion };
