/* =====================================================================
   EvidenciaService · subida y consulta de evidencias (multipart)
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Evidencia = {
    subir: function (respuestaId, archivo) {
      var fd = new FormData();
      fd.append("respuesta_id", respuestaId);
      fd.append("archivo", archivo, archivo.name);
      return A.subir("/evidencias", fd);
    },
    listar: function (respuestaId) { return A.get("/evidencias/" + respuestaId); },
    eliminar: function (id) { return A.del("/evidencias/" + id); },
  };
})();
