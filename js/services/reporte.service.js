/* =====================================================================
   ReporteService · informes, comparación y descarga de HTML
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  function urlInforme(id) {
    var base = String((window.APP_CONFIG || {}).API_URL || "/api").replace(/\/$/, "");
    return base + "/reportes/" + id + "/html";
  }

  window.Servicios.Reporte = {
    informe: function (evaluacionId) { return A.get("/reportes/" + evaluacionId); },
    comparar: function (a, b) { return A.get("/reportes/comparar?a=" + a + "&b=" + b); },
    /** Devuelve el HTML del informe (texto) desde la API. */
    informeHTML: async function (id) {
      var resp = await fetch(urlInforme(id), {
        headers: A.token() ? { Authorization: "Bearer " + A.token() } : {},
      });
      if (!resp.ok) throw A.ErrorApi("INFORME", "No se pudo obtener el informe.", null, resp.status);
      return resp.text();
    },
    urlInforme: urlInforme,
    /** Abre el informe imprimible en una pestaña nueva. */
    abrirInforme: function (id) { window.open(urlInforme(id), "_blank"); },
  };
})();
