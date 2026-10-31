/* =====================================================================
   Seed · carga catálogos ICA desde data/catalogo-ica.json e inserta
   datos de demostración (usuarios, predios y evaluaciones).
   Idempotente: puede ejecutarse varias veces sin duplicar.
   Uso: node src/db/seed.js        (tras `npm run migrate`)
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, transaccion } from "../config/db.js";
import { hashear } from "../utils/password.js";
import { calcular } from "../domain/calculo.js";
import { clasificar } from "../domain/clasificacion.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_CATALOGO = path.resolve(__dirname, "..", "..", "data", "catalogo-ica.json");

function leerCatalogo() {
  if (!fs.existsSync(RUTA_CATALOGO)) {
    throw new Error(
      `No se encontró ${RUTA_CATALOGO}. Ejecuta primero: node scripts/exportar-catalogo.js`
    );
  }
  return JSON.parse(fs.readFileSync(RUTA_CATALOGO, "utf8"));
}

// ---------- Utilidades de id ----------
const mapIds = (rows, campo, id) => new Map(rows.map((r) => [r[campo], r[id]]));

async function cargarCatalogo(db, cat) {
  // Especies
  for (const e of cat.especies) {
    await db.query(
      `INSERT INTO especie (codigo, nombre_comun, nombre_cientifico, tipo_agua, temp_min, temp_max,
         od_min, ph_min, turbidez_ref, turbidez_aplica, mortalidad_100, mortalidad_55, mortalidad_20,
         mortalidad_txt, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (codigo) DO UPDATE SET
         nombre_comun=EXCLUDED.nombre_comun, temp_min=EXCLUDED.temp_min, temp_max=EXCLUDED.temp_max,
         od_min=EXCLUDED.od_min, ph_min=EXCLUDED.ph_min, turbidez_ref=EXCLUDED.turbidez_ref,
         mortalidad_100=EXCLUDED.mortalidad_100, mortalidad_55=EXCLUDED.mortalidad_55,
         mortalidad_20=EXCLUDED.mortalidad_20, mortalidad_txt=EXCLUDED.mortalidad_txt,
         activo=EXCLUDED.activo`,
      [
        e.codigo, e.nombre_comun, e.nombre_cientifico, e.tipo_agua, e.temp_min, e.temp_max,
        e.od_min, e.ph_min, e.turbidez_ref, e.turbidez_aplica, e.mortalidad_100,
        e.mortalidad_55, e.mortalidad_20, e.mortalidad_txt, e.activo,
      ]
    );
  }

  const { rows: med } = await db.query("SELECT id, codigo FROM tipo_medida");
  const idMedida = mapIds(med, "codigo", "id");
  const { rows: lib } = await db.query("SELECT id, nombre FROM libertad");
  const idLibertad = mapIds(lib, "nombre", "id");
  const { rows: mod } = await db.query("SELECT id, codigo FROM modalidad");
  const idModalidad = mapIds(mod, "codigo", "id");
  const { rows: esp } = await db.query("SELECT id, codigo FROM especie");
  const idEspecie = mapIds(esp, "codigo", "id");

  // Indicadores + libertades + niveles
  const idIndicador = new Map();
  for (const i of cat.indicadores) {
    const { rows } = await db.query(
      `INSERT INTO indicador (codigo, tipo_medida_id, nombre, descripcion, pregunta, metodo,
         no_aplica, recomendacion, aplica_pmg, aplica_arel, calculadora, orden)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (codigo) DO UPDATE SET
         tipo_medida_id=EXCLUDED.tipo_medida_id, nombre=EXCLUDED.nombre, descripcion=EXCLUDED.descripcion,
         pregunta=EXCLUDED.pregunta, metodo=EXCLUDED.metodo, no_aplica=EXCLUDED.no_aplica,
         recomendacion=EXCLUDED.recomendacion, aplica_pmg=EXCLUDED.aplica_pmg,
         aplica_arel=EXCLUDED.aplica_arel, calculadora=EXCLUDED.calculadora, orden=EXCLUDED.orden
       RETURNING id`,
      [
        i.codigo, idMedida.get(i.tipo_medida), i.nombre, i.descripcion, i.pregunta, i.metodo,
        i.no_aplica, i.recomendacion, i.aplica_pmg, i.aplica_arel, i.calculadora, i.orden,
      ]
    );
    const indId = rows[0].id;
    idIndicador.set(i.codigo, indId);

    await db.query("DELETE FROM indicador_nivel WHERE indicador_id=$1", [indId]);
    let orden = 0;
    for (const nv of i.niveles) {
      await db.query(
        "INSERT INTO indicador_nivel (indicador_id, puntaje, descripcion, orden) VALUES ($1,$2,$3,$4)",
        [indId, nv.puntaje, nv.descripcion, orden++]
      );
    }

    await db.query("DELETE FROM indicador_libertad WHERE indicador_id=$1", [indId]);
    for (const nombreLib of i.libertades) {
      // Los indicadores nombran la 5.ª libertad «Comportamiento natural»; en el catálogo es «Manifestar un comportamiento natural».
      const lid = idLibertad.get(nombreLib) || idLibertad.get(nombreLib === "Comportamiento natural" ? "Manifestar un comportamiento natural" : nombreLib);
      if (lid) {
        await db.query(
          "INSERT INTO indicador_libertad (indicador_id, libertad_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
          [indId, lid]
        );
      }
    }
  }

  // Reglas de muestreo / profundidad / mortalidad
  await db.query("DELETE FROM regla_muestreo");
  for (const r of cat.reglasMuestreo) {
    await db.query(
      `INSERT INTO regla_muestreo (modalidad_id, min_lotes, max_lotes, lotes_a_muestrear, nota)
       VALUES ($1,$2,$3,$4,$5)`,
      [idModalidad.get(r.modalidad), r.min_lotes, r.max_lotes, r.lotes_a_muestrear, r.nota]
    );
  }

  await db.query("DELETE FROM regla_profundidad");
  for (const r of cat.reglasProfundidad) {
    await db.query(
      `INSERT INTO regla_profundidad (modalidad_id, es_jaula, min_m, max_m, nota)
       VALUES ($1,$2,$3,$4,$5)`,
      [idModalidad.get(r.modalidad), r.es_jaula, r.min_m, r.max_m, r.nota]
    );
  }

  await db.query("DELETE FROM regla_mortalidad");
  for (const r of cat.reglasMortalidad) {
    const eid = idEspecie.get(r.especie);
    if (!eid) continue;
    await db.query(
      `INSERT INTO regla_mortalidad (especie_id, modalidad_id, umbral_100, umbral_55, umbral_20)
       VALUES ($1,$2,$3,$4,$5)`,
      [eid, r.modalidad ? idModalidad.get(r.modalidad) : null, r.umbral_100, r.umbral_55, r.umbral_20]
    );
  }

  return { idMedida, idIndicador, idModalidad, idEspecie };
}

// ---------- Datos de demostración ----------
const USUARIOS_DEMO = [
  { n: "Administrador ICA", e: "admin@ica.demo", p: "admin123", r: "admin", a: true },
  { n: "Paola Valencia", e: "docente@ica.demo", p: "docente123", r: "docente", a: true },
  { n: "Olegario López", e: "evaluador@ica.demo", p: "1234", r: "evaluador", a: true },
  { n: "Consultor Externo", e: "consultor@ica.demo", p: "consultor123", r: "consultor", a: true },
  { n: "Juan Pérez", e: "juan.perez@ejemplo.com", p: "1234", r: "evaluador", a: true },
  { n: "Ana Gómez", e: "ana.gomez@ejemplo.com", p: "1234", r: "evaluador", a: true },
  { n: "Oscar Reyes", e: "oscar.reyes@ejemplo.com", p: "1234", r: "evaluador", a: false },
];

async function cargarUsuarios(db) {
  const { rows: roles } = await db.query("SELECT id, codigo FROM rol");
  const idRol = mapIds(roles, "codigo", "id");
  const ids = {};
  for (const u of USUARIOS_DEMO) {
    const hash = await hashear(u.p);
    const { rows } = await db.query(
      `INSERT INTO usuario (nombre, email, password_hash, rol_id, activo)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO UPDATE SET nombre=EXCLUDED.nombre, rol_id=EXCLUDED.rol_id, activo=EXCLUDED.activo
       RETURNING id`,
      [u.n, u.e, hash, idRol.get(u.r), u.a]
    );
    ids[u.e] = rows[0].id;
  }
  return ids;
}

const PREDIOS_DEMO = [
  {
    cod: "PRD-0001", n: "Finca El Paraíso", resp: "Carlos Rodríguez", mail: "paraiso@ejemplo.com",
    tipo: "Pequeño acuicultor", sis: ["Estanque"], dep: "Cundinamarca", mun: "Silvania",
    ver: "La Esperanza", dir: "Km 3 vía Fusagasugá", lat: 4.4036, lng: -74.3961,
    inv: [{ esp: "tilapia", cant: 12000, peso: 320, lotes: 6 }],
  },
  {
    cod: "PRD-0002", n: "Piscícola La Esperanza", resp: "María Torres", mail: "laesperanza@ejemplo.com",
    tipo: "Mediano acuicultor", sis: ["Jaulas flotantes", "Estanque"], dep: "Meta", mun: "Granada",
    ver: "El Triunfo", dir: "Finca La Esperanza", lat: null, lng: null,
    inv: [{ esp: "cachama", cant: 30000, peso: 450, lotes: 10 }],
  },
  {
    cod: "PRD-0003", n: "Truchas San José", resp: "Luis Martínez", mail: "sanjose@ejemplo.com",
    tipo: "Acuicultura de recursos limitados (AREL)", sis: ["Tanques en geomembrana"], dep: "Boyacá",
    mun: "Garagoa", ver: "San José", dir: "Vereda San José", lat: null, lng: null,
    inv: [{ esp: "trucha", cant: 2500, peso: 180, lotes: 3 }],
  },
  {
    // Predio con DOS especies: cada una se evalúa por separado y con su propio muestreo
    // (cachama: 5 lotes → se evalúan 3 · tilapia: 12 lotes → se evalúan 4).
    cod: "PRD-0004", n: "Piscícola El Remanso", resp: "Marta Gómez", mail: "remanso@ejemplo.com",
    tipo: "Mediano acuicultor", sis: ["Estanque"], dep: "Meta",
    mun: "Villavicencio", ver: "El Remanso", dir: "Vereda El Remanso", lat: null, lng: null,
    inv: [
      { esp: "cachama", cant: 15000, peso: 380, lotes: 5 },
      { esp: "tilapia", cant: 24000, peso: 290, lotes: 12 },
    ],
  },
];

async function cargarPredios(db, idEspecie) {
  const { rows: tp } = await db.query("SELECT id, nombre FROM tipo_productor");
  const idTipo = mapIds(tp, "nombre", "id");
  const { rows: dp } = await db.query("SELECT id, nombre FROM departamento");
  const idDep = mapIds(dp, "nombre", "id");
  const { rows: mu } = await db.query("SELECT id, nombre, departamento_id FROM municipio");
  const idMun = new Map(mu.map((r) => [`${r.departamento_id}|${r.nombre}`, r.id]));
  const { rows: si } = await db.query("SELECT id, nombre FROM sistema_productivo");
  const idSis = mapIds(si, "nombre", "id");

  const ids = {};
  for (const p of PREDIOS_DEMO) {
    const depId = idDep.get(p.dep);
    const munId = idMun.get(`${depId}|${p.mun}`);
    const { rows } = await db.query(
      `INSERT INTO predio (codigo, nombre, responsable, email, tipo_productor_id, departamento_id,
         municipio_id, vereda, direccion, latitud, longitud, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
       ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, responsable=EXCLUDED.responsable,
         email=EXCLUDED.email, tipo_productor_id=EXCLUDED.tipo_productor_id,
         departamento_id=EXCLUDED.departamento_id, municipio_id=EXCLUDED.municipio_id,
         vereda=EXCLUDED.vereda, direccion=EXCLUDED.direccion
       RETURNING id`,
      [p.cod, p.n, p.resp, p.mail, idTipo.get(p.tipo), depId, munId, p.ver, p.dir, p.lat, p.lng]
    );
    const pid = rows[0].id;
    ids[p.cod] = pid;

    await db.query("DELETE FROM predio_sistema WHERE predio_id=$1", [pid]);
    for (const s of p.sis) {
      if (idSis.get(s)) {
        await db.query(
          "INSERT INTO predio_sistema (predio_id, sistema_productivo_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
          [pid, idSis.get(s)]
        );
      }
    }

    await db.query("DELETE FROM lote_predio WHERE predio_id=$1", [pid]);
    for (const l of p.inv) {
      await db.query(
        "INSERT INTO lote_predio (predio_id, especie_id, cantidad, peso_promedio_g, numero_lotes) VALUES ($1,$2,$3,$4,$5)",
        [pid, idEspecie.get(l.esp), l.cant, l.peso, l.lotes]
      );
    }
  }
  return ids;
}

// Puntajes de ejemplo (mismo arreglo que js/storage.js)
const A = [100,100,55,55,100,null,20,100,null,20,55,100,100,100,55,100,55,100,100,100,100,100,100];
const B = [100,20,55,55,55,null,100,55,null,55,100,100,100,100,100,55,100,100,100,55,55,55,100];
const C = [55,100,100,100,100,null,100,55,null,100,55,100,100,100,100,55,100,100,100,100,100,100,100];
const D = [100,100,55,100,100,null,100,100,null,100,100,55,null,100,100,100,100,100,100,100,100,100,100];
const AR = [100,55,100,100,100,100,100,55,100,55,100,55,55,55,20];

const EVALS_DEMO = [
  { cod: "e1", predio: "PRD-0001", fecha: "2026-05-25", ev: "juan.perez@ejemplo.com", reg: "PMG", esp: "tilapia", arr: A, est: "cerrada", lotes: 6 },
  { cod: "e2", predio: "PRD-0001", fecha: "2026-06-16", ev: "ana.gomez@ejemplo.com", reg: "PMG", esp: "tilapia", arr: B, est: "validada", lotes: 6 },
  { cod: "e3", predio: "PRD-0001", fecha: "2026-08-30", ev: "oscar.reyes@ejemplo.com", reg: "PMG", esp: "tilapia", arr: C, est: "cerrada", lotes: 6 },
  { cod: "e4", predio: "PRD-0002", fecha: "2026-09-10", ev: "juan.perez@ejemplo.com", reg: "PMG", esp: "cachama", arr: D, est: "finalizada", lotes: 10 },
  { cod: "e5", predio: "PRD-0003", fecha: "2026-10-02", ev: "evaluador@ica.demo", reg: "AREL", esp: "trucha", arr: AR, est: "en_proceso", lotes: 3, parcial: ["AN01","AN02","AN03","AN04","AN06","GE02","GE05","RE08","RE07"] },
];

async function cargarEvaluaciones(db, ids) {
  const { rows: inds } = await db.query(
    `SELECT i.id, i.codigo, tm.codigo AS tipo_medida
       FROM indicador i JOIN tipo_medida tm ON tm.id = i.tipo_medida_id
      WHERE i.aplica_pmg = TRUE ORDER BY i.orden`
  );
  const { rows: indsArel } = await db.query(
    `SELECT i.id, i.codigo, tm.codigo AS tipo_medida
       FROM indicador i JOIN tipo_medida tm ON tm.id = i.tipo_medida_id
      WHERE i.aplica_arel = TRUE ORDER BY i.orden`
  );
  const { rows: niveles } = await db.query("SELECT indicador_id, puntaje FROM indicador_nivel");
  const nivelesPorInd = new Map();
  for (const n of niveles) {
    if (!nivelesPorInd.has(n.indicador_id)) nivelesPorInd.set(n.indicador_id, []);
    nivelesPorInd.get(n.indicador_id).push({ puntaje: n.puntaje });
  }
  const { rows: mods } = await db.query("SELECT id, codigo, peso_mbr, peso_mba, peso_mbg FROM modalidad");
  const idModalidad = mapIds(mods, "codigo", "id");
  const pesosMod = new Map(mods.map((m) => [m.codigo, { MBR: +m.peso_mbr, MBA: +m.peso_mba, MBG: +m.peso_mbg }]));

  for (const ev of EVALS_DEMO) {
    const lista = ev.reg === "AREL" ? indsArel : inds;
    const respuestas = {};
    lista.forEach((ind, k) => {
      const v = ev.arr[k];
      const esParcial = ev.parcial && ev.parcial.includes(ind.codigo);
      respuestas[ind.id] = esParcial ? null : { puntaje: v === null ? null : v, no_aplica: v === null };
    });
    const indicadoresCalc = lista.map((ind) => ({
      id: ind.id,
      codigo: ind.codigo,
      tipo_medida: ind.tipo_medida,
      niveles: nivelesPorInd.get(ind.id) || [],
    }));
    const c = calcular({ indicadores: indicadoresCalc, respuestas, pesos: pesosMod.get(ev.reg) });

    const predioId = ids.predios[ev.predio];
    const evaluadorId = ids.usuarios[ev.ev];
    const especieId = ids.especies[ev.esp];
    const { rows } = await db.query(
      `INSERT INTO evaluacion (predio_id, evaluador_id, modalidad_id, especie_id, fecha,
         evaluador_nombre, lotes_sembrados, estado, puntaje_global, clasificacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        predioId, evaluadorId, idModalidad.get(ev.reg), especieId, ev.fecha,
        (USUARIOS_DEMO.find((u) => u.e === ev.ev) || {}).n || ev.ev,
        ev.lotes, ev.est, c.isFinal ? Number(c.total.toFixed(2)) : null,
        c.isFinal ? clasificar(c.total) : null,
      ]
    );
    const evalId = rows[0].id;
    ids.evaluaciones = ids.evaluaciones || {};
    ids.evaluaciones[ev.cod] = evalId;

    const nLotes = ev.lotes;
    const sel = [];
    if (ev.reg === "AREL") sel.push("Lote 1", "Lote 2", "Lote 3");
    else sel.push("Lote 1", "Lote 2", "Lote 3");
    for (const nombre of sel) {
      await db.query(
        "INSERT INTO evaluacion_lote (evaluacion_id, nombre_lote) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [evalId, nombre]
      );
    }

    for (const [indId, r] of Object.entries(respuestas)) {
      const { rows: rr } = await db.query(
        `INSERT INTO respuesta_indicador (evaluacion_id, indicador_id, puntaje, no_aplica, observacion)
         VALUES ($1,$2,$3,$4,'')
         ON CONFLICT (evaluacion_id, indicador_id) DO UPDATE SET puntaje=EXCLUDED.puntaje, no_aplica=EXCLUDED.no_aplica
         RETURNING id`,
        [evalId, indId, r && r.puntaje !== undefined ? r.puntaje : null, !!(r && r.no_aplica)]
      );
      void rr;
    }
    void nLotes;
    void predioId;
    void evaluadorId;
    void especieId;
  }
}

export async function sembrar({ silencioso = false } = {}) {
  const log = (...a) => !silencioso && console.log(...a);
  const cat = leerCatalogo();

  await transaccion(async (db) => {
    log("→ Catálogos ICA (especies, indicadores, niveles, libertades, reglas)…");
    const { idEspecie } = await cargarCatalogo(db, cat);

    log("→ Usuarios de demostración…");
    const usuarios = await cargarUsuarios(db);

    log("→ Predios y lotes de demostración…");
    const predios = await cargarPredios(db, idEspecie);

    log("→ Evaluaciones de demostración…");
    await cargarEvaluaciones(db, { usuarios, predios, especies: idEspecie });
  });

  log("Semilla aplicada correctamente.");
}

if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  sembrar()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Fallo de la semilla:", err.message);
      pool.end().finally(() => process.exit(1));
    });
}

export default sembrar;
