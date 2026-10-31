/* =====================================================================
   Rutas · informes y comparación
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/reporte.controller.js";
import { autenticar } from "../middlewares/auth.js";

const r = Router();
r.use(autenticar);

r.get("/comparar", ctrl.comparar);   // ?a=&b=
r.get("/:id", ctrl.informe);
r.get("/:id/html", ctrl.informeHTML);

export default r;
