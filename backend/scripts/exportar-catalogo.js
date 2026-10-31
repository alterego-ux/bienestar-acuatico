/* =====================================================================
   Exporta js/data.js → backend/data/catalogo-ica.json
   Es la única fuente de verdad de los catálogos ICA del prototipo.
   Uso: node scripts/exportar-catalogo.js
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..", "..");
const origen = path.join(raiz, "js", "data.js");
const destino = path.resolve(__dirname, "..", "data", "catalogo-ica.json");

if (!fs.existsSync(origen)) {
  console.error(`No se encontró ${origen}`);
  process.exit(1);
}

const fuente = fs.readFileSync(origen, "utf8");

// data.js declara const a nivel superior; exponemos las que necesitamos.
const nombres = [
  "DEPTOS", "TIPOS_PRODUCTOR", "SISTEMAS", "DENSIDADES", "ESTADOS",
  "MEDIDAS", "PESOS_BASE", "LIBERTADES", "ESPECIES_BASE", "ROLES",
  "IND", "ESPECIES_REF", "LIB_INFO", "ETAPAS", "CLASES", "AYUDA",
];

const contexto = {};
vm.createContext(contexto);
vm.runInContext(
  fuente + "\n" + nombres.map((n) => `globalThis.${n} = typeof ${n} !== "undefined" ? ${n} : undefined;`).join("\n"),
  contexto,
  { filename: "data.js" }
);

const { DEPTOS, TIPOS_PRODUCTOR, SISTEMAS, DENSIDADES, MEDIDAS, PESOS_BASE, LIBERTADES, ESPECIES_BASE, ROLES, IND, ESPECIES_REF, LIB_INFO, ETAPAS, CLASES } = contexto;

/** Convierte "24 - 29 °C" u "8 - 8,5 mg/L" a un par numérico aproximado. */
function rangoNumeros(txt) {
  if (!txt) return [null, null];
  const nums = String(txt).match(/\d+([.,]\d+)?/g);
  if (!nums) return [null, null];
  const vals = nums.map((n) => parseFloat(n.replace(",", ".")));
  if (vals.length === 1) return [vals[0], vals[0]];
  return [vals[0], vals[1]];
}
function primerNumero(txt) {
  if (!txt) return null;
  const m = String(txt).match(/\d+([.,]\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : null;
}

// ---------- Constructores del JSON ----------
const metadatos = {
  generadoDesde: "js/data.js",
  generadoEn: new Date().toISOString(),
  metodologia: "ICA v2.0 (2024)",
  nota: "Prototipo académico. No es una herramienta oficial del ICA. 23 indicadores PMG / 15 AREL.",
};

const departamentos = Object.entries(DEPTOS).map(([nombre, municipios]) => ({ nombre, municipios }));

const tiposProductor = TIPOS_PRODUCTOR.map((nombre) => ({
  nombre,
  modalidad: /subsistencia|AREL/i.test(nombre) ? "AREL" : "PMG",
}));

const sistemas = SISTEMAS.map((nombre) => ({ nombre, densidad_ref: DENSIDADES[nombre] || "" }));

const tiposMedida = Object.entries(MEDIDAS).map(([codigo, v]) => ({
  codigo,
  nombre: v.n,
  descripcion: v.full,
  color: v.c,
}));

const modalidades = Object.entries(PESOS_BASE).map(([codigo, p]) => ({
  codigo,
  nombre: codigo === "AREL" ? "Acuicultura de subsistencia y AREL" : "Pequeños, medianos y grandes acuicultores",
  pesos: { MBR: p.MBR, MBA: p.MBA, MBG: p.MBG },
}));

const categorias = CLASES.map((c) => ({
  nombre: c.n,
  min_pct: c.a,
  max_pct: c.b,
  color: c.c,
  descripcion: c.d,
}));

const libertades = LIBERTADES.map((nombre) => {
  const bajo = nombre.toLowerCase();
  const info = (LIB_INFO || []).find((x) => bajo.includes(String(x.k).toLowerCase()));
  return { nombre, descripcion: info ? info.d : "" };
});

const indicadores = IND.map((i, idx) => ({
  codigo: i.id,
  tipo_medida: i.t,
  nombre: i.n,
  descripcion: i.lib,
  pregunta: i.q || "",
  metodo: i.met || "",
  no_aplica: i.na || "",
  recomendacion: i.rec || "",
  aplica_pmg: true,
  aplica_arel: !!i.arel,
  calculadora: i.calc || null,
  orden: idx,
  libertades: String(i.lib || "").split("·").map((s) => s.trim()).filter(Boolean),
  niveles: (i.lv || []).map(([puntaje, descripcion]) => ({ puntaje, descripcion })),
}));

const especies = ESPECIES_BASE.map((e) => {
  const ref = (ESPECIES_REF || []).find((r) => r.id === e.id);
  const [tmin, tmax] = rangoNumeros(e.temp);
  const mort = e.mort || "";
  const esCachama = e.id === "cachama";
  return {
    codigo: e.id,
    nombre_comun: e.n,
    nombre_cientifico: ref ? ref.d.split(";")[0] : "",
    tipo_agua: ref ? ref.tipo : "",
    temp_min: tmin,
    temp_max: tmax,
    od_min: primerNumero(e.od),
    ph_min: primerNumero(e.ph),
    turbidez_ref: e.turb || "",
    // El biofloc no se modela aquí; se marca aplicable salvo especies sin turbidez.
    turbidez_aplica: !/N\/A|no aplica/i.test(e.turb || ""),
    mortalidad_100: esCachama ? 1 : 10,
    mortalidad_55: esCachama ? 2 : 12,
    mortalidad_20: esCachama ? 3 : 15,
    mortalidad_txt: mort,
    activo: !!e.act,
  };
});

// ---------- Reglas (derivadas de las constantes del prototipo) ----------
const reglasMuestreo = [
  { modalidad: "PMG", min_lotes: 1, max_lotes: 3, lotes_a_muestrear: null, nota: "Menos de 4 lotes: se evalúan todos (valor nulo = todos)." },
  { modalidad: "PMG", min_lotes: 4, max_lotes: 9, lotes_a_muestrear: 3, nota: "De 4 a 9 lotes: se evalúan 3." },
  { modalidad: "PMG", min_lotes: 10, max_lotes: null, lotes_a_muestrear: 4, nota: "Más de 9 lotes: se evalúan 4." },
  { modalidad: "AREL", min_lotes: 1, max_lotes: 3, lotes_a_muestrear: null, nota: "Tabla 30: con menos de cuatro lotes se evalúan todos (valor nulo = todos)." },
  { modalidad: "AREL", min_lotes: 4, max_lotes: null, lotes_a_muestrear: null, nota: "La tabla 30 consultada solo documenta el caso de menos de cuatro lotes; el criterio para 4 o más requiere verificación metodológica." },
];

const reglasProfundidad = [
  { modalidad: "PMG", es_jaula: false, min_m: 0.6, max_m: 1.5, nota: "Rango general de referencia." },
  { modalidad: "PMG", es_jaula: true, min_m: 2, max_m: 5, nota: "Tabla 13: jaulas 2–5 m." },
  { modalidad: "AREL", es_jaula: false, min_m: 0.6, max_m: 1.5, nota: "Tabla 40: 0,6–1,5 m." },
];

const reglasMortalidad = especies.map((e) => ({
  especie: e.codigo,
  modalidad: null,
  umbral_100: e.mortalidad_100,
  umbral_55: e.mortalidad_55,
  umbral_20: e.mortalidad_20,
}));

const catalogo = {
  metadatos,
  departamentos,
  tiposProductor,
  sistemas,
  tiposMedida,
  modalidades,
  categorias,
  libertades,
  indicadores,
  especies,
  reglasMuestreo,
  reglasProfundidad,
  reglasMortalidad,
  etapas: ETAPAS || [],
  roles: Object.entries(ROLES || {}).map(([codigo, r]) => ({ codigo, nombre: r.n, descripcion: r.d })),
};

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(catalogo, null, 2), "utf8");

console.log(`Catálogo exportado a ${destino}`);
console.log(
  `  · ${indicadores.length} indicadores · ${especies.length} especies · ${libertades.length} libertades · ${departamentos.length} departamentos`
);
