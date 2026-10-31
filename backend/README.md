# Backend · Bienestar Acuático (Node.js + Express + PostgreSQL)

API REST del prototipo académico **Bienestar Acuático — Neon Aquaculture**, basada en la
metodología **ICA v2.0 (2024)**.

> ⚠️ **Aviso académico.** Este proyecto es un prototipo independiente de apoyo a la evaluación
> del bienestar animal en peces de cultivo. **No es un sistema oficial del ICA**, no emite
> certificaciones y no debe usarse con datos reales o sensibles. Se conservan la ponderaciones
> PMG 35/35/30 y AREL 40/40/20 y los **23 indicadores PMG / 15 AREL** del documento (no se
> inventa un indicador número 24).

---

## 1. Requisitos

- **Node.js ≥ 20** (probado con Node 24 y npm 11).
- **PostgreSQL ≥ 14** (probado con PostgreSQL 16). Puede ser local o vía Docker.
- Opcional: **Docker Desktop** para levantar la base con un comando.

El backend también sirve el **frontend estático** del proyecto en la raíz (`../`), de modo que
con `npm start` se puede abrir todo el prototipo en `http://localhost:4000/`.

---

## 2. Puesta en marcha

### 2.1 Levantar PostgreSQL

**Opción A · Docker (recomendada).** Desde la raíz del proyecto:

```bash
docker compose up -d
```

Esto publica PostgreSQL en `localhost:5432` con usuario/clave `postgres`/`postgres` y base
`bienestar_acuatico` (ver `../docker-compose.yml`).

**Opción B · PostgreSQL ya instalado.** Crea la base y ajusta las credenciales en `.env`:

```sql
CREATE DATABASE bienestar_acuatico;
```

### 2.2 Configurar variables de entorno

Copia el ejemplo y edítalo:

```bash
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Variables principales (ver `.env.example` para el detalle):

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto de la API | `4000` |
| `DATABASE_URL` | Cadena `postgres://usuario:clave@host:puerto/base` | — |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Alternativa si no usas `DATABASE_URL` | `localhost` / `5432` / `postgres` / `postgres` / `bienestar_acuatico` |
| `JWT_SECRET` | Clave para firmar los tokens JWT | valor de desarrollo (cámbialo) |
| `JWT_EXPIRA` | Vigencia del token | `8h` |
| `CORS_ORIGEN` | Orígenes permitidos, separados por coma (`*` en desarrollo) | `*` |
| `UPLOADS_DIR` | Carpeta de evidencias | `./uploads` |
| `MAX_UPLOAD_MB` | Tamaño máximo por evidencia | `15` |
| `MODO_OFFLINE_PERMITIDO` | Permite que el frontend trabaje sin API | `true` |

### 2.3 Instalar, migrar y sembrar

```bash
npm install
npm run setup      # = migrate + seed (crea tablas y carga catálogos + datos demo)
npm start          # API en http://localhost:4000  ·  salud en /api/salud
```

Modo desarrollo con recarga automática:

```bash
npm run dev
```

### 2.4 Verificar

```bash
curl http://localhost:4000/api/salud
# { "datos": { "ok": true, "version": "2.0.0", "baseDatos": "conectada", ... } }
```

Si `baseDatos` dice `"sin conexión"`, la API sigue en **modo degradado**: arranca y sirve el
frontend, pero las rutas que requieren la base responderán con error. Revisa `.env` y que
PostgreSQL esté arriba.

---

## 3. Scripts

| Script | Acción |
|---|---|
| `npm start` | Arranca la API (`src/index.js`). |
| `npm run dev` | Arranca con `node --watch` (recarga en caliente). |
| `npm run migrate` | Aplica las migraciones pendientes (`src/db/migrations/*.sql`). |
| `npm run seed` | Carga catálogos ICA y datos de demostración. |
| `npm run setup` | `migrate` + `seed`. |
| `npm run export:catalogo` | Regenera `data/catalogo-ica.json` desde `../js/data.js`. |
| `npm test` | Pruebas de dominio, equivalencia con el frontend y HTTP (`node --test`). |

Los scripts leen `backend/data/catalogo-ica.json`, exportado de `js/data.js` para que la semilla
y el catálogo del frontend no diverjan.

---

## 4. Endpoints principales

Todas las rutas viven bajo `/api`. Respuestas correctas: `{ datos, meta }`.
Errores: `{ error: { codigo, mensaje, detalles } }`.

### Salud
- `GET /api/salud`

