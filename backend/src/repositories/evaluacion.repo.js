/* =====================================================================
   Repositorio · evaluación (cabecera, lotes, muestreo, respuestas,
   recomendaciones y plan de mejora)
   ===================================================================== */
import { query, transaccion } from "../config/db.js";

const SELECT_EVAL = `
  SELECT e.id, e.predio_id, e.evaluador_id, e.modalidad_id, e.especie_id, e.fecha,
         e.evaluador_nombre AS ev, e.lotes_sembrados AS lotes, e.estado AS est,
         e.puntaje_global, e.clasificacion, e.etapa_visita, e.creado_en AS cr, e.actualizado_en AS up,
         m.codigo AS reg, p.nombre AS predio_nombre, p.codigo AS predio_codigo, p.responsable AS predio_responsable,
         esp.codigo AS esp_codigo, esp.nombre_comun AS esp,
         u.nombre AS evaluador
    FROM evaluacion e
    JOIN predio p ON p.id = e.predio_id
    JOIN modalidad m ON m.id = e.modalidad_id
    LEFT JOIN especie esp ON esp.id = e.especie_id
    JOIN usuario u ON u.id = e.evaluador_id`;

async function hidratar(lista) {
  if (!lista.length) return lista;
  const ids = lista.map((e) => e.id);
  const { rows: lotes } = await query(
    "SELECT evaluacion_id, nombre_lote FROM evaluacion_lote WHERE evaluacion_id = ANY($1::int[]) ORDER BY id",
    [ids]
  );
  const { rows: resp } = await query(
    `SELECT r.id, r.evaluacion_id, r.indicador_id, r.puntaje, r.no_aplica, r.observacion,
            i.codigo AS ind_codigo
       FROM respuesta_indicador r JOIN indicador i ON i.id = r.indicador_id
      WHERE r.evaluacion_id = ANY($1::int[])`,
    [ids]
  );
  const { rows: calc } = await query(
    `SELECT rc.respuesta_id, rc.clave, rc.valor
       FROM respuesta_calculo rc
       JOIN respuesta_indicador r ON r.id = rc.respuesta_id
      WHERE r.evaluacion_id = ANY($1::int[])`,
    [ids]
  );
  const { rows: evid } = await query(
    `SELECT ev.respuesta_id, ev.id, ev.nombre_archivo AS name, ev.tipo_mime AS type, ev.tamano_bytes AS size
       FROM evidencia ev JOIN respuesta_indicador r ON r.id = ev.respuesta_id
      WHERE r.evaluacion_id = ANY($1::int[])`,
    [ids]
  );
  const { rows: muestreo } = await query(
    "SELECT * FROM evaluacion_muestreo WHERE evaluacion_id = ANY($1::int[]) ORDER BY id",
    [ids]
  );
  const { rows: recs } = await query(
    `SELECT r.id, r.evaluacion_id, r.indicador_id, r.titulo AS n, r.texto AS t, r.puntaje_ref AS sc, r.orden,
            i.codigo AS ind_codigo
       FROM recomendacion r LEFT JOIN indicador i ON i.id = r.indicador_id
      WHERE r.evaluacion_id = ANY($1::int[]) ORDER BY r.orden`,
    [ids]
  );
  const { rows: plan } = await query(
    `SELECT id, evaluacion_id, accion AS a, responsable AS r, prioridad AS p, plazo AS d, completado
       FROM plan_mejora WHERE evaluacion_id = ANY($1::int[]) ORDER BY id`,
    [ids]
  );
  const porEv = (arr) => {
    const m = new Map();
    for (const x of arr) {
      if (!m.has(x.evaluacion_id)) m.set(x.evaluacion_id, []);
      m.get(x.evaluacion_id).push(x);
    }
    return m;
  };
  const mLotes = porEv(lotes);
  const mResp = porEv(resp);
  const mCalc = new Map();
  for (const c of calc) {
    if (!mCalc.has(c.respuesta_id)) mCalc.set(c.respuesta_id, {});
    mCalc.get(c.respuesta_id)[c.clave] = c.valor;
  }
  const mEvid = new Map();
  for (const v of evid) {
    if (!mEvid.has(v.respuesta_id)) mEvid.set(v.respuesta_id, []);
    mEvid.get(v.respuesta_id).push({ id: v.id, name: v.name, type: v.type, size: v.size });
  }
  const mMuestreo = porEv(muestreo);
  const mRecs = porEv(recs);
  const mPlan = porEv(plan);

  return lista.map((e) => {
    const respuestas = {};
    for (const r of mResp.get(e.id) || []) {
      respuestas[r.ind_codigo] = {
        id: r.id,
        indicador_id: r.indicador_id,
        score: r.no_aplica ? "NA" : r.puntaje,
        puntaje: r.puntaje,
        no_aplica: r.no_aplica,
        obs: r.observacion,
        calc: mCalc.get(r.id) || {},
        evid: mEvid.get(r.id) || [],
      };
    }
    const mu = (mMuestreo.get(e.id) || [])[0];
    return {
      ...e,
      sel: (mLotes.get(e.id) || []).map((l) => l.nombre_lote),
      resp: respuestas,
      peces: mu
        ? { espId: mu.especie_id, cant: mu.cantidad_evaluada, peso: mu.peso_promedio_g, lote: mu.lote_ref }
        : null,
      recs: (mRecs.get(e.id) || []).map((r) => ({ id: r.ind_codigo || r.titulo, n: r.n, t: r.t, sc: r.sc })),
      plan: (mPlan.get(e.id) || []).map((a) => ({ id: a.id, a: a.a, r: a.r, p: a.p, d: a.d, completado: a.completado })),
    };
  });
}

