# Despliegue en cuentas nuevas (Supabase + Render + Firebase)

Arquitectura: **Angular** (Firebase Hosting) → **API Node** (Render, Docker) → **PostgreSQL** (Supabase) + **Storage** (Supabase, bucket `evidencias`).
Usuarios, predios, evaluaciones, auditoría y metadatos de evidencias están en PostgreSQL; solo los archivos van a Storage.

## 1. Supabase nuevo (cuenta nueva)
1. Crea el proyecto. Guarda la contraseña de la base.
2. *Connect* → copia la cadena **Session pooler** (puerto 5432). Úsala como `DATABASE_URL`
   (reemplaza `[YOUR-PASSWORD]`). Evita la "Direct connection" (solo IPv6, Render no la alcanza) y el pooler de transacciones (6543) para las migraciones.
3. *Project Settings → API Keys*: copia `Project URL` y la **secret key** (`sb_secret_...`).
4. El bucket `evidencias` se crea solo en la primera subida (privado). Si prefieres crearlo a mano: Storage → New bucket → `evidencias`, **sin** marcar público.

## 2. Render (backend)
1. New → Blueprint → elige el repo (usa `render.yaml`), o New Web Service → Docker, contexto `backend`.
2. Variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
   `CORS_ORIGEN` = URL de Firebase (ej. `https://TU-PROYECTO.web.app`, sin `/` final).
3. Al arrancar crea las tablas y los datos demo (`ensure.js`). Verifica `https://TU-API.onrender.com/api/salud`:
   `baseDatos: "conectada"` y `almacenEvidencias: "supabase"`.
4. El plan gratis de Render se duerme: la primera petición tarda ~1 min.

## 3. Firebase (frontend)
1. `firebase login` y `firebase use --add` (proyecto nuevo); actualiza `.firebaserc`.
2. En `frontend-angular/public/app-config.js` cambia `apiUrl` a `https://TU-API.onrender.com/api`.
3. `cd frontend-angular && npm ci && npm run build`, luego en la raíz `firebase deploy --only hosting`.

## 4. Después de publicar
- Cambia o borra las cuentas demo (`admin@ica.demo`, etc.).
- Rota cualquier clave que hayas pegado en chats, correos o commits.
