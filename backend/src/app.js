/* =====================================================================
   Aplicación Express · middlewares globales, API y archivos estáticos
   ===================================================================== */
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import config from "./config/env.js";
import api from "./routes/index.js";
import { noEncontrado, manejadorErrores } from "./middlewares/errors.js";

const app = express();

/* Confiamos en proxies (útil detrás de Nginx/Heroku) para IP real. */
app.set("trust proxy", true);
app.disable("x-powered-by");

/* Seguridad. CSP relajada: el prototipo carga fuentes e imágenes externas
   y usa estilos/scripts propios servidos desde el mismo origen. */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* CORS: si CORS_ORIGEN es "*" se permite cualquier origen. */
app.use(
  cors({
    origin: config.cors.origenes.includes("*") ? true : config.cors.origenes,
    credentials: true,
  })
);

/* Registro de peticiones. */
app.use(morgan(config.produccion ? "combined" : "dev"));

/* Cuerpos JSON y formularios. */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* API REST. */
app.use("/api", api);

/* Las evidencias se consultan por /api/evidencias/archivo/:id con autenticación.
   No publicar el directorio de archivos como recurso estático. */

/* Raíz informativa. El proyecto nuevo es API-first: el frontend es la app Angular
   (frontend-angular, puerto 4200 en desarrollo). Esta API ya NO sirve el proyecto
   anterior (HTML/JS estático), de modo que ambos pueden ejecutarse por separado. */
app.get("/", (req, res) =>
  res.json({ datos: { servicio: "Bienestar Acuático · API", version: config.version, salud: "/api/salud" } })
);

/* 404 y manejador central de errores (deben ir al final). */
app.use(noEncontrado);
app.use(manejadorErrores);

export default app;
