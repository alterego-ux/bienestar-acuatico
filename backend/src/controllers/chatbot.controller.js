import chatbotService from "../services/chatbot.service.js";
import evaluacionService from "../services/evaluacion.service.js";
import config from "../config/env.js";
import { asyncHandler, ok } from "../utils/http.js";

const solicitudes = new Map();
const LIMITE_POR_MINUTO = Math.max(1, Number(config.gemini.limitePorMinuto) || 12);

function comprobarLimite(req, res) {
  const ahora = Date.now();
  const clave = String(req.usuario.id);
  const datos = solicitudes.get(clave) || { inicio: ahora, cantidad: 0 };
  if (ahora - datos.inicio >= 60_000) { datos.inicio = ahora; datos.cantidad = 0; }
  datos.cantidad += 1;
  solicitudes.set(clave, datos);
  if (solicitudes.size > 2000) {
    for (const [id, fila] of solicitudes) if (ahora - fila.inicio >= 60_000) solicitudes.delete(id);
    while (solicitudes.size > 2000) solicitudes.delete(solicitudes.keys().next().value);
  }
  if (datos.cantidad <= LIMITE_POR_MINUTO) return true;
  res.setHeader("Retry-After", "60");
  res.status(429).json({ error: { codigo: "CHAT_RATE_LIMIT", mensaje: "Alcanzaste el límite temporal de mensajes. Inténtalo de nuevo en un minuto." } });
  return false;
}

export const mensaje = asyncHandler(async (req, res) => {
  if (!comprobarLimite(req, res)) return;
  let contextoEvaluacion = null;
  if (req.body.evaluacionId) {
    const id = Number(req.body.evaluacionId);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: { codigo: "ID_INVALIDO", mensaje: "La evaluación indicada no es válida." } });
    const { evaluacion, calculo } = await evaluacionService.porIdConCalculo(id);
    contextoEvaluacion = chatbotService.crearContextoEvaluacion(evaluacion, calculo);
  }
  return ok(res, await chatbotService.responder({ ...req.body, contextoEvaluacion }));
});

export const recomendaciones = asyncHandler(async (req, res) => {
  if (!comprobarLimite(req, res)) return;
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: { codigo: "ID_INVALIDO", mensaje: "La evaluación indicada no es válida." } });
  const { evaluacion, calculo } = await evaluacionService.porIdConCalculo(id);
  const resultado = await chatbotService.recomendarEvaluacion(evaluacion, calculo);
  return ok(res, resultado);
});

export default { mensaje, recomendaciones };