export async function listar({ predioId, estado, desde, hasta, modalidad, limite } = {}) {
  const cond = [];
  const params = [];
  const add = (sql, val) => {
    params.push(val);
    cond.push(sql.replace("?", `$${params.length}`));
  };
  if (predioId) add("e.predio_id = ?", predioId);
  if (estado) add("e.estado = ?", estado);
  if (desde) add("e.fecha >= ?", desde);
  if (hasta) add("e.fecha <= ?", hasta);
  if (modalidad) add("m.codigo = ?", modalidad);
  const where = cond.length ? `WHERE ${cond.join(" AND ")}` : "";
  const lim = limite ? `LIMIT ${Number(limite)}` : "";
  const { rows } = await query(`${SELECT_EVAL} ${where} ORDER BY e.fecha DESC, e.id DESC ${lim}`, params);
  return hidratar(rows);
}

export async function porId(id) {
  const { rows } = await query(`${SELECT_EVAL} WHERE e.id = $1`, [id]);
  if (!rows[0]) return null;
  const [e] = await hidratar(rows);
  return e;
}

export async function crear(datos) {
  return transaccion(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO evaluacion (predio_id, evaluador_id, modalidad_id, especie_id, fecha,
         evaluador_nombre, lotes_sembrados, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        datos.predioId, datos.evaluadorId, datos.modalidadId, datos.especieId, datos.fecha,
        datos.evaluadorNombre || "", datos.lotes || 0, datos.estado || "en_proceso",
      ]
    );
    const id = rows[0].id;
    for (const nombre of datos.sel || []) {
      await db.query(
        "INSERT INTO evaluacion_lote (evaluacion_id, nombre_lote) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [id, nombre]
      );
    }
    if (datos.peces && (datos.peces.cant || datos.peces.peso)) {
      await db.query(
        `INSERT INTO evaluacion_muestreo (evaluacion_id, especie_id, cantidad_evaluada, peso_promedio_g, lote_ref)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, datos.especieId, datos.peces.cant || 0, datos.peces.peso || 0, datos.peces.lote || ""]
      );
    }
    return id;
  });
}

export async function actualizarCabecera(id, campos) {
  const map = {
    fecha: "fecha", lotes: "lotes_sembrados", estado: "estado", etapa: "etapa_visita",
    puntaje: "puntaje_global", clasificacion: "clasificacion", modalidadId: "modalidad_id",
    especieId: "especie_id", evaluadorId: "evaluador_id",
  };
  const sets = [];
  const params = [id];
  for (const [k, col] of Object.entries(map)) {
    if (campos[k] !== undefined) {
      params.push(campos[k]);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (campos.cerrado) sets.push("cerrado_en = now()");
  if (!sets.length) return id;
  await query(`UPDATE evaluacion SET ${sets.join(", ")} WHERE id = $1`, params);
  return id;
}

export async function eliminar(id) {
  const { rowCount } = await query("DELETE FROM evaluacion WHERE id = $1", [id]);
  return rowCount > 0;
}

export async function reemplazarLotes(id, sel = []) {
  return transaccion(async (db) => {
    await db.query("DELETE FROM evaluacion_lote WHERE evaluacion_id=$1", [id]);
    for (const nombre of sel) {
      await db.query(
        "INSERT INTO evaluacion_lote (evaluacion_id, nombre_lote) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [id, nombre]
      );
    }
  });
}

export async function upsertRespuesta(evaluacionId, indicadorId, { puntaje, noAplica, observacion, calc }) {
  return transaccion(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO respuesta_indicador (evaluacion_id, indicador_id, puntaje, no_aplica, observacion)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (evaluacion_id, indicador_id) DO UPDATE SET
         puntaje = EXCLUDED.puntaje, no_aplica = EXCLUDED.no_aplica, observacion = EXCLUDED.observacion,
         actualizado_en = now()
       RETURNING id`,
      [evaluacionId, indicadorId, puntaje ?? null, !!noAplica, observacion || ""]
    );
    const respuestaId = rows[0].id;
    if (calc && typeof calc === "object") {
      await db.query("DELETE FROM respuesta_calculo WHERE respuesta_id = $1", [respuestaId]);
      for (const [clave, valor] of Object.entries(calc)) {
        await db.query(
          "INSERT INTO respuesta_calculo (respuesta_id, clave, valor) VALUES ($1,$2,$3)",
          [respuestaId, String(clave).slice(0, 40), String(valor ?? "").slice(0, 200)]
        );
      }
    }
    return respuestaId;
  });
}

