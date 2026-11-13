/* =====================================================================
   Controlador · informes y comparación
   ===================================================================== */
import reporteService from "../services/reporte.service.js";
import { asyncHandler, ok } from "../utils/http.js";

export const informe = asyncHandler(async (req, res) => ok(res, await reporteService.informeData(Number(req.params.id))));

export const informeHTML = asyncHandler(async (req, res) => {
  const html = await reporteService.informeHTML(Number(req.params.id));
  res.type("html").send(html);
});

export const comparar = asyncHandler(async (req, res) =>
  ok(res, await reporteService.comparar(Number(req.query.a), Number(req.query.b)))
);

export default { informe, informeHTML, comparar };
