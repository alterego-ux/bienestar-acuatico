# Plan de implementación — Backend Node.js/Express + PostgreSQL y renovación de UI

Documento derivado de `docs/DISENO_BASE_DATOS_UML.md` (ER + Clases + Secuencia, ya aprobados).
Objetivo: sustituir la persistencia local (`localStorage` + `IndexedDB`) por una base de datos
relacional PostgreSQL expuesta mediante una API REST en Node.js/Express, sin perder ninguna
funcionalidad del prototipo, y renovar la interfaz con el tema neón-acuático e imágenes reales.

> Recordatorio académico: el prototipo sigue **sin ser una herramienta oficial del ICA**.
> Se conserva 23 indicadores PMG / 15 AREL (no se inventa un 24.º).

---

## 0. Resumen de fases

| Fase | Entregable | Depende de |
|---|---|---|
| 0 | Estructura del repositorio (`backend/` + `frontend/`) y dependencias | — |
| 1 | Esquema SQL (migración 001) + runner de migraciones | 0 |
| 2 | Catálogos ICA semilla (migración 002) desde `js/data.js` | 1 |
| 3 | Autenticación (login/JWT/roles) + usuarios demo (migración 003) | 1 |
| 4 | API de predios y catálogos (CRUD) | 3 |
| 5 | API de evaluaciones + respuestas de indicadores | 4 |
| 6 | Dominio de cálculo ICA + cierre y clasificación | 5 |
| 7 | Recomendaciones + plan de mejora | 6 |
| 8 | Evidencias (subida multipart) | 5 |
| 9 | Informes/comparativas/tablero/auditoría | 7,8 |
| 10 | Adaptadores de persistencia y `ApiClient` en el frontend | 4–9 |
| 11 | Refactor de `app.js`/`landing.js` para consumir servicios | 10 |
| 12 | Tema neón-acuático, animaciones e imágenes | 11 |
| 13 | Pruebas (`tests/`), documentación y datos demo | 12 |

Regla de oro: cada fase deja el sistema **funcionando**. Mientras el backend no esté listo,
el frontend sigue operando en modo local vía `LocalStorageAdapter`.

---

## 1. Estructura de carpetas propuesta

