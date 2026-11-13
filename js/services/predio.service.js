/* =====================================================================
   PredioService · CRUD de predios contra la API
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Predio = {
    listar: function (texto) {
      return A.get("/predios" + (texto ? "?q=" + encodeURIComponent(texto) : ""));
    },
    porId: function (id) { return A.get("/predios/" + id); },
    crear: function (predio) { return A.post("/predios", predio); },
    actualizar: function (id, predio) { return A.put("/predios/" + id, predio); },
    eliminar: function (id) { return A.del("/predios/" + id); },
  };
})();
