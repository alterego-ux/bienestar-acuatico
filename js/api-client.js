/* =====================================================================
   ApiClient · cliente HTTP de la API REST (prototipo académico)
   ---------------------------------------------------------------------
   - Adjunta el token Bearer guardado en el almacenamiento local.
   - Serializa JSON, maneja multipart (evidencias) y errores normalizados.
   - Timeout configurable y detección de disponibilidad del backend.
   Se expone como window.ApiClient.
   ===================================================================== */
(function () {
  "use strict";

  var cfg = window.APP_CONFIG || {};

  function token() {
    try {
      return localStorage.getItem(cfg.TOKEN_KEY) || null;
    } catch (e) {
      return null;
    }
  }
  function guardarToken(t) {
    try {
      if (t) localStorage.setItem(cfg.TOKEN_KEY, t);
      else localStorage.removeItem(cfg.TOKEN_KEY);
    } catch (e) {
      /* almacenamiento no disponible */
    }
  }
  function usuario() {
    try {
      return JSON.parse(localStorage.getItem(cfg.USUARIO_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function guardarUsuario(u) {
    try {
      if (u) localStorage.setItem(cfg.USUARIO_KEY, JSON.stringify(u));
      else localStorage.removeItem(cfg.USUARIO_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  /** Error normalizado con código, mensaje, detalles y estado HTTP. */
  function ErrorApi(codigo, mensaje, detalles, estado) {
    var e = new Error(mensaje || "Error de la API");
    e.name = "ErrorApi";
    e.codigo = codigo || "ERROR";
    e.detalles = detalles || null;
    e.estado = estado || 0;
    return e;
  }

  function construirUrl(ruta) {
    if (/^https?:\/\//i.test(ruta)) return ruta;
    var base = String(cfg.API_URL || "/api").replace(/\/$/, "");
    return base + (ruta.charAt(0) === "/" ? ruta : "/" + ruta);
  }

  /**
   * Petición genérica.
   * @param {string} ruta
   * @param {Object} [opciones] { metodo, cuerpo, multipart, señal, sinAuth }
   * @returns {Promise<any>} datos (campo `datos` de la respuesta)
   */
  async function peticion(ruta, opciones) {
    opciones = opciones || {};
    var controlador = new AbortController();
    var temporizador = setTimeout(function () { controlador.abort(); }, cfg.TIMEOUT_MS || 12000);

    var cabeceras = {};
    var t = token();
    if (t && !opciones.sinAuth) cabeceras["Authorization"] = "Bearer " + t;

    var cuerpo;
    if (opciones.multipart) {
      cuerpo = opciones.cuerpo; // FormData: no fijar Content-Type
    } else if (opciones.cuerpo !== undefined) {
      cabeceras["Content-Type"] = "application/json";
      cuerpo = JSON.stringify(opciones.cuerpo);
    }

    try {
      var resp = await fetch(construirUrl(ruta), {
        method: opciones.metodo || "GET",
        headers: cabeceras,
        body: cuerpo,
        signal: controlador.signal,
        credentials: "omit",
      });
      var texto = await resp.text();
      var json = null;
      try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }

      if (!resp.ok) {
        var err = (json && json.error) || {};
        throw ErrorApi(err.codigo || "HTTP_" + resp.status, err.mensaje || "Error " + resp.status, err.detalles, resp.status);
      }
      if (json && Object.prototype.hasOwnProperty.call(json, "datos")) return json.datos;
      return json;
    } catch (e) {
      if (e && e.name === "AbortError") throw ErrorApi("TIMEOUT", "La petición tardó demasiado.", null, 0);
      if (e && e.name === "ErrorApi") throw e;
      throw ErrorApi("RED", "No se pudo contactar el servidor.", String(e && e.message), 0);
    } finally {
      clearTimeout(temporizador);
    }
  }

  var ApiClient = {
    peticion: peticion,
    token: token,
    guardarToken: guardarToken,
    usuario: usuario,
    guardarUsuario: guardarUsuario,
    ErrorApi: ErrorApi,

    /** Comprueba si el backend responde. */
    async disponible() {
      try {
        var d = await peticion(cfg.SALUD || "/salud", { sinAuth: true });
        return !!(d && d.ok);
      } catch (e) {
        return false;
      }
    },

    // Atajos
    get: function (ruta) { return peticion(ruta, { metodo: "GET" }); },
    post: function (ruta, cuerpo) { return peticion(ruta, { metodo: "POST", cuerpo: cuerpo }); },
    put: function (ruta, cuerpo) { return peticion(ruta, { metodo: "PUT", cuerpo: cuerpo }); },
    patch: function (ruta, cuerpo) { return peticion(ruta, { metodo: "PATCH", cuerpo: cuerpo }); },
    del: function (ruta) { return peticion(ruta, { metodo: "DELETE" }); },
    subir: function (ruta, formData) { return peticion(ruta, { metodo: "POST", multipart: true, cuerpo: formData }); },
  };

  window.ApiClient = ApiClient;
})();
