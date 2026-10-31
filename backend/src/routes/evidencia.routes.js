/* =====================================================================
   Rutas · evidencias (multipart)
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/evidencia.controller.js";
import { autenticar, requiereRol } from "../middlewares/auth.js";
import { subirEvidencia } from "../middlewares/upload.js";

const r = Router();
r.use(autenticar);

r.post("/", requiereRol("admin", "docente", "evaluador"), subirEvidencia, ctrl.subir);
r.get("/archivo/:id", ctrl.archivo);
r.get("/:respuestaId", ctrl.listar);
r.delete("/:id", requiereRol("admin", "docente", "evaluador"), ctrl.eliminar);

export default r;
