/* =====================================================================
   Rutas · usuarios (solo administración)
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/usuario.controller.js";
import { autenticar, requiereRol } from "../middlewares/auth.js";
import { validar } from "../middlewares/validate.js";
import { usuarioSchema } from "./schemas.js";

const r = Router();
r.use(autenticar, requiereRol("admin"));

r.get("/", ctrl.listar);
r.get("/roles", ctrl.roles);
r.post("/", validar(usuarioSchema, "body"), ctrl.crear);
r.put("/:id", validar(usuarioSchema.partial(), "body"), ctrl.actualizar);
r.patch("/:id/activo", ctrl.alternar);

export default r;
