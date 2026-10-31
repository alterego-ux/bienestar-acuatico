/* =====================================================================
   EvaluacionService · evaluaciones, respuestas y ciclo de vida
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Evaluacion = {
    listar: function (filtros) {
      filtros = filtros || {};
      var qs = Object.keys(filtros)
        .filter(function (k) { return filtros[k] !== undefined && filtros[k] !== null && filtros[k] !== ""; })
        .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(filtros[k]); })
        .join("&");
      return A.get("/evaluaciones" + (qs ? "?" + qs : ""));
    },
    porId: function (id) { return A.get("/evaluaciones/" + id); },
    crear: function (evaluacion) { return A.post("/evaluaciones", evaluacion); },
    actualizar: function (id, datos) { return A.put("/evaluaciones/" + id, datos); },
    eliminar: function (id) { return A.del("/evaluaciones/" + id); },
    respuestas: function (id) { return A.get("/evaluaciones/" + id + "/respuestas"); },
    guardarRespuesta: function (id, codigoIndicador, respuesta) {
      return A.put("/evaluaciones/" + id + "/respuestas/" + encodeURIComponent(codigoIndicador), respuesta);
    },
    finalizar: function (id) { return A.post("/evaluaciones/" + id + "/finalizar", {}); },
    reabrir: function (id) { return A.post("/evaluaciones/" + id + "/reabrir", {}); },
    recalcular: function (id) { return A.post("/evaluaciones/" + id + "/recalcular", {}); },
    cambiarEstado: function (id, estado) { return A.patch("/evaluaciones/" + id + "/estado", { estado: estado }); },
    comparar: function (a, b) { return A.get("/evaluaciones/comparar?a=" + a + "&b=" + b); },
  };
})();