```
Bienestar_Acuatico_Neon_Aquaculture/
├─ backend/
│  ├─ package.json
│  ├─ .env.example
│  ├─ src/
│  │  ├─ index.js                 # arranque de Express
│  │  ├─ app.js                   # middlewares + montaje de rutas
│  │  ├─ config/
│  │  │  ├─ env.js                # lectura/validación de variables de entorno
│  │  │  └─ db.js                 # pool pg + helpers query() y transaccion()
│  │  ├─ db/
│  │  │  ├─ migrations/
│  │  │  │  ├─ 001_init.sql
│  │  │  │  ├─ 002_catalogos_ica.sql
│  │  │  │  └─ 003_usuarios_demo.sql
│  │  │  ├─ migrate.js            # ejecuta migraciones en orden
│  │  │  └─ seed.js               # carga catálogos desde data/catalogo-ica.json
│  │  ├─ middlewares/
│  │  │  ├─ auth.js               # verifica JWT + guardia por rol
│  │  │  ├─ validate.js           # validación de cuerpos (zod)
│  │  │  ├─ upload.js             # multer para evidencias
│  │  │  └─ errors.js             # manejador central de errores
│  │  ├─ domain/                  # lógica pura, testeable, sin Express/SQL
│  │  │  ├─ calculo.js            # puntaje global y por tipo de medida
│  │  │  ├─ clasificacion.js      # Bajo/Medio/Alto/Excelente
│  │  │  ├─ muestreo.js           # reglas de muestreo por modalidad
│  │  │  ├─ reglas.js             # profundidad, mortalidad, agua por especie
│  │  │  └─ recomendaciones.js    # motor de recomendaciones
│  │  ├─ repositories/            # acceso a datos (SQL parametrizado)
│  │  │  ├─ usuario.repo.js
│  │  │  ├─ predio.repo.js
│  │  │  ├─ indicador.repo.js
│  │  │  ├─ evaluacion.repo.js
│  │  │  ├─ reporte.repo.js
│  │  │  └─ auditoria.repo.js
│  │  ├─ services/                # orquestación de casos de uso
│  │  │  ├─ auth.service.js
│  │  │  ├─ predio.service.js
│  │  │  ├─ catalogo.service.js
│  │  │  ├─ evaluacion.service.js
│  │  │  ├─ calculo.service.js
│  │  │  ├─ recomendacion.service.js
│  │  │  ├─ evidencia.service.js
│  │  │  ├─ reporte.service.js
│  │  │  └─ dashboard.service.js
│  │  ├─ controllers/             # adaptan HTTP ↔ services
│  │  ├─ routes/                  # definición de endpoints
│  │  └─ utils/
│  │     ├─ jwt.js
│  │     ├─ password.js           # bcrypt/argon2
│  │     └─ errores.js            # ErrorHTTP / códigos
│  ├─ data/
│  │  └─ catalogo-ica.json        # fuente única exportada de js/data.js
│  └─ uploads/                    # evidencias (fuera del control de versiones)
├─ js/                            # frontend (sin cambios de ubicación)
│  ├─ config.js                   # NUEVO: URL base API + banderas de modo
│  ├─ api-client.js               # NUEVO: fetch + JWT + manejo de errores
│  ├─ services/                   # NUEVO: espejo JS de los services del backend
│  ├─ adapters/persistence.js     # NUEVO: Persistencia + LocalStorage/Api
│  ├─ data.js                     # se mantiene como caché offline
│  ├─ storage.js                  # pasa a ser LocalStorageAdapter (offline)
│  ├─ app.js / landing.js / fx.js # refactor
│  └─ …
└─ docs/ …
```

---

## 2. Fase 0 — Preparación

1. Crear `backend/` e inicializar `package.json`.
2. Dependencias:
   - Producción: `express`, `pg`, `jsonwebtoken`, `bcryptjs`, `zod`, `multer`, `cors`, `morgan`, `dotenv`, `helmet`.
   - Desarrollo: `nodemon`, `vitest` (o `node:test`).
3. `backend/.env.example`:
   ```
   PORT=4000
   DATABASE_URL=postgres://usuario:clave@localhost:5432/bienestar_acuatico
   JWT_SECRET=cambiar_esto
   JWT_EXPIRA=8h
   CORS_ORIGEN=http://localhost:8080
   UPLOADS_DIR=./uploads
   MODO_OFFLINE_PERMITIDO=true
   ```
4. Exportar el catálogo: script `node scripts/exportar-catalogo.js` que transforma
   `js/data.js` → `backend/data/catalogo-ica.json` (única fuente de verdad para la semilla).
5. `GET /api/salud` → `{ ok: true, version }` para verificar arranque.

---

## 3. Fase 1 — Esquema SQL (migración 001)

`001_init.sql` crea las tablas del ER aprobado:

- **Catálogos/parametrización**: `rol`, `departamento`, `municipio`, `tipo_productor`,
  `sistema_productivo`, `especie`, `modalidad`, `tipo_medida`, `ponderacion`, `libertad`,
  `indicador`, `indicador_libertad`, `indicador_nivel`, `regla_muestreo`,
  `regla_profundidad`, `regla_mortalidad`, `categoria_clasificacion`.
- **Operación**: `usuario`, `predio`, `predio_sistema`, `lote_predio`, `evaluacion`,
  `evaluacion_lote`, `evaluacion_muestreo`, `respuesta_indicador`, `respuesta_calculo`,
  `evidencia`, `recomendacion`, `plan_mejora`, `auditoria`.

