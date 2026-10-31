/* =====================================================================
   CatalogoService · catálogos ICA servidos por la API
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Catalogo = {
    modalidades: function () { return A.get("/catalogos/modalidades"); },
    tiposMedida: function () { return A.get("/catalogos/tipos-medida"); },
    especies: function () { return A.get("/catalogos/especies"); },
    sistemas: function () { return A.get("/catalogos/sistemas"); },
    tiposProductor: function () { return A.get("/catalogos/tipos-productor"); },
    departamentos: function () { return A.get("/catalogos/departamentos"); },
    municipios: function (depId) { return A.get("/catalogos/departamentos/" + depId + "/municipios"); },
    categorias: function () { return A.get("/catalogos/categorias"); },
    libertades: function () { return A.get("/catalogos/libertades"); },
    indicadores: function (modalidad) {
      return A.get("/catalogos/indicadores" + (modalidad ? "?modalidad=" + encodeURIComponent(modalidad) : ""));
    },
    niveles: function (codigo) { return A.get("/catalogos/indicadores/" + encodeURIComponent(codigo) + "/niveles"); },
  };
})();
