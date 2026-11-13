/* =====================================================================
   Rutas · autenticación
   ===================================================================== */
import { Router } from "express";
import ctrl from "../controllers/auth.controller.js";
import { validar } from "../middlewares/validate.js";
import { autenticar } from "../middlewares/auth.js";
import { loginSchema, registroSchema, cambiarClaveSchema } from "./schemas.js";

const r = Router();

r.post("/login", validar(loginSchema), ctrl.login);
r.post("/registro", validar(registroSchema), ctrl.registro);
r.get("/me", autenticar, ctrl.me);
r.post("/cambiar-clave", autenticar, validar(cambiarClaveSchema), ctrl.cambiarClave);

export default r;
