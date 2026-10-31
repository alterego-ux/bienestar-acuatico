/* =====================================================================
   ensure.js · deja la base lista para desarrollar, de forma idempotente.
   1) Aplica las migraciones pendientes.
   2) Si la base está vacía (sin usuarios), carga catálogos y datos demo.
   Uso: node src/db/ensure.js   (lo llama `npm run dev` desde la raíz)
   ===================================================================== */
import { pool } from "../config/db.js";
import { migrar } from "./migrate.js";
import { sembrar } from "./seed.js";

async function main() {
  await migrar({ silencioso: true });
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM usuario");
  if (rows[0].n === 0) {
    console.log("[db] Base vacía: cargando catálogos ICA y datos de demostración…");
    await sembrar({ silencioso: true });
    console.log("[db] Datos de demostración cargados.");
  } else {
    console.log("[db] Base lista (migraciones al día).");
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("[db] No se pudo preparar la base de datos:", err.message);
    await pool.end().catch(() => {});
    process.exit(2);
  });
