/* =====================================================================
   Controlador · tablero
   ===================================================================== */
import dashboardService from "../services/dashboard.service.js";
import { asyncHandler, ok } from "../utils/http.js";

export const resumen = asyncHandler(async (req, res) =>
  ok(res, await dashboardService.resumen({
    predioId: req.query.predio ? Number(req.query.predio) : undefined,
    especieId: req.query.especie ? Number(req.query.especie) : undefined,
  }))
);

export default { resumen };
