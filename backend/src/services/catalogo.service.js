/* =====================================================================
   Servicio · catálogos
   ===================================================================== */
import cat from "../repositories/indicador.repo.js";

export const modalidades = () => cat.modalidades();
export const tiposMedida = () => cat.tiposMedida();
export const especies = ({ soloActivas } = {}) => cat.especies({ soloActivas });
export const sistemas = () => cat.sistemaProductivo();
export const tiposProductor = () => cat.tiposProductor();
export const departamentos = () => cat.departamentos();
export const municipios = (depId) => cat.municipios(depId);
export const departamentosConMunicipios = () => cat.departamentosConMunicipios();
export const categorias = () => cat.categorias();
export const libertades = () => cat.libertades();
export const indicadores = (opciones) => cat.indicadores(opciones);
export const reglasMuestreo = () => cat.reglasMuestreo();
export const reglasProfundidad = () => cat.reglasProfundidad();

export async function nivelesDe(codigo) {
  const lista = await cat.indicadores({});
  const ind = lista.find((i) => i.codigo === codigo);
  return ind ? ind.niveles : null;
}

export default {
  modalidades, tiposMedida, especies, sistemas, tiposProductor, departamentos, municipios,
  departamentosConMunicipios, categorias, libertades, indicadores, reglasMuestreo,
  reglasProfundidad, nivelesDe,
};
