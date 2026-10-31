/* =====================================================================
   Arranque del servidor · Bienestar Acuático API
   Metodología ICA v2.0 (2024) · prototipo académico (no oficial del ICA)
   ===================================================================== */
import app from "./app.js";
import config, { avisarConfiguracion } from "./config/env.js";
import { probarConexion, cerrarPool } from "./config/db.js";

async function iniciar() {
  console.log("──────────────────────────────────────────────────────────");
  console.log("  Bienestar Acuático · API (prototipo académico)");
  console.log(`  Versión ${config.version} · entorno ${config.entorno}`);
  console.log("  Metodología de referencia: ICA v2.0 (2024) — no oficial.");
  console.log("──────────────────────────────────────────────────────────");

  for (const aviso of avisarConfiguracion()) console.warn("  ⚠  " + aviso);

  let db = false;
  try {
    db = await probarConexion();
  } catch (err) {
    console.error("  ✖  No se pudo conectar a PostgreSQL:", err.message);
    console.error("     Revisa backend/.env o levanta la base con: npm run setup");
  }
  console.log(db ? "  ✔  PostgreSQL conectada." : "  ⚠  API sin conexión a la base de datos (modo degradado).");

  const servidor = app.listen(config.puerto, () => {
    console.log(`  ▶  API:       http://localhost:${config.puerto}/api`);
    console.log(`  ▶  Salud:     http://localhost:${config.puerto}/api/salud`);
    console.log("  ▶  Frontend:  http://localhost:4200  (Angular · npm run dev)");
    console.log("──────────────────────────────────────────────────────────");
  });

  const cerrar = async (senal) => {
    console.log(`\n[${senal}] cerrando servidor…`);
    servidor.close(async () => {
      try {
        await cerrarPool();
      } catch (_) {
        /* ignore */
      }
      process.exit(0);
    });
  };
  process.on("SIGINT", () => cerrar("SIGINT"));
  process.on("SIGTERM", () => cerrar("SIGTERM"));
}

iniciar().catch((err) => {
  console.error("Error fatal al iniciar el servidor:", err);
  process.exit(1);
});
