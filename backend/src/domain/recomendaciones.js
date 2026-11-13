/* =====================================================================
   Dominio · recomendaciones y plan de mejora
   Portado de js/app.js (genRecs, makePlan).
   ===================================================================== */

/**
 * Genera recomendaciones SOLO para los indicadores calificados con 0 puntos
 * (regla de negocio: la retroalimentación se concentra en los incumplimientos totales).
 * @returns [{ indicador, titulo, texto, puntaje_ref, orden }]
 */
export function generarRecomendaciones(calculo, contexto = {}) {
  const { especie = "", sistemas = [] } = contexto;
  const sistemaTxt = sistemas.length ? sistemas.join(", ") : "sistema no definido";
  return calculo.items
    .filter((x) => x.estado === "ok" && Number(x.respuesta.puntaje) === 0)
    .sort((a, b) => Number(a.respuesta.puntaje) - Number(b.respuesta.puntaje))
    .map((x, idx) => ({
      indicador: x.indicador,
      titulo: x.indicador.nombre,
      puntaje_ref: Number(x.respuesta.puntaje),
      orden: idx,
      texto: `${x.indicador.recomendacion} (Contexto: ${especie} en ${sistemaTxt}; resultado actual ${x.respuesta.puntaje}/100.)`,
    }));
}

/** Convierte recomendaciones en un plan de mejora (prioridad y plazos según el puntaje). */
export function planDesdeRecomendaciones(recomendaciones, responsable = "", hoy = new Date()) {
  const sumarDias = (n) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  return recomendaciones.map((r) => ({
    accion: String(r.texto || "").replace(/ \(Contexto:.*$/, ""),
    responsable,
    prioridad: Number(r.puntaje_ref) <= 20 ? "Alta" : "Media",
    plazo: sumarDias(Number(r.puntaje_ref) === 0 ? 30 : Number(r.puntaje_ref) === 20 ? 60 : 90),
    completado: false,
  }));
}

export default { generarRecomendaciones, planDesdeRecomendaciones };
