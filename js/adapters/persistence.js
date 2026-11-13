/* =====================================================================
   Persistencia · adaptador dual (localStorage ↔ API PostgreSQL)
   ---------------------------------------------------------------------
   Contrato `Persistencia` con dos implementaciones:

     · LocalStorageAdapter → comportamiento histórico (localStorage +
       IndexedDB). El estado global `S` sigue siendo la fuente de verdad
       para el renderizado, por lo que el prototipo funciona 100 % sin
       servidor.

     · ApiAdapter → empuja las operaciones a la API REST (Node.js +
       Express + PostgreSQL) usando los servicios de `js/services`.

   El modo se elige con APP_CONFIG.MODO = "local" | "api" | "auto".
   En "auto" se sondea `/api/salud` y, si el backend responde, se activa
   la sincronización; si no, se opera en local.

   La sincronización es *no bloqueante*: si una operación remota falla,
   el trabajo local se conserva y el aviso queda registrado en
   `Persistencia.estado().avisos`.
   ===================================================================== */
(function () {
  "use strict";

  var cfg = window.APP_CONFIG || { MODO: "local", API_URL: "/api" };

  /* Referencia segura al estado global `S`. En `js/storage.js` se declara con
     `let S = null`, de modo que es un enlace léxico global y NO una propiedad
     de `window`; por eso no sirve `window.S`. El try/catch evita el TDZ si la
     función se llamara antes de que storage.js se inicialice. */
  function estadoGlobal() {
    try { return typeof S !== "undefined" ? S : null; } catch (e) { return null; }
  }

  var estado = {
    modo: cfg.MODO || "auto",
    apiActiva: false,
    online: false,
    usuarioApi: null,
    avisos: [],
    ultimaSync: null,
    pendientes: 0,
  };

  function log(msg) {
    estado.avisos.unshift({ t: new Date().toLocaleString("es-CO"), m: msg });
    estado.avisos = estado.avisos.slice(0, 50);
    if (window.console) console.warn("[Persistencia]", msg);
  }
  function marcarOffline(err) {
    if (err && (err.codigo === "RED" || err.codigo === "TIMEOUT")) {
      estado.online = false;
      estado.apiActiva = false;
      log("Sin conexión con la API. Se continúa en modo local.");
    } else {
      log("Error de sincronización: " + (err && (err.mensaje || err.message) ? (err.mensaje || err.message) : err));
    }
  }

  function api() {
    return window.Servicios || {};
  }
  function esApi() {
    return estado.modo === "api" || (estado.modo === "auto" && estado.online);
  }

  /* ---------- Mapa de identificadores local → servidor ---------- */
  function sync() {
    var s = estadoGlobal();
    if (s && !s.syncIds) s.syncIds = { predios: {}, evals: {} };
    if (s && !s.syncIds.predios) s.syncIds.predios = {};
    if (s && !s.syncIds.evals) s.syncIds.evals = {};
    return s ? s.syncIds : { predios: {}, evals: {} };
  }
  function guardarLocal() {
    if (typeof window.save === "function") {
      try { window.save(); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- Cola de operaciones (fire-and-forget seguro) ---------- */
  function ejecutar(nombre, fn) {
    if (!esApi()) return Promise.resolve(null);
    estado.pendientes++;
    return Promise.resolve()
      .then(fn)
      .then(function (r) {
        estado.ultimaSync = new Date().toISOString();
        return r;
      })
      .catch(function (e) {
        marcarOffline(e);
        return null;
      })
      .finally(function () { estado.pendientes--; });
  }

  /* =================================================================
     ApiAdapter · operaciones contra el servidor
     ================================================================= */
  var Api = {
    /* Asegura que exista el predio en el servidor y devuelve su id. */
    async asegurarPredio(predioLocal) {
      var ids = sync().predios;
      if (ids[predioLocal.id]) return ids[predioLocal.id];
      var creado = await api().Predio.crear(payloadPredio(predioLocal));
      ids[predioLocal.id] = creado.id;
      guardarLocal();
      return creado.id;
    },
    async guardarPredio(predioLocal) {
      var ids = sync().predios;
      if (ids[predioLocal.id]) {
        await api().Predio.actualizar(ids[predioLocal.id], payloadPredio(predioLocal));
        return ids[predioLocal.id];
      }
      return this.asegurarPredio(predioLocal);
    },
    async eliminarPredio(idLocal) {
      var ids = sync().predios;
      if (!ids[idLocal]) return;
      await api().Predio.eliminar(ids[idLocal]);
      delete ids[idLocal];
      guardarLocal();
    },
    async asegurarEvaluacion(evalLocal) {
      var ids = sync().evals;
      if (ids[evalLocal.id]) return ids[evalLocal.id];
      var predioApi = await this.asegurarPredio(predioPorId(evalLocal.pid));
      var creada = await api().Evaluacion.crear(payloadEvaluacion(evalLocal, predioApi));
      ids[evalLocal.id] = creada.id;
      guardarLocal();
      return creada.id;
    },
    async guardarEvaluacion(evalLocal) {
      var ids = sync().evals;
      if (ids[evalLocal.id]) {
        await api().Evaluacion.actualizar(ids[evalLocal.id], {
          fecha: evalLocal.fecha,
          reg: evalLocal.reg,
          lotes: evalLocal.lotes,
          estado: mapearEstado(evalLocal.est),
          sel: evalLocal.sel || [],
        });
        return ids[evalLocal.id];
      }
      return this.asegurarEvaluacion(evalLocal);
    },
    async eliminarEvaluacion(idLocal) {
      var ids = sync().evals;
      if (!ids[idLocal]) return;
      await api().Evaluacion.eliminar(ids[idLocal]);
      delete ids[idLocal];
      guardarLocal();
    },
    async guardarRespuesta(evalLocal, codigo, resp) {
      var evalId = await this.asegurarEvaluacion(evalLocal);
      return api().Evaluacion.guardarRespuesta(evalId, codigo, {
        score: resp && resp.score !== undefined ? resp.score : null,
        obs: (resp && resp.obs) || "",
        calc: (resp && resp.calc) || null,
      });
    },
    async finalizar(evalLocal) {
      var evalId = await this.asegurarEvaluacion(evalLocal);
      await api().Evaluacion.finalizar(evalId);
      // Genera recomendaciones y plan en el servidor a partir del cálculo.
      try { await api().Recomendacion.generar(evalId); } catch (e) { /* opcional */ }
      return evalId;
    },
    async cambiarEstado(evalLocal, estadoNuevo) {
      var evalId = await this.asegurarEvaluacion(evalLocal);
      return api().Evaluacion.cambiarEstado(evalId, mapearEstado(estadoNuevo));
    },
    async recomendaciones(evalLocal) {
      var evalId = await this.asegurarEvaluacion(evalLocal);
      return api().Recomendacion.generar(evalId);
    },
    async plan(evalLocal) {
      var evalId = await this.asegurarEvaluacion(evalLocal);
      return api().Recomendacion.generarPlan(evalId);
    },
    async evidencia(evalLocal, codigo, archivo) {
      var evalId = await this.asegurarEvaluacion(evalLocal);
      var r = await api().Evaluacion.porId(evalId);
      var resp = (r && r.evaluacion && r.evaluacion.resp && r.evaluacion.resp[codigo]) || null;
      if (!resp || !resp.id) return null;
      return api().Evidencia.subir(resp.id, archivo);
    },
    async crearUsuario(datos) { return api().Usuario.crear(datos); },
    async actualizarUsuario(id, datos) { return api().Usuario.actualizar(id, datos); },
  };

  /* ---------- Traductores local → API ---------- */
  function predioPorId(id) {
    var s = estadoGlobal();
    return (s && s.predios.find(function (p) { return p.id === id; })) || null;
  }
  function payloadPredio(p) {
    return {
      cod: p.cod, n: p.n, resp: p.resp, mail: p.mail, tipo: p.tipo,
      sis: p.sis || [], dep: p.dep, mun: p.mun, ver: p.ver, dir: p.dir,
      lat: p.lat === "" ? null : p.lat, lng: p.lng === "" ? null : p.lng,
      act: p.act !== false,
      inv: (p.inv || []).map(function (r) {
        return { esp: r.esp, cant: Number(r.cant) || 0, peso: Number(r.peso) || 0, lotes: Number(r.lotes) || 0 };
      }),
    };
  }
  function payloadEvaluacion(e, predioApi) {
    return {
      pid: predioApi, fecha: e.fecha, ev: e.ev, reg: e.reg, esp: e.esp,
      lotes: Number(e.lotes) || 0, sel: e.sel || [], peces: e.peces || null,
    };
  }
  function mapearEstado(est) {
    return { borrador: "borrador", en_proceso: "en_proceso", finalizada: "finalizada", validada: "validada", cerrada: "cerrada" }[est] || "en_proceso";
  }

  /* =================================================================
     LocalStorageAdapter · delegación al comportamiento histórico
     ================================================================= */
  var Local = {
    login: function (email, password) {
      var s = estadoGlobal();
      if (!s || !s.users || !email) return { ok: false, usuario: null, origen: "local" };
      var x = s.users.find(function (a) { return a.e.toLowerCase() === email.toLowerCase() && a.p === password; });
      return { ok: !!x, usuario: x || null, origen: "local" };
    },
    // El resto de operaciones ya las realiza app.js directamente sobre S.
  };

  /* =================================================================
     Fachada Persistencia
     ================================================================= */
  var Persistencia = {
    estado: function () { return estado; },
    esApi: esApi,

    /** Inicializa el modo y sondea el backend si MODO === "auto". */
    async iniciar() {
      sync(); // asegura el mapa de ids en S
      if (estado.modo === "local") {
        estado.apiActiva = false;
        estado.online = false;
        return estado;
      }
      var ok = await (window.ApiClient ? window.ApiClient.disponible() : Promise.resolve(false));
      estado.online = ok;
      estado.apiActiva = ok;
      if (estado.modo === "api" && !ok) {
        log("La API no responde: se opera en local hasta que vuelva.");
      } else if (ok) {
        log("API conectada (" + (cfg.API_URL || "") + "). Sincronización activa.");
      }
      return estado;
    },

    /** Login: intenta la API y ofrece respaldo local. */
    async login(email, password) {
      var local = Local.login(email, password);
      if (esApi() && window.Servicios && window.Servicios.Auth) {
        try {
          var d = await window.Servicios.Auth.login(email, password);
          estado.usuarioApi = d.usuario || null;
          estado.online = true;
          estado.apiActiva = true;
          return { ok: true, usuario: d.usuario, origen: "api", token: d.token };
        } catch (e) {
          // Si es un error de credenciales, informa; si es de red, cae a local.
          if (e.codigo !== "RED" && e.codigo !== "TIMEOUT") {
            estado.usuarioApi = null;
            if (local.ok) return { ok: true, usuario: local.usuario, origen: "local" };
            return { ok: false, error: e, origen: "api" };
          }
          marcarOffline(e);
        }
      }
      return local;
    },

    /** Registro de usuario: crea también la cuenta en el servidor. */
    async registrar(datos) {
      if (!esApi() || !window.Servicios || !window.Servicios.Auth) return { ok: false, origen: "local" };
      try {
        var u = await window.Servicios.Auth.registro(datos);
        return { ok: true, usuario: u, origen: "api" };
      } catch (e) {
        marcarOffline(e);
        return { ok: false, error: e, origen: "api" };
      }
    },

    logout() {
      if (window.Servicios && window.Servicios.Auth) window.Servicios.Auth.logout();
      estado.usuarioApi = null;
    },

    // ---- Escrituras (no bloqueantes) ----
    predioGuardado: function (p) { return ejecutar("predio", function () { return Api.guardarPredio(p); }); },
    predioEliminado: function (id) { return ejecutar("predio", function () { return Api.eliminarPredio(id); }); },
    evaluacionGuardada: function (e) { return ejecutar("evaluacion", function () { return Api.guardarEvaluacion(e); }); },
    evaluacionEliminada: function (id) { return ejecutar("evaluacion", function () { return Api.eliminarEvaluacion(id); }); },
    respuestaGuardada: function (e, codigo, resp) { return ejecutar("respuesta", function () { return Api.guardarRespuesta(e, codigo, resp); }); },
    finalizada: function (e) { return ejecutar("finalizar", function () { return Api.finalizar(e); }); },
    estadoCambiado: function (e, s) { return ejecutar("estado", function () { return Api.cambiarEstado(e, s); }); },
    recomendaciones: function (e) { return ejecutar("recomendaciones", function () { return Api.recomendaciones(e); }); },
    plan: function (e) { return ejecutar("plan", function () { return Api.plan(e); }); },
    evidencia: function (e, codigo, archivo) { return ejecutar("evidencia", function () { return Api.evidencia(e, codigo, archivo); }); },
    usuarioGuardado: function (id, datos) {
      return ejecutar("usuario", function () {
        return id ? Api.actualizarUsuario(id, datos) : Api.crearUsuario(datos);
      });
    },

    /**
     * Sube al servidor todo el estado local (predios + evaluaciones).
     * Útil como acción manual desde Configuración.
     */
    async subirTodo() {
      if (!esApi()) throw (window.ApiClient ? window.ApiClient.ErrorApi("OFFLINE", "La API no está disponible.") : new Error("offline"));
      var s = estadoGlobal();
      if (!s) throw (window.ApiClient ? window.ApiClient.ErrorApi("SIN_ESTADO", "No hay estado local para sincronizar.") : new Error("sin estado"));
      var res = { predios: 0, evaluaciones: 0, errores: [] };
      for (var i = 0; i < s.predios.length; i++) {
        try { await Api.guardarPredio(s.predios[i]); res.predios++; }
        catch (e) { res.errores.push("Predio " + s.predios[i].cod + ": " + e.message); }
      }
      for (var j = 0; j < s.evals.length; j++) {
        try {
          var e = s.evals[j];
          await Api.asegurarEvaluacion(e);
          var codigos = Object.keys(e.resp || {});
          for (var k = 0; k < codigos.length; k++) {
            await Api.guardarRespuesta(e, codigos[k], e.resp[codigos[k]]);
          }
          if (["finalizada", "validada", "cerrada"].indexOf(e.est) >= 0) {
            try { await api().Recomendacion.generar(sync().evals[e.id]); } catch (x) { /* opcional */ }
          }
          res.evaluaciones++;
        } catch (e2) { res.errores.push("Evaluación " + s.evals[j].id + ": " + e2.message); }
      }
      estado.ultimaSync = new Date().toISOString();
      return res;
    },

    api: Api,
    local: Local,
  };

  window.Persistencia = Persistencia;
})();
