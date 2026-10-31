/* =====================================================================
   Rutas · predios
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/predio.controller.js";
import { autenticar, requiereRol } from "../middlewares/auth.js";
import { validar } from "../middlewares/validate.js";
import { predioSchema } from "./schemas.js";

const r = Router();
r.use(autenticar);

r.get("/", ctrl.listar);
r.get("/:id", ctrl.porId);
r.get("/:id/muestreo", ctrl.planMuestreo); // ?especie=<id> → lotes a evaluar según la tabla ICA
r.post("/", requiereRol("admin", "docente", "evaluador"), validar(predioSchema, "body"), ctrl.crear);
r.put("/:id", requiereRol("admin", "docente", "evaluador"), validar(predioSchema, "body"), ctrl.actualizar);
r.delete("/:id", requiereRol("admin", "docente", "evaluador"), ctrl.eliminar);

export default r;
