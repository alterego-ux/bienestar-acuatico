/* =====================================================================
   Configuración de entorno · carga y valida variables .env
   ===================================================================== */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(raiz, ".env") });

const aNumero = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const aBooleano = (v, def) => {
  if (v === undefined || v === "") return def;
  return /^(1|true|si|sí|yes)$/i.test(String(v));
};

const entorno = process.env.NODE_ENV || "development";

/**
 * ¿La conexión a PostgreSQL debe usar SSL?
 *  - PGSSL=true / false  → fuerza el valor.
 *  - PGSSL vacío (auto)  → se activa si la URL apunta a un proveedor en la nube
 *    (Supabase, Neon, Render, Railway...) o trae sslmode=require.
 */
function decidirSsl(cadena, host) {
  const v = (process.env.PGSSL || "").trim().toLowerCase();
  if (/^(1|true|si|sí|yes|require)$/.test(v)) return true;
  if (/^(0|false|no|disable)$/.test(v)) return false;
  const texto = `${cadena || ""} ${host || ""}`.toLowerCase();
  return /supabase\.(co|com)|neon\.tech|render\.com|railway\.app|sslmode=(require|verify)/.test(texto);
}

/** Quita sslmode=... de la URL: el SSL lo controla `decidirSsl` (evita conflictos con `pg`). */
function limpiarCadena(cadena) {
  if (!cadena) return "";
  return cadena.replace(/([?&])sslmode=[^&]*&?/i, "$1").replace(/[?&]$/, "");
}

export const config = {
  entorno,
  produccion: entorno === "production",
  // Puerto propio del proyecto nuevo (4100) para no chocar con el proyecto anterior (4000).
  puerto: aNumero(process.env.PORT, 4100),

  db: {
    cadena: limpiarCadena(process.env.DATABASE_URL || ""),
    ssl: decidirSsl(process.env.DATABASE_URL, process.env.PGHOST),
    host: process.env.PGHOST || "localhost",
    puerto: aNumero(process.env.PGPORT, 5432),
    usuario: process.env.PGUSER || "postgres",
    clave: process.env.PGPASSWORD || "postgres",
    base: process.env.PGDATABASE || "bienestar_acuatico",
  },

  jwt: {
    secreto: process.env.JWT_SECRET || "desarrollo_inseguro_cambiar",
    expira: process.env.JWT_EXPIRA || "8h",
  },

  cors: {
    origenes: (process.env.CORS_ORIGEN || "http://localhost:4200,http://127.0.0.1:4200")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  },

  uploads: {
    dir: path.resolve(raiz, process.env.UPLOADS_DIR || "./uploads"),
    maxMB: aNumero(process.env.MAX_UPLOAD_MB, 15),
  },

  // Almacenamiento persistente de evidencias (Supabase Storage).
  storage: {
    url: process.env.SUPABASE_URL || "",
    secretKey: process.env.SUPABASE_SECRET_KEY || "",
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "evidencias",
  },

  modoOfflinePermitido: aBooleano(process.env.MODO_OFFLINE_PERMITIDO, true),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    modelo: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    maxMensaje: aNumero(process.env.GEMINI_MAX_MESSAGE_CHARS, 2000),
    limitePorMinuto: aNumero(process.env.GEMINI_RATE_LIMIT_PER_MINUTE, 12),
  },

  raiz,
  version: "2.0.0",
};

export function avisarConfiguracion() {
  const avisos = [];
  if (!config.db.cadena && !process.env.PGDATABASE) {
    avisos.push("No se definió DATABASE_URL ni PGDATABASE; se usarán los valores por defecto.");
  }
  if (!config.produccion && config.jwt.secreto.startsWith("desarrollo")) {
    avisos.push("JWT_SECRET no está definido; se usa un valor de desarrollo. No lo uses en producción.");
  }
  if (config.cors.origenes.includes("*") && config.produccion) {
    avisos.push("CORS_ORIGEN='*' en producción no es recomendable.");
  }
  return avisos;
}

export default config;
