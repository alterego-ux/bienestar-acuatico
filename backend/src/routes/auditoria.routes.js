/* =====================================================================
   Rutas · auditoría (admin y docente)
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/auditoria.controller.js";
import { autenticar, requiereRol } from "../middlewares/auth.js";

const r = Router();
r.use(autenticar, requiereRol("admin", "docente"));

r.get("/", ctrl.listar);   // ?entidad=&usuario=&limite=

export default r;
