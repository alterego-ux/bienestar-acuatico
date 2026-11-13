/* =====================================================================
   Controlador · catálogos
   ===================================================================== */
import cat from "../services/catalogo.service.js";
import { asyncHandler, ok } from "../utils/http.js";

export const modalidades = asyncHandler(async (req, res) => ok(res, await cat.modalidades()));
export const tiposMedida = asyncHandler(async (req, res) => ok(res, await cat.tiposMedida()));
export const especies = asyncHandler(async (req, res) => ok(res, await cat.especies({ soloActivas: req.query.activas === "1" })));
export const sistemas = asyncHandler(async (req, res) => ok(res, await cat.sistemas()));
export const tiposProductor = asyncHandler(async (req, res) => ok(res, await cat.tiposProductor()));
export const departamentos = asyncHandler(async (req, res) => ok(res, await cat.departamentosConMunicipios()));
export const municipios = asyncHandler(async (req, res) => ok(res, await cat.municipios(Number(req.params.id))));
export const categorias = asyncHandler(async (req, res) => ok(res, await cat.categorias()));
export const libertades = asyncHandler(async (req, res) => ok(res, await cat.libertades()));
export const reglasMuestreo = asyncHandler(async (req, res) => ok(res, await cat.reglasMuestreo()));
export const reglasProfundidad = asyncHandler(async (req, res) => ok(res, await cat.reglasProfundidad()));
export const indicadores = asyncHandler(async (req, res) => ok(res, await cat.indicadores({ modalidad: req.query.modalidad })));
export const niveles = asyncHandler(async (req, res, next) => {
  const nv = await cat.nivelesDe(req.params.codigo);
  if (!nv) return next(Object.assign(new Error("Indicador no encontrado"), { estado: 404 }));
  return ok(res, nv);
});

export default {
  modalidades, tiposMedida, especies, sistemas, tiposProductor, departamentos, municipios,
  categorias, libertades, reglasMuestreo, reglasProfundidad, indicadores, niveles,
};
