import { Router } from "express";
import chatbotController from "../controllers/chatbot.controller.js";
import { autenticar, requiereRol } from "../middlewares/auth.js";
import { validar } from "../middlewares/validate.js";
import { chatbotSchema } from "./schemas.js";

const r = Router();
r.use(autenticar);
r.post("/message", validar(chatbotSchema, "body"), chatbotController.mensaje);
r.post("/recomendaciones/:id", requiereRol("admin", "docente", "evaluador"), chatbotController.recomendaciones);
export default r;
