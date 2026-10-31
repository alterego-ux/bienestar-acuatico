/* =====================================================================
   Servicio · informes y comparación
   ===================================================================== */
import evaluacionRepo from "../repositories/evaluacion.repo.js";
import cat from "../repositories/indicador.repo.js";
import { calcularEvaluacion } from "./calculo.service.js";
import { clasificar } from "../domain/clasificacion.js";
import { noEncontrado, validacion } from "../utils/errores.js";
import { MEDIDAS } from "../domain/constantes.js";
import { generarRecomendaciones } from "../domain/recomendaciones.js";

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fd = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—");

export async function informeData(evalId) {
  const e = await evaluacionRepo.porId(evalId);
  if (!e) throw noEncontrado("Evaluación");
  const calc = await calcularEvaluacion(e);
  const indicadores = await cat.indicadores({ modalidad: e.reg });
  const porCodigo = new Map(indicadores.map((i) => [i.codigo, i]));
  const items = calc.items.map((x) => ({
    codigo: x.indicador.codigo,
    nombre: porCodigo.get(x.indicador.codigo)?.nombre || x.indicador.nombre,
    estado: x.estado,
    puntaje: x.estado === "ok" ? Number(x.respuesta.puntaje) : x.estado === "na" ? "N/A" : "Pendiente",
    observacion: (x.respuesta && x.respuesta.observacion) || "",
  }));
  // Retroalimentación: únicamente los criterios calificados con 0 puntos.
  const recomendaciones = generarRecomendaciones(calc, { especie: e.esp || "" }).map((r) => ({
    codigo: r.indicador.codigo,
    nombre: r.titulo,
    puntaje: r.puntaje_ref,
    texto: String(r.texto || "").replace(/ \(Contexto:.*$/, ""),
  }));
  return {
    evaluacion: e,
    calculo: calc,
    items,
    recomendaciones,
    porLibertad: calc.libertades,
    medias: MEDIDAS,
  };
}

/** Informe imprimible en HTML (simulación académica). */
export async function informeHTML(evalId) {
  const d = await informeData(evalId);
  const { evaluacion: e, calculo: c } = d;
  const filasMedida = ["MBA", "MBR", "MBG"]
    .map(
      (k) => `<tr><td>${esc(MEDIDAS[k].full)}</td><td>${c.pesos[k]}%</td>
      <td>${c.avg[k] === null ? "Sin dato" : c.avg[k].toFixed(1)}</td>
      <td>${c.avg[k] === null ? "—" : ((c.avg[k] * c.pesos[k]) / 100).toFixed(1)}</td></tr>`
    )
    .join("");
  const detalle = d.items
    .map(
      (x) => `<tr><td>${esc(x.codigo)}</td><td>${esc(x.nombre)}</td>
      <td>${x.puntaje}</td><td>${esc(x.observacion)}</td></tr>`
    )
    .join("");
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Informe · ${esc(e.predio_nombre)}</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#163742;max-width:900px;margin:24px auto;padding:0 16px}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #cfe5db;padding:6px 8px;text-align:left;font-size:.9rem}
th{background:#edf7f8}
.aviso{border:1px solid #a8c8d0;background:#edf7f8;padding:12px 14px;border-radius:8px;font-size:.9rem}
.puntaje{font-size:1.7rem;font-weight:700}
h1,h2{color:#12303c}
@media print{.noprint{display:none}}
</style></head><body>
<div class="aviso noprint"><b>Prototipo académico independiente.</b> Este documento es una simulación local basada en una metodología pública; no es una certificación ni un informe oficial del ICA.</div>
<h1>Informe de evaluación de bienestar animal</h1>
<p>Bienestar Acuático · Metodología ICA v2.0 (2024)</p>
<table>
<tr><th>Predio</th><td>${esc(e.predio_nombre)} (${esc(e.predio_codigo)})</td><th>Fecha</th><td>${fd(e.fecha)}</td></tr>
<tr><th>Responsable del predio</th><td>${esc(e.predio_responsable)}</td><th>Evaluador (usuario en sesión)</th><td>${esc(e.ev || e.evaluador)}</td></tr>
<tr><th>Especie</th><td>${esc(e.esp)}</td><th>Modalidad</th><td>${e.reg === "AREL" ? "Subsistencia / AREL" : "PMG"}</td></tr>
</table>
<h2>Resumen general</h2>
<p class="puntaje">${c.isFinal ? Math.round(c.total) + "%" : "No calculable"}</p>
<p>Clasificación: <b>${c.isFinal ? esc(c.cls) : "Sin clasificación definitiva"}</b>. ${c.done + c.na} de ${c.count} indicadores.</p>
<table><tr><th>Tipo de medida</th><th>Peso</th><th>Promedio</th><th>Aporte</th></tr>
${filasMedida}
<tr><th colspan="3">Puntaje final</th><th>${c.isFinal ? c.total.toFixed(1) + "%" : "—"}</th></tr>
</table>
${
  d.recomendaciones.length
    ? `<h2>Recomendaciones de mejora (criterios con 0 puntos)</h2>
<table><tr><th>Código</th><th>Criterio</th><th>Recomendación</th></tr>
${d.recomendaciones.map((r) => `<tr><td>${esc(r.codigo)}</td><td>${esc(r.nombre)}</td><td>${esc(r.texto)}</td></tr>`).join("")}</table>`
    : `<h2>Recomendaciones de mejora</h2><p>Ningún criterio fue calificado con 0 puntos: no hay recomendaciones críticas.</p>`
}
<h2>Detalle por indicador</h2>
<table><tr><th>Código</th><th>Indicador</th><th>Puntaje</th><th>Observaciones</th></tr>
${detalle}</table>
<p style="font-size:.78rem;color:#4b6b78;margin-top:24px">Documento generado el ${new Date().toLocaleString("es-CO")}. Las recomendaciones son un apoyo a la decisión revisadas por el evaluador.</p>
<script>if(location.search.includes("auto=1"))window.print();</script>
</body></html>`;
}

export async function comparar(idA, idB) {
  if (!idA || !idB) throw validacion("Indica dos evaluaciones para comparar.");
  const a = await evaluacionRepo.porId(idA);
  const b = await evaluacionRepo.porId(idB);
  if (!a || !b) throw noEncontrado("Evaluación");
  const ca = await calcularEvaluacion(a);
  const cb = await calcularEvaluacion(b);
  const dif = {};
  for (const k of ["MBR", "MBA", "MBG"]) dif[k] = ca.avg[k] !== null && cb.avg[k] !== null ? cb.avg[k] - ca.avg[k] : null;
  dif.total = ca.isFinal && cb.isFinal ? cb.total - ca.total : null;
  const cambios = ca.items
    .map((x, k) => ({ a: x, b: cb.items[k] }))
    .filter((o) => o.a.estado === "ok" && o.b && o.b.estado === "ok" && Number(o.a.respuesta.puntaje) !== Number(o.b.respuesta.puntaje))
    .map((o) => ({
      codigo: o.a.indicador.codigo,
      nombre: o.a.indicador.nombre,
      antes: Number(o.a.respuesta.puntaje),
      despues: Number(o.b.respuesta.puntaje),
    }));
  return { a, b, ca, cb, dif, cambios, clasificacion: { a: ca.isFinal ? clasificar(ca.total) : null, b: cb.isFinal ? clasificar(cb.total) : null } };
}

export default { informeData, informeHTML, comparar };