Convenciones:
- Claves `id SERIAL PRIMARY KEY` (o `GENERATED ALWAYS AS IDENTITY`).
- `UNIQUE` en todos los códigos naturales (`codigo`, `email`, `nombre` según el ER).
- `CHECK` en puntajes (`puntaje IN (0,20,55,100)` o `NULL` si no aplica) y en rangos.
- `FOREIGN KEY ... ON DELETE RESTRICT` para catálogos; `ON DELETE CASCADE` para hijos de `evaluacion`.
- Índices en `evaluacion(predio_id)`, `evaluacion(estado)`, `respuesta_indicador(evaluacion_id)`,
  `evidencia(respuesta_id)`.
- `creado_en`/`actualizado_en` `TIMESTAMPTZ DEFAULT now()` con trigger de actualización.

`migrate.js`:
- Tabla `migraciones(id, archivo, aplicada_en)` para idempotencia.
- Ejecuta en orden alfabético los `.sql` no aplicados dentro de una transacción.

---

## 4. Fase 2 — Catálogos ICA (migración 002 / `seed.js`)

Insertar desde `catalogo-ica.json` (derivado de `js/data.js`, sin inventar datos):

| Tabla | Origen en `js/data.js` |
|---|---|
| `modalidad` + `ponderacion` | modalidades, pesos PMG 35/35/30 y AREL 40/40/20 |
| `tipo_medida` | MBR/MBA/MBG y equivalencias AREL |
| `indicador` (+ `aplica_pmg`, `aplica_arel`, `calculadora`) | 23 PMG + 15 AREL |
| `indicador_nivel` | escalas 0/20/55/100 con descripciones |
| `libertad` + `indicador_libertad` | 5 libertades y su relación con indicadores |
| `especie` | cachama/tilapia/trucha (temp/OD/pH/turbidez) |
| `sistema_productivo` | estanque, jaulas, biofloc, etc. |
| `regla_muestreo` | tabla 1 PMG y tabla 30 AREL |
| `regla_profundidad` | jaulas 2–5 m (PMG) y 0,6–1,5 m (AREL) |
| `regla_mortalidad` | tablas 23 y 48 |
| `categoria_clasificacion` | Bajo/Medio/Alto/Excelente con colores |
| `departamento`/`municipio` | catálogo base de ubicaciones del prototipo |
| `rol` | admin, docente, evaluador, consultor |

Notas:
- Se conserva la limitación documentada de muestreo AREL con ≥ 4 lotes.
- Los valores de agua y umbrales incluyen el flag `turbidez_aplica = false` para biofloc.

---

## 5. Fase 3 — Autenticación

- `POST /api/auth/login` → verifica `password_hash` (bcrypt), firma JWT con `{ id, rol }`.
- `GET /api/auth/me` → usuario + rol (usa el middleware `auth`).
- `POST /api/auth/logout` → en JWT stateless basta con descartar el token en el cliente.
- `POST /api/auth/registro` (solo admin) → crea usuarios.
- Middleware `auth.js`: valida `Authorization: Bearer`, adjunta `req.usuario`, y `requiereRol([...])`.
- Migración `003_usuarios_demo.sql`: `admin@ica.demo/admin123`, `docente@ica.demo/docente123`,
  `evaluador@ica.demo/1234`, `consultor@ica.demo/consultor123` (hashes bcrypt, nunca texto plano).

Compatibilidad: el frontend hoy valida en `js/app.js`. Se mantiene el login local como respaldo
mientras `MODO_OFFLINE_PERMITIDO=true`, pero la ruta principal pasa a ser la API.

---

## 6. Fases 4–9 — API REST

### Catálogos (Fase 4)
```
GET /api/catalogos/modalidades
GET /api/catalogos/especies
GET /api/catalogos/sistemas
GET /api/catalogos/indicadores?modalidad=PMG|AREL
GET /api/catalogos/indicadores/:codigo/niveles
GET /api/catalogos/departamentos
GET /api/catalogos/departamentos/:id/municipios
GET /api/catalogos/categorias
GET /api/catalogos/libertades
```

### Predios (Fase 4)
```
GET    /api/predios
POST   /api/predios
GET    /api/predios/:id
PUT    /api/predios/:id
DELETE /api/predios/:id
GET    /api/predios/:id/lotes
POST   /api/predios/:id/lotes
```

