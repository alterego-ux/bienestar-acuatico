/* =====================================================================
   Controlador · auditoría
   ===================================================================== */
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { asyncHandler, ok } from "../utils/http.js";

export const listar = asyncHandler(async (req, res) =>
  ok(res, await auditoriaRepo.listar({
    entidad: req.query.entidad,
    usuarioId: req.query.usuario ? Number(req.query.usuario) : undefined,
    limite: req.query.limite,
  }))
);

export default { listar };
