/* =====================================================================
   UsuarioService · administración de usuarios (solo admin)
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Usuario = {
    listar: function (activo) {
      return A.get("/usuarios" + (activo === undefined ? "" : "?activo=" + (activo ? "1" : "0")));
    },
    roles: function () { return A.get("/usuarios/roles"); },
    crear: function (usuario) { return A.post("/usuarios", usuario); },
    actualizar: function (id, datos) { return A.put("/usuarios/" + id, datos); },
    alternar: function (id) { return A.patch("/usuarios/" + id + "/activo", {}); },
  };
})();
