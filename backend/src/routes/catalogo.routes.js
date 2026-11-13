/* =====================================================================
   Rutas · catálogos (requieren sesión)
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/catalogo.controller.js";
import { autenticar } from "../middlewares/auth.js";

const r = Router();
r.use(autenticar);

r.get("/modalidades", ctrl.modalidades);
r.get("/tipos-medida", ctrl.tiposMedida);
r.get("/especies", ctrl.especies);
r.get("/sistemas", ctrl.sistemas);
r.get("/tipos-productor", ctrl.tiposProductor);
r.get("/departamentos", ctrl.departamentos);
r.get("/departamentos/:id/municipios", ctrl.municipios);
r.get("/categorias", ctrl.categorias);
r.get("/libertades", ctrl.libertades);
r.get("/reglas-muestreo", ctrl.reglasMuestreo);
r.get("/reglas-profundidad", ctrl.reglasProfundidad);
r.get("/indicadores", ctrl.indicadores);
r.get("/indicadores/:codigo/niveles", ctrl.niveles);

export default r;
