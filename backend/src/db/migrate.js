/* =====================================================================
   Runner de migraciones · aplica los .sql en orden, de forma idempotente
   Uso: node src/db/migrate.js
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR_MIGRACIONES = path.join(__dirname, "migrations");

async function asegurarTabla() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migraciones (
      id          SERIAL PRIMARY KEY,
      archivo     VARCHAR(200) NOT NULL UNIQUE,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function aplicadas() {
  const { rows } = await pool.query("SELECT archivo FROM migraciones");
  return new Set(rows.map((r) => r.archivo));
}

export async function migrar({ silencioso = false } = {}) {
  const log = (...a) => {
    if (!silencioso) console.log(...a);
  };
  await asegurarTabla();
  const ya = await aplicadas();
  const archivos = fs
    .readdirSync(DIR_MIGRACIONES)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let aplicadasAhora = 0;
  for (const archivo of archivos) {
    if (ya.has(archivo)) {
      log(`· omitida  ${archivo} (ya aplicada)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(DIR_MIGRACIONES, archivo), "utf8");
    log(`→ aplicando ${archivo} …`);
    const cliente = await pool.connect();
    try {
      // El propio script maneja BEGIN/COMMIT; para el registro usamos una
      // sentencia aparte después de que el script se complete.
      await cliente.query(sql);
      await cliente.query("INSERT INTO migraciones (archivo) VALUES ($1)", [archivo]);
      aplicadasAhora++;
      log(`  ✔ ${archivo}`);
    } catch (err) {
      console.error(`  ✘ error en ${archivo}: ${err.message}`);
      throw err;
    } finally {
      cliente.release();
    }
  }
  log(
    aplicadasAhora
      ? `Migraciones completadas (${aplicadasAhora} aplicada(s)).`
      : "Sin migraciones pendientes."
  );
  return aplicadasAhora;
}

// Ejecución directa
if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  migrar()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Fallo de migración:", err.message);
      pool.end().finally(() => process.exit(1));
    });
}

export default migrar;
