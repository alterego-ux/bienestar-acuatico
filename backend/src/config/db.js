/* =====================================================================
   Acceso a PostgreSQL · pool de conexiones + helpers query/transacción
   ===================================================================== */
import pg from "pg";
import config from "./env.js";

const { Pool } = pg;

const base = {
  max: 10,
  idleTimeoutMillis: 30000,
  // En la nube (Supabase) el primer contacto puede tardar más que en local.
  connectionTimeoutMillis: config.db.ssl ? 15000 : 5000,
  // SSL requerido por Supabase y otros proveedores; en local queda desactivado.
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
};
const opciones = config.db.cadena
  ? { ...base, connectionString: config.db.cadena }
  : {
      ...base,
      host: config.db.host,
      port: config.db.puerto,
      user: config.db.usuario,
      password: config.db.clave,
      database: config.db.base,
    };

export const pool = new Pool(opciones);

pool.on("error", (err) => {
  console.error("[db] Error inesperado en el pool:", err.message);
});

/** Ejecuta una consulta parametrizada. */
export async function query(texto, params = []) {
  const inicio = Date.now();
  const res = await pool.query(texto, params);
  const ms = Date.now() - inicio;
  if (ms > 800) console.warn(`[db] Consulta lenta (${ms} ms): ${texto.slice(0, 80)}…`);
  return res;
}

/** Ejecuta una función dentro de una transacción, con rollback ante error. */
export async function transaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (err) {
    try {
      await cliente.query("ROLLBACK");
    } catch (_) {
      /* ignore */
    }
    throw err;
  } finally {
    cliente.release();
  }
}

/** Comprueba la conexión con la base de datos. */
export async function probarConexion() {
  const { rows } = await query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}

export async function cerrarPool() {
  await pool.end();
}

export default { pool, query, transaccion, probarConexion, cerrarPool };
