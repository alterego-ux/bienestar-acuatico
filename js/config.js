/* =====================================================================
   Configuración del cliente · Bienestar Acuático
   ---------------------------------------------------------------------
   APP_CONFIG controla la comunicación con la API REST. No requiere
   build: se define como variable global antes de cargar los servicios.

   MODO:
     "local" → solo localStorage + IndexedDB (comportamiento histórico).
     "api"   → usa la API (Node.js + Express + PostgreSQL).
     "auto"  → intenta la API y, si no responde, cae a local (por defecto).
   ===================================================================== */
(function () {
  "use strict";

  // Permite sobreescribir con ?api=http://host:4000/api o ?modo=api
  var params = new URLSearchParams(location.search);
  var origen = /^https?:$/.test(location.protocol) ? location.origin : "http://localhost:4000";
  var apiPorDefecto = origen.replace(/\/$/, "") + "/api";

  window.APP_CONFIG = {
    API_URL: params.get("api") || apiPorDefecto,
    MODO: (params.get("modo") || "auto").toLowerCase(),
    TIMEOUT_MS: 12000,
    TOKEN_KEY: "bienestar_api_token",
    USUARIO_KEY: "bienestar_api_usuario",
    // Sonda de disponibilidad del backend.
    SALUD: "/salud",
    VERSION: "2.0.0",
  };

  // Normaliza valores no válidos.
  if (["api", "local", "auto"].indexOf(window.APP_CONFIG.MODO) < 0) {
    window.APP_CONFIG.MODO = "auto";
  }
})();
