/* =====================================================================
   Índice de rutas · monta todos los submódulos bajo /api
   ===================================================================== */
import { Router } from "express";
import config from "../config/env.js";
import { probarConexion } from "../config/db.js";

import authRoutes from "./auth.routes.js";
import catalogoRoutes from "./catalogo.routes.js";
import predioRoutes from "./predio.routes.js";
import evaluacionRoutes from "./evaluacion.routes.js";
import evidenciaRoutes from "./evidencia.routes.js";
import reporteRoutes from "./reporte.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import usuarioRoutes from "./usuario.routes.js";
import auditoriaRoutes from "./auditoria.routes.js";
import chatbotRoutes from "./chatbot.routes.js";

const api = Router();

/* Salud · verifica arranque y conexión a la base de datos. */
api.get("/salud", async (req, res) => {
  let db = false;
  try {
    db = await probarConexion();
  } catch (_) {
    db = false;
  }
  res.json({
    datos: {
      ok: true,
      version: config.version,
      entorno: config.entorno,
      baseDatos: db ? "conectada" : "sin conexión",
      modoOfflinePermitido: config.modoOfflinePermitido,
      hora: new Date().toISOString(),
    },
  });
});

api.use("/auth", authRoutes);
api.use("/catalogos", catalogoRoutes);
api.use("/predios", predioRoutes);
api.use("/evaluaciones", evaluacionRoutes);
api.use("/evidencias", evidenciaRoutes);
api.use("/reportes", reporteRoutes);
api.use("/dashboard", dashboardRoutes);
api.use("/usuarios", usuarioRoutes);
api.use("/auditoria", auditoriaRoutes);
api.use("/chatbot", chatbotRoutes);

export default api;
