/* =====================================================================
   Dominio · reglas de referencia (profundidad, mortalidad, agua)
   Portado de js/app.js (depthRange) y las tablas del prototipo.
   ===================================================================== */

/** Rango de profundidad aplicable. Tabla 13 (PMG jaulas 2–5 m) y tabla 40 (AREL 0,6–1,5 m). */
export function depthRange(modalidad, esJaula) {
  return modalidad !== "AREL" && !!esJaula ? [2, 5] : [0.6, 1.5];
}

/** Umbrales de mortalidad por especie (cachama 1/2/3 · resto 10/12/15). */
export function umbralesMortalidad(codigoEspecie) {
  const esCachama = codigoEspecie === "cachama";
  return esCachama ? [1, 2, 3] : [10, 12, 15];
}

/** Calculadoras de indicadores (equivalen a applyCalc del frontend). */
export const calculadoras = {
  dietas({ d_dias, d_sin }) {
    if (d_sin) return { puntaje: 0, mensaje: "Sin registros de ajuste → 0 puntos." };
    const d = Number(d_dias);
    if (!Number.isFinite(d)) return null;
    const puntaje = d < 30 ? 100 : d <= 45 ? 55 : 20;
    return { puntaje, mensaje: `Ajuste cada ${d} días → ${puntaje} puntos.` };
  },
  profundidad({ p_prof, p_jaula, p_med }, { modalidad }) {
    const v = Number(p_prof);
    if (!(v > 0)) return null;
    const [lo, hi] = depthRange(modalidad, p_jaula);
    const ok = v >= lo && v <= hi;
    const puntaje = ok ? 100 : p_med ? 55 : 0;
    return { puntaje, mensaje: `${v} m (rango ${lo}–${hi} m) → ${puntaje} puntos.` };
  },
  tamano({ t_tot, t_prom }) {
    const tot = Number(t_tot);
    const prom = Number(t_prom);
    if (!(tot > 0) || !Number.isInteger(tot) || !Number.isInteger(prom) || prom < 0 || prom > tot) return null;
    const p = (prom / tot) * 100;
    const puntaje = p > 90 ? 100 : p >= 80 ? 55 : p >= 70 ? 20 : 0;
    return { puntaje, mensaje: `${p.toFixed(1)}% en el promedio → ${puntaje} puntos.` };
  },
  lesiones({ l_tot, l_dan }) {
    const tot = Number(l_tot);
    const dan = Number(l_dan);
    if (!(tot > 0) || !Number.isInteger(tot) || !Number.isInteger(dan) || dan < 0 || dan > tot) return null;
    const p = (dan / tot) * 100;
    const puntaje = p < 5 ? 100 : p <= 10 ? 55 : p <= 20 ? 20 : 0;
    return { puntaje, mensaje: `${p.toFixed(1)}% con daños → ${puntaje} puntos.` };
  },
  mortalidad({ m_mue, m_pob, m_sin }, { codigoEspecie }) {
    if (m_sin) return { puntaje: 0, mensaje: "Sin registros o peces muertos visibles → 0 puntos." };
    const mue = Number(m_mue);
    const pob = Number(m_pob);
    if (!Number.isFinite(mue) || !Number.isFinite(pob) || mue < 0 || !(pob > 0) || mue > pob) return null;
    const p = (mue / pob) * 100;
    const t = umbralesMortalidad(codigoEspecie);
    const puntaje = p <= t[0] ? 100 : p <= t[1] ? 55 : p <= t[2] ? 20 : 0;
    return { puntaje, mensaje: `Mortalidad ${p.toFixed(2)}% → ${puntaje} puntos.` };
  },
  capacitacion({ k_tot, k_con, k_cer }) {
    const tot = Number(k_tot);
    const con = Number(k_con);
    const cer = Number(k_cer);
    if (!(tot > 0) || Number.isNaN(con) || Number.isNaN(cer) || con > tot || cer > tot) return null;
    const puntaje =
      con === tot && cer === tot ? 100 : (con > tot / 2 && cer > tot / 2) || con === tot ? 55 : con > tot / 2 ? 20 : 0;
    return { puntaje, mensaje: `${con}/${tot} con conocimiento, ${cer}/${tot} certificados → ${puntaje} puntos.` };
  },
};

export function aplicarCalculadora(nombre, datos, contexto = {}) {
  const fn = calculadoras[nombre];
  if (!fn) return null;
  return fn(datos, contexto);
}

export default { depthRange, umbralesMortalidad, calculadoras, aplicarCalculadora };
