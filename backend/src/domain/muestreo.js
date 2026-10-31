/* =====================================================================
   Dominio · reglas de muestreo por modalidad
   PMG: <4 → todos · 4–9 → 3 · >9 → 4
   AREL: <4 → todos · ≥4 → sin definir (requiere verificación metodológica)
   ===================================================================== */

/**
 * @param {number} nLotes lotes sembrados
 * @param {"PMG"|"AREL"} modalidad
 * @returns {number|null} lotes a muestrear (n = todos) o null si no está definido
 */
export function muestreo(nLotes, modalidad = "PMG") {
  const n = Number(nLotes);
  if (!(n > 0) || !Number.isFinite(n)) return null;
  if (modalidad === "AREL") return n < 4 ? n : null;
  if (n < 4) return n;
  if (n <= 9) return 3;
  return 4;
}

/** Aplica una tabla de reglas (regla_muestreo) si se dispone de ella. */
export function muestreoDesdeReglas(nLotes, reglas) {
  const n = Number(nLotes);
  if (!(n > 0) || !reglas || !reglas.length) return null;
  const regla = reglas.find(
    (r) => n >= r.min_lotes && (r.max_lotes === null || n <= r.max_lotes)
  );
  if (!regla) return null;
  return regla.lotes_a_muestrear === null || regla.lotes_a_muestrear === undefined
    ? n
    : regla.lotes_a_muestrear;
}

/**
 * Detalle del muestreo para la UI y para validar en el servidor.
 *  - PMG:  <4 lotes → todos · 4–9 → 3 · >9 → 4 (Tabla 1 de la metodología ICA v2.0).
 *  - AREL: <4 lotes → todos (Tabla 30). Para ≥4 lotes el documento NO define la regla;
 *          se aplica la misma tabla del ICA como criterio provisional y se marca
 *          `extrapolada: true` para que la interfaz lo advierta al evaluador.
 * @returns {{ lotes:number, requeridos:number|null, todos:boolean, regla:string, extrapolada:boolean }}
 */
export function muestreoDetalle(nLotes, modalidad = "PMG") {
  const n = Number(nLotes);
  if (!(n > 0) || !Number.isFinite(n)) {
    return { lotes: 0, requeridos: null, todos: false, regla: "Sin lotes sembrados.", extrapolada: false };
  }
  const extrapolada = modalidad === "AREL" && n >= 4;
  const requeridos = n < 4 ? n : n <= 9 ? 3 : 4;
  const regla =
    n < 4
      ? "Menos de 4 lotes sembrados: se evalúan todos."
      : n <= 9
      ? "De 4 a 9 lotes sembrados: se evalúan 3."
      : "Más de 9 lotes sembrados: se evalúan 4.";
  return { lotes: n, requeridos, todos: requeridos === n, regla, extrapolada };
}

export default { muestreo, muestreoDesdeReglas, muestreoDetalle };