### Evaluaciones (Fases 5–7)
```
GET    /api/evaluaciones?predio=&estado=&desde=&hasta=
POST   /api/evaluaciones
GET    /api/evaluaciones/:id
PUT    /api/evaluaciones/:id
DELETE /api/evaluaciones/:id
PUT    /api/evaluaciones/:id/respuestas/:indicadorId   # UPSERT puntaje/obs/calc/no_aplica
GET    /api/evaluaciones/:id/respuestas
POST   /api/evaluaciones/:id/finalizar                 # calcula, clasifica, audita
POST   /api/evaluaciones/:id/reabrir
POST   /api/evaluaciones/:id/recomendaciones
GET    /api/evaluaciones/:id/recomendaciones
GET    /api/evaluaciones/:id/plan
POST   /api/evaluaciones/:id/plan
PATCH  /api/evaluaciones/:id/plan/:itemId
GET    /api/evaluaciones/:id/informe
GET    /api/evaluaciones/comparar?a=&b=
```

### Evidencias (Fase 8)
```
POST   /api/evidencias                     # multipart: respuesta_id + archivo
GET    /api/evidencias/:respuestaId
DELETE /api/evidencias/:id
```

### Tablero / auditoría / usuarios (Fase 9)
```
GET    /api/dashboard/resumen?desde=&hasta=
GET    /api/dashboard/series
GET    /api/auditoria?entidad=&usuario=
GET    /api/usuarios            (admin)
POST   /api/usuarios            (admin)
PUT    /api/usuarios/:id        (admin)
```

**Convenciones**: respuestas JSON `{ datos, meta }`; errores `{ error: { codigo, mensaje, detalles } }`;
paginación `?pagina=&tamano=`; toda escritura registra fila en `auditoria`.

---

## 7. Fase 6 — Dominio de cálculo (portado de `js/app.js`)

`domain/calculo.js` reproduce exactamente la lógica actual (funciones `calc`, `pesosPorModalidad`,
`clasificar`) para no alterar resultados:

1. Puntaje por tipo de medida = media ponderada de indicadores aplicables.
2. Puntaje global = Σ (puntaje de medida × peso de la modalidad).
3. Clasificación: Bajo < 50, Medio [50,75), Alto [75,90), Excelente ≥ 90.
4. `no_aplica` excluye el indicador del denominador (mismo criterio que el prototipo).
5. Cierre valida obligatorios y guarda `puntaje_global`, `clasificacion`, `cerrado_en`.

Los tests de `tests/validation.js` se reutilizan como prueba de equivalencia
(mismos insumos → mismos puntajes que el frontend).

---

## 8. Fases 10–11 — Frontend

### Fase 10: capa de servicios y adaptadores
1. `js/config.js`: `window.APP_CONFIG = { API_URL, MODO: 'api'|'local'|'auto' }`.
2. `js/api-client.js`: `fetch` con `Authorization`, `tryRefresh`, parseo de errores, timeout.
3. `js/adapters/persistence.js`:
   - `Persistencia` (contrato): `guardarBorrador`, `leerBorrador`, `sincronizar`.
   - `LocalStorageAdapter`: envuelve la lógica actual de `storage.js` (offline).
   - `ApiAdapter`: usa los `services` contra la API; encola escrituras offline si no hay red.
   - Selección por `APP_CONFIG.MODO` (auto = detecta `/api/salud`).
4. `js/services/*.js`: `AuthService`, `PredioService`, `CatalogoService`,
   `EvaluacionService`, `CalculoService`, `RecomendacionService`, `EvidenciaService`,
   `ReporteService`, `DashboardService` (espejo de las clases UML aprobadas).

### Fase 11: refactor de vistas
- `js/app.js`: reemplazar accesos directos a `DB` por llamadas a servicios; `render()` conserva
  rutas y vistas; los cálculos locales quedan como respaldo offline.
