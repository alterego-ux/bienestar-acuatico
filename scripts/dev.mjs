/* =====================================================================
   npm run dev  ·  arranque independiente del proyecto nuevo
   ---------------------------------------------------------------------
   Levanta, con un solo comando y SIN el proyecto anterior:
     · API (Node/Express) en  http://localhost:4100   (PostgreSQL / Supabase)
     · Frontend Angular en     http://localhost:4200   (proxy /api → 4100)
   Antes prepara lo necesario: .env, dependencias y migraciones/datos demo.
   ===================================================================== */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACK = path.join(RAIZ, "backend");
const FRONT = path.join(RAIZ, "frontend-angular");
const WIN = process.platform === "win32";
const NPM = WIN ? "npm.cmd" : "npm";
const PUERTO_API = process.env.PORT || "4100";
const PUERTO_WEB = process.env.FRONT_PORT || "4200";

const c = (n, t) => `\x1b[${n}m${t}\x1b[0m`;
const info = (t) => console.log(c(36, "› ") + t);
const falla = (t) => { console.error(c(31, "✖ ") + t); process.exit(1); };

/* 1) Versión de Node que exige Angular 22 */
const [ma, mi, pa] = process.versions.node.split(".").map(Number);
const okNode = ma > 24 || (ma === 24 && mi >= 15) || (ma === 22 && (mi > 22 || (mi === 22 && pa >= 3))) || ma >= 26;
if (!okNode) falla(`Angular 22 requiere Node 22.22.3+, 24.15+ o 26+. Tienes ${process.versions.node}.`);

/* 2) Archivo .env del backend */
const env = path.join(BACK, ".env");
if (!fs.existsSync(env)) {
  fs.copyFileSync(path.join(BACK, ".env.example"), env);
  info("Se creó backend/.env desde .env.example (ajusta DATABASE_URL si usas Supabase).");
}

/* 3) Dependencias */
const instalar = (dir, nombre) => {
  if (fs.existsSync(path.join(dir, "node_modules"))) return;
  info(`Instalando dependencias de ${nombre}…`);
  const r = spawnSync(NPM, ["install", "--no-audit", "--no-fund"], { cwd: dir, stdio: "inherit", shell: WIN });
  if (r.status !== 0) falla(`npm install falló en ${nombre}.`);
};
instalar(BACK, "backend");
instalar(FRONT, "frontend-angular");

/* 4) Base de datos: migraciones + datos demo si está vacía */
info("Preparando la base de datos…");
const db = spawnSync(process.execPath, ["src/db/ensure.js"], { cwd: BACK, stdio: "inherit" });
if (db.status !== 0) {
  falla(
    "No hay conexión con PostgreSQL.\n" +
      "   · Local con Docker:   docker compose up -d db      (puerto 5433, base bienestar_ejecutivo)\n" +
      "   · Supabase:           pega la cadena «Session pooler» en DATABASE_URL de backend/.env\n" +
      "   Luego vuelve a ejecutar:  npm run dev"
  );
}

/* 5) Procesos */
const hijos = [];
const lanzar = (nombre, color, cmd, args, cwd, extraEnv = {}) => {
  const p = spawn(cmd, args, { cwd, shell: WIN, env: { ...process.env, ...extraEnv }, stdio: ["ignore", "pipe", "pipe"] });
  const pref = c(color, `[${nombre}]`);
  const salida = (flujo) => flujo.on("data", (b) => String(b).split(/\r?\n/).filter(Boolean).forEach((l) => console.log(`${pref} ${l}`)));
  salida(p.stdout); salida(p.stderr);
  p.on("exit", (code) => { if (code) { console.error(`${pref} terminó con código ${code}`); cerrar(code); } });
  hijos.push(p);
};
let cerrando = false;
function cerrar(code = 0) {
  if (cerrando) return; cerrando = true;
  for (const h of hijos) { try { WIN ? spawnSync("taskkill", ["/pid", String(h.pid), "/T", "/F"]) : h.kill("SIGTERM"); } catch { /* ya cerrado */ } }
  setTimeout(() => process.exit(code), 300);
}
process.on("SIGINT", () => cerrar(0));
process.on("SIGTERM", () => cerrar(0));

info(`Iniciando API (:${PUERTO_API}) y Angular (:${PUERTO_WEB})…`);
lanzar("api", 35, process.execPath, ["--watch", "src/index.js"], BACK, { PORT: PUERTO_API });
lanzar("web", 32, NPM, ["exec", "--", "ng", "serve", "--port", PUERTO_WEB, "--proxy-config", "proxy.conf.cjs"], FRONT, { API_PORT: PUERTO_API });
console.log("\n" + c(1, `  Abre http://localhost:${PUERTO_WEB}`) + "  ·  usuarios demo: admin@ica.demo / admin123 · evaluador@ica.demo / 1234\n");
