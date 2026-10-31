/* =====================================================================
   Rutas · evaluaciones, respuestas de indicadores, recomendaciones,
   plan de mejora e informe
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/evaluacion.controller.js";
import recCtrl from "../controllers/recomendacion.controller.js";
import reporteCtrl from "../controllers/reporte.controller.js";
import { autenticar, requiereRol } from "../middlewares/auth.js";
import { validar } from "../middlewares/validate.js";
import { evaluacionSchema, respuestaSchema, estadoSchema, planItemSchema } from "./schemas.js";

const r = Router();
r.use(autenticar);

const PUEDE_EDITAR = requiereRol("admin", "docente", "evaluador");

// Comparación (antes de /:id para no colisionar)
r.get("/comparar", reporteCtrl.comparar);

r.get("/", ctrl.listar);
r.post("/", PUEDE_EDITAR, validar(evaluacionSchema, "body"), ctrl.crear);

r.get("/:id", ctrl.porId);
r.put("/:id", PUEDE_EDITAR, validar(evaluacionSchema.partial(), "body"), ctrl.actualizar);
r.delete("/:id", PUEDE_EDITAR, ctrl.eliminar);

// Respuestas de indicadores
r.get("/:id/respuestas", ctrl.respuestas);
r.put("/:id/respuestas/:indicador", PUEDE_EDITAR, validar(respuestaSchema, "body"), ctrl.guardarRespuesta);

// Ciclo de vida
r.post("/:id/finalizar", PUEDE_EDITAR, ctrl.finalizar);
r.post("/:id/reabrir", PUEDE_EDITAR, ctrl.reabrir);
r.post("/:id/recalcular", ctrl.recalcular);
r.patch("/:id/estado", PUEDE_EDITAR, validar(estadoSchema, "body"), ctrl.cambiarEstado);

// Recomendaciones y plan de mejora
r.post("/:id/recomendaciones", PUEDE_EDITAR, recCtrl.generar);
r.get("/:id/recomendaciones", recCtrl.listar);
r.get("/:id/plan", recCtrl.plan);
r.post("/:id/plan", PUEDE_EDITAR, recCtrl.generarPlan);
r.patch("/:id/plan/:itemId", PUEDE_EDITAR, validar(planItemSchema, "body"), recCtrl.actualizarItem);

// Informe
r.get("/:id/informe", reporteCtrl.informe);
r.get("/:id/informe.html", reporteCtrl.informeHTML);

export default r;
