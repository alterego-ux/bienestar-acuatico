/* =====================================================================
   Middleware de subida de archivos (evidencias) con Multer
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import config from "../config/env.js";
import { ErrorApp } from "../utils/errores.js";

fs.mkdirSync(config.uploads.dir, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploads.dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    const unico = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${base}_${unico}${ext}`);
  },
});

const TIPOS = /^(image\/|application\/pdf|video\/|text\/plain)/i;

export const subirEvidencia = multer({
  storage: almacenamiento,
  limits: { fileSize: config.uploads.maxMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!TIPOS.test(file.mimetype)) {
      return cb(new ErrorApp("TIPO_ARCHIVO", "Tipo de archivo no permitido.", 400));
    }
    cb(null, true);
  },
}).single("archivo");

export default { subirEvidencia };
