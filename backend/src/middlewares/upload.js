/* =====================================================================
   Middleware de subida de archivos (evidencias) en memoria.
   El servicio envía el buffer a Supabase Storage; no se guarda en disco local.
   ===================================================================== */
import multer from "multer";
import config from "../config/env.js";
import { ErrorApp } from "../utils/errores.js";

const TIPOS = /^(image\/|application\/pdf|video\/|text\/plain)/i;

export const subirEvidencia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploads.maxMB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!TIPOS.test(file.mimetype)) {
      return cb(new ErrorApp("TIPO_ARCHIVO", "Tipo de archivo no permitido.", 400));
    }
    cb(null, true);
  },
}).single("archivo");

export default { subirEvidencia };
