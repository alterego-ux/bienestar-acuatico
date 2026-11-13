/* =====================================================================
   Servicio · tablero (agregados)
   ===================================================================== */
import evaluacionRepo from "../repositories/evaluacion.repo.js";
import cat from "../repositories/indicador.repo.js";
import { calcularEvaluacion } from "./calculo.service.js";
import { clasificar } from "../domain/clasificacion.js";
import { MEDIDAS } from "../domain/constantes.js";

export async function resumen({ predioId, especieId } = {}) {
  const lista = await evaluacionRepo.listar({
    predioId,
    estado: undefined,
  });
  const completadas = lista.filter(
    (e) => ["finalizada", "validada", "cerrada"].includes(e.est) && (!especieId || String(e.especie_id) === String(especieId))
  );

  const calculos = [];
  for (const e of completadas) {
    const c = await calcularEvaluacion(e);
    calculos.push({ e, c });
  }
  const validos = calculos.filter((x) => x.c.isFinal);
  const promedio = validos.length ? validos.reduce((a, x) => a + x.c.total, 0) / validos.length : null;
  const alto = validos.filter((x) => x.c.total >= 75).length;
  const criticos = calculos.reduce(
    (a, x) => a + x.c.items.filter((y) => y.estado === "ok" && Number(y.respuesta.puntaje) === 0).length,
    0
  );

  const porMedida = {};
  for (const k of Object.keys(MEDIDAS)) {
    const vals = calculos.map((x) => x.c.avg[k]).filter((v) => v !== null);
    porMedida[k] = vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null;
  }

  const distribucion = { Excelente: 0, Alto: 0, Medio: 0, Bajo: 0 };
  for (const x of validos) distribucion[clasificar(x.c.total)]++;

  const serie = calculos.map((x) => ({
    id: x.e.id,
    fecha: x.e.fecha,
    predio: x.e.predio_nombre,
    puntaje: x.c.isFinal ? Number(x.c.total.toFixed(1)) : null,
    clasificacion: x.c.isFinal ? x.c.cls : null,
  }));

  // Indicadores con menor cumplimiento
  const indicadores = await cat.indicadores({});
  const hallazgos = indicadores
    .map((i) => {
      const scores = [];
      for (const x of calculos) {
        const it = x.c.items.find((y) => y.indicador.codigo === i.codigo);
        if (it && it.estado === "ok") scores.push(Number(it.respuesta.puntaje));
      }
      if (!scores.length) return null;
      return {
        codigo: i.codigo,
        nombre: i.nombre,
        n: scores.length,
        promedio: scores.reduce((a, b) => a + b, 0) / scores.length,
        bajos: scores.filter((v) => v <= 20).length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.promedio - b.promedio)
    .slice(0, 5);

  return {
    totales: {
      evaluaciones: lista.length,
      completadas: calculos.length,
      predios: new Set(lista.map((e) => e.predio_id)).size,
      promedio: promedio === null ? null : Number(promedio.toFixed(1)),
      altoExcelente: calculos.length ? Number(((alto / calculos.length) * 100).toFixed(1)) : null,
      criticos,
    },
    porMedida,
    distribucion,
    serie,
    hallazgos,
  };
}

export default { resumen };