- Añadir estado de carga/errores por vista (spinners neón, toasts).
- `index.html`: agregar `<script>` en orden:
  `config.js → api-client.js → data.js → storage.js → adapters/persistence.js → services/* → landing.js → fx.js → app.js`.
- Mantener 100 % de las vistas: Landing, Auth, Predios, Evaluación, Indicadores, Resultado,
  Historial, Tablero, Admin, Informe, Constancia.

---

## 9. Fase 12 — Tema neón-acuático, animaciones e imágenes

### `css/theme.css`
- Paleta ampliada: cian/teal profundo, magenta neón, verde bioluminiscente; degradados radiales.
- Tokens (`--neon-1..3`, `--agua-fondo`, `--glass`, `--glow-*`, radios, sombras, tiempos).
- Variantes claras/oscuras y `prefers-reduced-motion`.

### `css/styles.css`
- Tarjetas glassmorphism con borde luminoso animado.
- Separadores de olas SVG entre secciones.
- Botones con brillo al pasar el cursor; campos con foco neón.
- Tablas responsivas (scroll horizontal en móvil); `@media` en 1200/900/640/420 px.
- Mejora de contraste y tipografía (`Anton` para títulos, `Inter` para texto, `Space Grotesk` para datos).

### `js/fx.js`
- Burbujas/partículas adicionales en el hero, parallax suave, transiciones entre vistas.
- Respetar `prefers-reduced-motion`; no bloquear la interacción.

### Imágenes
| Imagen | Uso |
|---|---|
| `Im/peces/cardumen-ica.jpg` | Fondo del hero de la landing (con overlay neón) y tarjeta "cardumen". |
| `Im/sistemas/estanque-ica.jpg` | Fondo/cabecera de la sección de sistemas y modal explicativo de la metodología. |
| `Im/Peces.JPG`, `Im/ICA.jpg`, `Im/Logo.jpg` | Se conservan (logo, créditos, galería). |
| Wikimedia Commons | Se mantienen los enlaces con crédito; respaldo local si no cargan. |

- Actualizar `docs/CREDITOS_IMAGENES.md` con el uso exacto de cada imagen.
- Añadir `loading="lazy"`, `width/height` y `alt` descriptivos.

---

## 10. Fase 13 — Pruebas y documentación

- `tests/validation.js`: se conserva + nuevas pruebas de equivalencia cálculo frontend/backend.
- `backend/tests/`: pruebas de servicios con base de datos de prueba (esquema efímero).
- Scripts npm: `dev`, `start`, `migrate`, `seed`, `test`.
- Actualizar `README.md`, `docs/PRUEBAS_Y_CAMBIOS.md` y `docs/REVISION_METODOLOGIA.md`:
  pasos para levantar PostgreSQL, variables de entorno, endpoints y modo offline.
- `LEEME.txt`: instrucciones rápidas de ejecución.

---

## 11. Orden recomendado de ejecución y verificación

1. Fase 0–3 → `GET /api/salud` + login funcionan.
2. Fase 4 → listar/crear predios contra la base real.
3. Fase 5–6 → crear una evaluación de prueba y verificar que el puntaje coincide con el frontend.
4. Fase 7–9 → recomendaciones, plan, evidencias, informe, tablero.
5. Fase 10–11 → el frontend opera indistintamente en modo `api` y `local`.
6. Fase 12 → revisión visual del tema y las imágenes.
7. Fase 13 → pruebas y documentación final.

Cada fase se entrega con: cambio aplicado + cómo verificarlo + qué funcionalidad existente sigue intacta.

---

## 12. Estado de implementación

Actualizado al cierre de las fases 12 y 13.

