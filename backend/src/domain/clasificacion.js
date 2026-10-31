/* =====================================================================
   Dominio · clasificación final (§5.5)
   Bajo < 50 · Medio 50–74 · Alto 75–89 · Excelente ≥ 90
   ===================================================================== */

export const CATEGORIAS = [
  { nombre: "Excelente", min: 90, max: 100, color: "#45e6d2" },
  { nombre: "Alto", min: 75, max: 90, color: "#4aa3ff" },
  { nombre: "Medio", min: 50, max: 75, color: "#f5b83d" },
  { nombre: "Bajo", min: 0, max: 50, color: "#ef5b5b" },
];

export function clasificar(total) {
  if (total === null || total === undefined || Number.isNaN(total)) return null;
  if (total >= 90) return "Excelente";
  if (total >= 75) return "Alto";
  if (total >= 50) return "Medio";
  return "Bajo";
}

export function colorClase(nombre) {
  const c = CATEGORIAS.find((x) => x.nombre === nombre);
  return c ? c.color : "#6b8794";
}

export default { clasificar, colorClase, CATEGORIAS };
