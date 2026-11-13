/* =====================================================================
   CalculoService · cálculo del puntaje ICA
   ---------------------------------------------------------------------
   El cálculo vive en el cliente (js/app.js: calc/clsOf) para permitir el
   trabajo offline y coincide con el dominio del backend (probado en
   backend/tests/calculo.test.js). Este servicio expone además el
   recálculo autoritativo del servidor.
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Calculo = {
    /** Cálculo local (fallback offline). `calc` es global en app.js. */
    calcularLocal: function (evaluacion) {
      return typeof window.calc === "function" ? window.calc(evaluacion) : null;
    },
    clasificar: function (total) {
      if (total === null || total === undefined || isNaN(total)) return null;
      return total >= 90 ? "Excelente" : total >= 75 ? "Alto" : total >= 50 ? "Medio" : "Bajo";
    },
    /** Pide al servidor recalcular y persistir el puntaje global. */
    recalcular: function (evaluacionId) { return A.post("/evaluaciones/" + evaluacionId + "/recalcular", {}); },
  };
})();