### Autenticación (`/api/auth`)
- `POST /api/auth/login` · `POST /api/auth/registro`
- `GET /api/auth/me` (token) · `POST /api/auth/cambiar-clave` (token)

### Catálogos (`/api/catalogos`)
- `GET /modalidades` · `/tipos-medida` · `/especies` · `/sistemas` · `/tipos-productor`
- `GET /departamentos` · `/departamentos/:id/municipios`
- `GET /categorias` · `/libertades` · `/reglas-muestreo` · `/reglas-profundidad`
- `GET /indicadores` (filtro `?modalidad=PMG|AREL`) · `/indicadores/:codigo/niveles`

### Predios (`/api/predios`)
- `GET /` · `GET /:id`
- `POST /` · `PUT /:id` · `DELETE /:id` (roles `admin`, `docente`, `evaluador`)

### Evaluaciones (`/api/evaluaciones`)
- `GET /` · `POST /` · `GET /:id` · `PUT /:id` · `DELETE /:id`
- `GET /:id/respuestas` · `PUT /:id/respuestas/:indicador` (UPSERT puntaje/obs/calc/no_aplica)
- `POST /:id/finalizar` · `POST /:id/reabrir` · `POST /:id/recalcular` · `PATCH /:id/estado`
- `POST /:id/recomendaciones` · `GET /:id/recomendaciones`
- `GET /:id/plan` · `POST /:id/plan` · `PATCH /:id/plan/:itemId`
- `GET /:id/informe` · `GET /:id/informe.html`
- `GET /comparar?a=&b=`

### Evidencias (`/api/evidencias`)
- `POST /` (multipart `respuesta_id` + archivo) · `GET /:respuestaId` · `DELETE /:id`

### Informes, tablero, usuarios y auditoría
- `GET /api/reportes/:id` · `GET /api/reportes/:id/html` · `GET /api/reportes/comparar?a=&b=`
- `GET /api/dashboard/resumen` · `GET /api/dashboard/series`
- `GET /api/usuarios` · `GET /api/usuarios/roles` · `POST /api/usuarios` · `PUT /api/usuarios/:id` · `PATCH /api/usuarios/:id/activo`
- `GET /api/auditoria?entidad=&usuario=&limite=`

---

## 5. Usuarios de demostración

Se crean con `npm run seed` (contraseñas con hash bcrypt, nunca en texto plano):

| Perfil | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin@ica.demo` | `admin123` |
| Docente | `docente@ica.demo` | `docente123` |
| Estudiante evaluador | `evaluador@ica.demo` | `1234` |
| Consultor externo | `consultor@ica.demo` | `consultor123` |

Son credenciales públicas de demostración: no reutilizar como contraseñas reales.

---

## 6. Modo sin conexión (offline)

El frontend (`js/adapters/persistence.js`) puede operar en tres modos controlados por
`APP_CONFIG.MODO`:

- `local` → solo `localStorage` + IndexedDB (sin backend).
- `api` → usa la API.
- `auto` (por defecto) → intenta la API y, si no responde, cae a local.

Se puede forzar desde la URL: `index.html?modo=local` o `index.html?api=http://host:4000/api`.
`MODO_OFFLINE_PERMITIDO=true` habilita la degradación a local cuando la API no está disponible.

---

## 7. Pruebas

```bash
npm test
```

Incluye:

- **Dominio**: cálculo ICA, muestreo, profundidad, mortalidad y calculadoras.
- **Equivalencia con el frontend**: escenarios aleatorizados backend ↔ frontend (mismos insumos,
  mismos puntajes), usando `tests/frontend-harness.js`.
- **HTTP**: `/api/salud`, rutas protegidas sin token (401), 404 y servido estático del frontend.

Desde la raíz del proyecto también puedes ejecutar `node tests/validation.js` y
`python tests/check_assets.py`.

---

## 8. Seguridad y alcance

- Autenticación con JWT (`Authorization: Bearer <token>`) y guardias por rol en las rutas de escritura.
- Contraseñas con hash `bcryptjs`.
- SQL parametrizado en los repositorios.
- `helmet` + `cors` configurables; CSP relajada porque el prototipo carga fuentes e imágenes externas.
- **No** exponer como servicio productivo ni procesar datos reales/sensibles.

Consulta `../docs/PLAN_IMPLEMENTACION.md`, `../docs/DISENO_BASE_DATOS_UML.md` y
`../docs/REVISION_METODOLOGIA.md` para el detalle de diseño y decisiones metodológicas.
