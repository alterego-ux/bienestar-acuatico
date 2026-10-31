# Bienestar Acuático · Aquatic Performance

Plataforma web académica para registrar predios, administrar especies e inventarios, diligenciar evaluaciones de bienestar animal en peces de cultivo, consultar resultados y trabajar con evidencias y propuestas de mejora. El proyecto utiliza Angular 22, Node.js/Express y PostgreSQL. **Es un prototipo académico y no un sistema oficial ni una certificación emitida por el ICA.**

## Ejecutar la aplicación Angular

Requisitos: Node.js `22.22.3+`, `24.15+` o una versión compatible indicada por el script del proyecto; npm y Docker Compose si vas a utilizar la base PostgreSQL local del contenedor.

1. Desde la raíz del proyecto, comprueba `node -v` y `npm -v`.
2. Si utilizas la base local del proyecto, inicia PostgreSQL con `docker compose up -d db`.
3. Ejecuta `npm run dev` desde la raíz del proyecto.
4. Abre `http://localhost:4200`. El backend se ejecuta en `http://localhost:4100`.

El comando raíz crea `backend/.env` desde `backend/.env.example` si todavía no existe, instala dependencias ausentes y aplica las migraciones con el mecanismo existente. La base de datos de Docker se publica en el puerto local `5433`, separado del PostgreSQL local habitual en `5432`. Si usas otra base, ajusta `DATABASE_URL` en `backend/.env`.

Los archivos `index.html`, `js/` y `css/` de la raíz corresponden a un prototipo anterior. Para ver la aplicación Angular, inicia el entorno con `npm run dev` y usa `http://localhost:4200`.

## Credenciales de demostración

- Administrador: `admin@ica.demo` / `admin123`
- Evaluador: `evaluador@ica.demo` / `1234`

Son credenciales públicas de demostración; cámbialas antes de cualquier despliegue real. No almacenes datos sensibles en el entorno de prueba.

## Activar AquaAssist / Gemini

1. Abre `backend/.env`.
2. Rellena `GEMINI_API_KEY` con una clave propia obtenida en Google AI Studio.
3. Comprueba `GEMINI_MODEL=gemini-3.8-flash` o selecciona un modelo vigente disponible para tu cuenta.
4. Reinicia `npm run dev`.

La clave permanece en el backend; no la incluyas en Angular ni la subas al repositorio. Sin una clave válida, AquaAssist debe informar que no está configurado, sin simular respuestas. Consulta la [documentación de Gemini Interactions](https://ai.google.dev/gemini-api/docs/interactions-overview), [modelos](https://ai.google.dev/gemini-api/docs/models) y [claves API](https://ai.google.dev/gemini-api/docs/api-key).

## Cambios de Aquatic Performance

- La sesión de Angular se guarda en `sessionStorage` para evitar restaurar indefinidamente la cuenta anterior. Al cerrar sesión se limpian las claves de autenticación; la preferencia del tema y los datos de trabajo no se borran. Los accesos de demostración rellenan los campos solo tras una acción explícita.

- Renovación de la identidad visual y landing usando recursos locales, con diseño adaptable y microinteracciones.
- Vistas de predios en tarjetas, búsqueda, ficha de detalle y campo opcional de teléfono de contacto.
- Migración SQL aditiva `backend/src/db/migrations/004_telefono_contacto_predio.sql` para el teléfono; no borra los registros existentes.
- Evidencias de evaluación mediante selección o arrastrar y soltar, previsualización de imágenes y vídeo, y acceso a archivos autenticado.
- AquaAssist conectado desde el backend a Gemini, contextualizable con información acotada de una evaluación, más generación de propuestas de mejora que requieren revisión humana.
- Documentación detallada de la actualización en `docs/IMPLEMENTACION_AQUATIC_PERFORMANCE.md`.

## Comprobaciones

Desde la raíz, ejecuta:

```bash
node tests/validation.js
python tests/check_assets.py
```

Las pruebas del backend se describen en `backend/README.md`. La compilación de producción se realiza con `npm run build` una vez estén instaladas las dependencias del frontend.

## Límites conocidos

Esta actualización no certifica el cumplimiento integral de todos los requisitos ICA ni implica un despliegue en Google Cloud. Antes de producción deben verificarse end-to-end la autorización específica por predio y evaluación, recuperación de contraseña y correo, certificaciones/notificaciones, exportaciones, respaldo/recuperación, monitorización, almacenamiento cloud persistente y pruebas de seguridad. Los resultados calculados por el sistema no se sustituyen por contenido generativo.

Consulta `docs/REVISION_METODOLOGIA.md`, `docs/CREDITOS_IMAGENES.md` y `docs/Metodologia_ICA_Bienestar_Peces_v2.pdf` para más contexto, notas metodológicas y créditos visuales.
