/* =====================================================================
   Rutas · tablero
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/dashboard.controller.js";
import { autenticar } from "../middlewares/auth.js";

const r = Router();
r.use(autenticar);

r.get("/resumen", ctrl.resumen);   // ?predio=&especie=

export default r;
