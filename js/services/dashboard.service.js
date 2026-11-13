/* =====================================================================
   DashboardService · indicadores agregados
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Dashboard = {
    resumen: function (filtros) {
      filtros = filtros || {};
      var qs = Object.keys(filtros)
        .filter(function (k) { return filtros[k] !== undefined && filtros[k] !== null && filtros[k] !== ""; })
        .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(filtros[k]); })
        .join("&");
      return A.get("/dashboard/resumen" + (qs ? "?" + qs : ""));
    },
  };
})();