export async function respuestasDe(evaluacionId) {
  const { rows } = await query(
    `SELECT r.id, r.indicador_id, i.codigo, r.puntaje, r.no_aplica, r.observacion
       FROM respuesta_indicador r JOIN indicador i ON i.id = r.indicador_id
      WHERE r.evaluacion_id = $1`,
    [evaluacionId]
  );
  return rows;
}

export async function reemplazarRecomendaciones(id, recomendaciones = []) {
  return transaccion(async (db) => {
    await db.query("DELETE FROM recomendacion WHERE evaluacion_id=$1", [id]);
    for (const r of recomendaciones) {
      await db.query(
        `INSERT INTO recomendacion (evaluacion_id, indicador_id, titulo, texto, puntaje_ref, orden)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, r.indicador_id || null, r.titulo, r.texto, r.puntaje_ref ?? null, r.orden || 0]
      );
    }
  });
}

export async function reemplazarPlan(id, plan = []) {
  return transaccion(async (db) => {
    await db.query("DELETE FROM plan_mejora WHERE evaluacion_id=$1", [id]);
    for (const a of plan) {
      await db.query(
        `INSERT INTO plan_mejora (evaluacion_id, accion, responsable, prioridad, plazo, completado)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, a.accion, a.responsable || "", a.prioridad || "Media", a.plazo || null, !!a.completado]
      );
    }
  });
}

export async function marcarItemPlan(evaluacionId, itemId, cambios = {}) {
  const { rows } = await query(
    `UPDATE plan_mejora SET
        accion = COALESCE($3, accion), responsable = COALESCE($4, responsable),
        prioridad = COALESCE($5, prioridad), plazo = COALESCE($6, plazo), completado = COALESCE($7, completado)
      WHERE id = $1 AND evaluacion_id = $2 RETURNING id`,
    [itemId, evaluacionId, cambios.accion ?? null, cambios.responsable ?? null, cambios.prioridad ?? null, cambios.plazo ?? null, cambios.completado ?? null]
  );
  return !!rows[0];
}

export async function agregados({ predioId, especieId } = {}) {
  const cond = ["e.estado IN ('finalizada','validada','cerrada')", "e.puntaje_global IS NOT NULL"];
  const params = [];
  if (predioId) { params.push(predioId); cond.push(`e.predio_id = $${params.length}`); }
  if (especieId) { params.push(especieId); cond.push(`e.especie_id = $${params.length}`); }
  const { rows } = await query(
    `SELECT e.id, e.fecha, e.puntaje_global, e.clasificacion, m.codigo AS modalidad,
            esp.nombre_comun AS especie, p.nombre AS predio
       FROM evaluacion e
       JOIN modalidad m ON m.id = e.modalidad_id
       JOIN predio p ON p.id = e.predio_id
       LEFT JOIN especie esp ON esp.id = e.especie_id
      WHERE ${cond.join(" AND ")} ORDER BY e.fecha`,
    params
  );
  return rows;
}

export default {
  listar, porId, crear, actualizarCabecera, eliminar, reemplazarLotes, upsertRespuesta,
  respuestasDe, reemplazarRecomendaciones, reemplazarPlan, marcarItemPlan, agregados,
};
