/* =====================================================================
   Repositorio · catálogos (indicadores, especies, modalidades, sistemas,
   departamentos, categorías, libertades, reglas)
   ===================================================================== */
import { query } from "../config/db.js";

export async function modalidades() {
  const { rows } = await query(
    `SELECT m.id, m.codigo, m.nombre, m.peso_mbr, m.peso_mba, m.peso_mbg,
            json_agg(json_build_object('tipo', tm.codigo, 'peso', po.peso_pct) ORDER BY tm.codigo) AS ponderaciones
       FROM modalidad m
       LEFT JOIN ponderacion po ON po.modalidad_id = m.id
       LEFT JOIN tipo_medida tm ON tm.id = po.tipo_medida_id
      GROUP BY m.id ORDER BY m.id`
  );
  return rows;
}

export async function tiposMedida() {
  const { rows } = await query("SELECT id, codigo, nombre, descripcion, color FROM tipo_medida ORDER BY id");
  return rows;
}

export async function especies({ soloActivas = false } = {}) {
  const { rows } = await query(
    `SELECT id, codigo, nombre_comun AS n, nombre_cientifico, tipo_agua,
            temp_min, temp_max, od_min, ph_min, turbidez_ref AS turb, turbidez_aplica,
            mortalidad_100, mortalidad_55, mortalidad_20, mortalidad_txt AS mort, activo AS act
       FROM especie ${soloActivas ? "WHERE activo = TRUE" : ""} ORDER BY id`
  );
  return rows;
}

export async function sistemaProductivo() {
  const { rows } = await query("SELECT id, nombre, densidad_ref FROM sistema_productivo ORDER BY nombre");
  return rows;
}

export async function tiposProductor() {
  const { rows } = await query(
    `SELECT tp.id, tp.nombre, m.codigo AS modalidad
       FROM tipo_productor tp LEFT JOIN modalidad m ON m.id = tp.modalidad_id ORDER BY tp.id`
  );
  return rows;
}

export async function departamentos() {
  const { rows } = await query("SELECT id, nombre FROM departamento ORDER BY nombre");
  return rows;
}

export async function municipios(departamentoId) {
  const { rows } = await query(
    "SELECT id, nombre, departamento_id FROM municipio WHERE departamento_id = $1 ORDER BY nombre",
    [departamentoId]
  );
  return rows;
}

export async function departamentosConMunicipios() {
  const { rows } = await query(
    `SELECT d.id, d.nombre, COALESCE(json_agg(m.nombre ORDER BY m.nombre) FILTER (WHERE m.id IS NOT NULL), '[]') AS municipios
       FROM departamento d LEFT JOIN municipio m ON m.departamento_id = d.id
      GROUP BY d.id ORDER BY d.nombre`
  );
  return rows;
}

export async function categorias() {
  const { rows } = await query(
    "SELECT id, nombre, min_pct, max_pct, color, descripcion FROM categoria_clasificacion ORDER BY min_pct"
  );
  return rows;
}

export async function libertades() {
  const { rows } = await query("SELECT id, nombre, descripcion FROM libertad ORDER BY id");
  return rows;
}

/** Indicadores con sus niveles y libertades. Filtra por modalidad (PMG|AREL). */
export async function indicadores({ modalidad } = {}) {
  const cond =
    modalidad === "AREL" ? "WHERE i.aplica_arel = TRUE" : modalidad === "PMG" ? "WHERE i.aplica_pmg = TRUE" : "";
  const { rows } = await query(
    `SELECT i.id, i.codigo AS id_codigo, i.codigo, i.nombre AS n, i.nombre, i.descripcion AS lib,
            i.pregunta AS q, i.metodo AS met, i.no_aplica AS na, i.recomendacion AS rec,
            i.calculadora AS calc, i.aplica_arel AS arel, i.aplica_pmg, i.orden,
            tm.codigo AS t,
            COALESCE((
              SELECT json_agg(json_build_object('puntaje', n.puntaje, 'descripcion', n.descripcion) ORDER BY n.orden)
                FROM indicador_nivel n WHERE n.indicador_id = i.id
            ), '[]') AS niveles,
            COALESCE((
              SELECT json_agg(l.nombre ORDER BY l.id)
                FROM indicador_libertad il JOIN libertad l ON l.id = il.libertad_id
               WHERE il.indicador_id = i.id
            ), '[]') AS libertades
       FROM indicador i JOIN tipo_medida tm ON tm.id = i.tipo_medida_id
       ${cond} ORDER BY i.orden`,
    []
  );
  // niveles en formato [[puntaje, descripcion], …] para compatibilidad con el frontend
  return rows.map((r) => ({
    ...r,
    libertad: (r.libertades || []).join(" · "),
    lv: (r.niveles || []).map((nv) => [nv.puntaje, nv.descripcion]),
  }));
}

export async function indicadoresCalculo({ modalidad } = {}) {
  const lista = await indicadores({ modalidad });
  return lista.map((i) => ({
    id: i.id,
    codigo: i.codigo,
    tipo_medida: i.t,
    libertad: i.libertad,
    nombre: i.nombre,
    recomendacion: i.rec,
    calculadora: i.calc,
    niveles: i.niveles,
  }));
}

export async function reglasMuestreo() {
  const { rows } = await query(
    `SELECT rm.id, m.codigo AS modalidad, rm.min_lotes, rm.max_lotes, rm.lotes_a_muestrear, rm.nota
       FROM regla_muestreo rm JOIN modalidad m ON m.id = rm.modalidad_id ORDER BY m.codigo, rm.min_lotes`
  );
  return rows;
}

export async function reglasProfundidad() {
  const { rows } = await query(
    `SELECT rp.id, m.codigo AS modalidad, rp.es_jaula, rp.min_m, rp.max_m, rp.nota
       FROM regla_profundidad rp JOIN modalidad m ON m.id = rp.modalidad_id ORDER BY m.codigo, rp.es_jaula`
  );
  return rows;
}

export default {
  modalidades, tiposMedida, especies, sistemaProductivo, tiposProductor, departamentos,
  municipios, departamentosConMunicipios, categorias, libertades, indicadores,
  indicadoresCalculo, reglasMuestreo, reglasProfundidad,
};
