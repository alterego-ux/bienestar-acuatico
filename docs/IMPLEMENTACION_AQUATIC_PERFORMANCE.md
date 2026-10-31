# Implementación Aquatic Performance — Bienestar Acuático

## Cambios realizados

### Identidad y navegación visual

- Se agregó una identidad visual inspirada en el entorno acuícola y el dinamismo del automovilismo: azul abisal, azul petróleo, turquesa, naranja papaya y lima como acento.
- Se renovaron la tipografía, jerarquías de títulos, tarjetas, botones, campos, navegación, sombras y transiciones respetando el tema claro/oscuro existente.
- Se rediseñó la landing con fotografías locales del proyecto, secciones de plataforma y bienestar, llamadas a la acción y diseño adaptable a móvil.
- El módulo de predios ahora presenta tarjetas, búsqueda, ubicación, contacto, especies, lotes y estado.

### Datos del predio

- Se agregó el teléfono de contacto opcional al formulario, a la lista y a la ficha de detalle.
- Se añadió la migración `backend/src/db/migrations/004_telefono_contacto_predio.sql`, que agrega `telefono_contacto` sin borrar datos anteriores.
- El teléfono pasa por el modelo Angular, validación de backend y repositorio PostgreSQL.

### Evidencias

- La pestaña de evidencias acepta selección o arrastrar y soltar imágenes, PDF y videos, con límite de 15 MB según la configuración de ejemplo.
- Los archivos se presentan como miniaturas, reproductor de vídeo o tarjeta de archivo.
- La carga de vistas previas usa un endpoint de la API que requiere autenticación; se retiró la publicación estática directa de la carpeta `uploads`.
- Los archivos permanecen en el almacenamiento configurado mediante `UPLOADS_DIR`. No se implementó todavía Google Cloud Storage.

### AquaAssist y Gemini

- Se agregó el widget de chat `AquaAssist` para usuarios autenticados.
- Se incorporó `POST /api/chatbot/message`, con validación, límite de mensajes y llamadas a la API REST de Interactions de Gemini desde el backend. Si el widget se utiliza desde una ruta de evaluación, el backend puede aportar a la conversación un resumen acotado y autorizado de esa evaluación, sin incluir nombre del predio ni datos personales.
- Se incorporó `POST /api/chatbot/recomendaciones/:id` para generar propuestas basadas en hallazgos de una evaluación, sin modificar los puntajes calculados por la aplicación.
- La clave se configura en `backend/.env` mediante `GEMINI_API_KEY`; el modelo se ajusta con `GEMINI_MODEL`.
- Se usa `store=false` al llamar a Interactions para solicitar un comportamiento sin estado almacenado por esa opción de la API. Esto no sustituye la revisión de los términos de tratamiento de datos de Google.
- Sin clave válida, AquaAssist debe informar que no está configurado. No se simulan respuestas de IA.

## Activar Gemini

1. Abre `backend/.env` (el runner crea el archivo a partir de `.env.example` si todavía no existe).
2. Define `GEMINI_API_KEY` con una clave propia creada en Google AI Studio.
3. Revisa `GEMINI_MODEL=gemini-3.8-flash` o selecciona un modelo soportado en tu cuenta.
4. Reinicia `npm run dev` desde la raíz del proyecto.

No compartas la clave ni la copies en ningún archivo de Angular. Si `backend/.env` ya existía antes de esta actualización, agrega las variables manualmente, porque el runner no sobrescribe archivos de entorno existentes.