| Fase | Estado | Evidencia |
|---|---|---|
| 0 — Estructura y dependencias | ✅ Hecha | `backend/package.json` (123 paquetes), `.env.example`, `GET /api/salud`. |
| 1 — Esquema SQL + migraciones | ✅ Hecha | `backend/src/db/migrations/001_init.sql`, runner `migrate.js` idempotente. |
| 2 — Catálogos ICA (semilla) | ✅ Hecha | `002_catalogos_ica.sql`, `backend/data/catalogo-ica.json`, `seed.js`. |
| 3 — Autenticación (JWT + roles) | ✅ Hecha | `auth.service.js`, middleware `auth.js`, 4 usuarios demo con bcrypt. |
| 4 — API de predios y catálogos | ✅ Hecha | `routes/predios`, `routes/catalogos`. |
| 5 — API de evaluaciones + respuestas | ✅ Hecha | `routes/evaluaciones` (UPSERT de respuestas). |
| 6 — Dominio de cálculo ICA | ✅ Hecha | `domain/calculo.js` + `clasificacion.js`, equivalencia verificada. |
| 7 — Recomendaciones + plan | ✅ Hecha | `domain/recomendaciones.js`, `routes/evaluaciones` (`/recomendaciones`, `/plan`). |
| 8 — Evidencias (multipart) | ✅ Hecha | `routes/evidencias`, `middlewares/upload.js`. |
| 9 — Informes/tablero/auditoría | ✅ Hecha | `routes/dashboard`, `routes/auditoria`, `routes/usuarios`. |
| 10 — Adaptadores y `ApiClient` | ✅ Hecha | `js/config.js`, `js/api-client.js`, `js/adapters/persistence.js`, `js/services/*`. |
| 11 — Refactor de vistas | ✅ Hecha | `js/app.js` integrado; todas las rutas conservadas; login local como respaldo. |
| 12 — Tema neón-acuático e imágenes | ✅ Hecha | `css/theme.css` (tokens + glass/olas/plankton), `js/fx.js` (`heroPlankton`), `js/landing.js` (guía visual, olas, foto de estanque), `Im/peces/cardumen-ica.jpg` y `Im/sistemas/estanque-ica.jpg` integradas. |
| 13 — Pruebas y documentación | ✅ Hecha | `backend/tests` 32/32, `tests/validation.js`, `tests/check_assets.py` (27 refs), `README.md`, `LEEME.txt`, `backend/README.md`, `docker-compose.yml`. |

### Verificaciones finales

- `node tests/validation.js` → OK (conteo 23 PMG / 15 AREL, pesos, fórmulas, escalas, umbrales).
- `python tests/check_assets.py` → OK (27 referencias locales, ninguna rota).
- `npm test` (en `backend/`) → 32/32 pruebas superadas.
- Navegador (`http://localhost:4000/`): carga del hero/plankton/olas, guía visual de metodología,
  rutas privadas con shell + nav sin errores JS.
- Login `?modo=local`: `admin@ica.demo` funciona; credenciales inválidas devuelven `{ok:false}` sin excepciones.
- `?modo=api` con base de datos sin conexión: degradación elegante a login local (sin `TypeError`).
- **PostgreSQL local verificado** (instancia PostgreSQL 18 en `localhost:5432`):
  - `npm run setup` → migraciones `001_init.sql` y `002_catalogos_ica.sql` + seed sin errores.
  - `GET /api/salud` → `"baseDatos":"conectada"`.
  - 31 tablas; 23 indicadores (8 exclusivos PMG + 15 compartidos PMG/AREL → 23 PMG / 15 AREL);
    4 especies; 3 predios; 5 evaluaciones; 107 respuestas; 7 usuarios.
  - `POST /api/auth/login` con `admin@ica.demo` → JWT válido y rol `admin`.
  - Las credenciales locales viven solo en `backend/.env` (no versionado); no se documentan aquí.

### Pendiente / limitación conocida

- El arranque por defecto (sin `backend/.env`) usa `postgres/postgres`; si tu servidor local usa otra
  contraseña, ajústala en `backend/.env`. Alternativa reproducible con Docker: `docker compose up -d db`
  (puerto 5432 libre) y luego `npm run setup`.
- El prototipo **sigue sin ser una herramienta oficial del ICA**; se mantiene 23 PMG / 15 AREL.
