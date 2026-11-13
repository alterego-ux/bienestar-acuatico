/* =====================================================================
   AuthService · autenticación contra la API
   ===================================================================== */
(function () {
  "use strict";
  window.Servicios = window.Servicios || {};
  var A = window.ApiClient;

  window.Servicios.Auth = {
    async login(email, password) {
      var d = await A.post("/auth/login", { email: email, password: password });
      if (d && d.token) {
        A.guardarToken(d.token);
        A.guardarUsuario(d.usuario);
      }
      return d;
    },
    async registro(datos) {
      return A.post("/auth/registro", datos);
    },
    async me() {
      return A.get("/auth/me");
    },
    async cambiarClave(actual, nueva) {
      return A.post("/auth/cambiar-clave", { actual: actual, nueva: nueva });
    },
    logout() {
      A.guardarToken(null);
      A.guardarUsuario(null);
    },
    sesion: function () { return A.usuario(); },
    autenticado: function () { return !!A.token(); },
  };
})();
