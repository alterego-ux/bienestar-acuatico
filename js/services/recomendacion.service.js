/* =====================================================================
   RecomendacionService · recomendaciones y plan de mejora
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Recomendacion = {
    generar: function (evaluacionId) { return A.post("/evaluaciones/" + evaluacionId + "/recomendaciones", {}); },
    listar: function (evaluacionId) { return A.get("/evaluaciones/" + evaluacionId + "/recomendaciones"); },
    generarPlan: function (evaluacionId) { return A.post("/evaluaciones/" + evaluacionId + "/plan", {}); },
    plan: function (evaluacionId) { return A.get("/evaluaciones/" + evaluacionId + "/plan"); },
    actualizarItem: function (evaluacionId, itemId, cambios) {
      return A.patch("/evaluaciones/" + evaluacionId + "/plan/" + itemId, cambios);
    },
  };
})();