Documentación oficial: [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview), [modelos disponibles](https://ai.google.dev/gemini-api/docs/models) y [claves API](https://ai.google.dev/gemini-api/docs/api-key).

## Comprobaciones realizadas en este entorno

- `node tests/validation.js`: correcto.
- `python tests/check_assets.py`: correcto; encontró 27 referencias locales sin enlaces rotos.
- `node --check` para los archivos JavaScript del backend y runner: correcto.
- Análisis de sintaxis TypeScript mediante `transpileModule`: 29 archivos revisados, sin errores de sintaxis.

No se pudo completar el build de Angular en este entorno: la instalación de dependencias no terminó y la versión de Node disponible aquí era `v22.16.0`, inferior a la que exige Angular 22. En tu Pop!_OS ya instalaste Node `v24.22.1`, que sí supera el requisito del runner. Se debe confirmar el build en tu equipo con las dependencias instaladas.

## Fuera del alcance verificado en esta entrega

Esta actualización no constituye una certificación de cumplimiento integral de todos los requisitos del documento ICA ni un despliegue en Google Cloud. Deben comprobarse end-to-end los flujos de recuperación de contraseña y correo, certificación y notificaciones, exportaciones, respaldos, monitorización, almacenamiento cloud y autorización por predio/evaluación en producción. La evaluación, los cálculos y sus ponderaciones originales no se sustituyeron.


## Ajustes de interfaz y sesión — octubre de 2026

- Se corrigió la persistencia de autenticación de Angular: el token y el usuario se leen y guardan en `sessionStorage` durante la sesión actual. Las claves de autenticación antiguas en `localStorage` se eliminan sin tocar el tema ni los datos de la aplicación. Así, el usuario anterior ya no se restaura indefinidamente al volver al sitio desde una nueva sesión del navegador.
- El cierre de sesión limpia ambas ubicaciones de las claves de autenticación antiguas y navega a la portada reemplazando la entrada actual del historial. Las rutas protegidas siguen dependiendo de los guards existentes.
- Se rediseñaron las vistas de ingreso y registro, y los accesos de demostración ahora están dentro de un panel opcional: solo rellenan campos tras una acción explícita y nunca autentican automáticamente.
- Se refinó la portada con el mensaje “El bienestar de los peces, con evidencia”, una galería fotográfica con respaldo local cuando las imágenes remotas no cargan, y estilos diferenciados para los temas claro y oscuro.
- Se añadieron reglas de responsividad para el formulario, la galería, la navegación móvil, las tablas desplazables y los controles táctiles.
- La galería incluye cuatro referencias remotas de Wikimedia Commons con sus créditos documentados en `CREDITOS_IMAGENES.md`. No se pudieron guardar como binarios locales desde este entorno porque la terminal no resolvió dominios externos; la aplicación mantiene fotografías locales alternativas.
- La instalación de Impeccable se intentó con `npx impeccable install -y --providers=codex --scope=project`, pero expiró sin descargar/instalar archivos debido a la falta de resolución de dominios externos en la terminal. No se declara Impeccable como instalado.


### Validación de esta edición en el entorno de trabajo

- `node tests/validation.js`: correcto (cálculos, pesos, umbrales y reglas de evaluación).
- `python tests/check_assets.py`: correcto (29 referencias locales resueltas después de reconocer las rutas públicas de Angular).
- Escaneo sintáctico de TypeScript con `transpileModule`: 29 archivos revisados, 0 errores de sintaxis. Esto no sustituye una compilación Angular completa.
- `npm test`: 32 de 33 pruebas pasaron; `tests/http.test.js` no pudo cargar porque `express` no está instalado en el entorno (`ERR_MODULE_NOT_FOUND`).
- `npm run build`: no pudo ejecutarse porque faltan las dependencias del frontend y el comando `ng` no está disponible. La instalación no se pudo completar debido a la falta de resolución DNS para dominios externos en la terminal.
- Impeccable: se intentó instalar con el comando no interactivo para Codex en ámbito de proyecto, pero el comando expiró sin crear los archivos de instalación. La herramienta no se considera instalada.

Antes de presentar el proyecto en otro equipo, instala las dependencias con acceso a npm y ejecuta `npm run build` y `npm test` otra vez. También revisa visualmente los anchos móviles y ambos temas en un navegador; esta sesión no pudo ejecutar el frontend Angular en un navegador.
