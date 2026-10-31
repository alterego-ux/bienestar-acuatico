# Cambios y pruebas — Bienestar Acuático Neon Aquaculture

## Cambios visuales

- Se reforzó la identidad oscura acuática con cian/turquesa, verde esmeralda y acentos papaya.
- **Tema neón-acuático (Fase 12):** capa de tokens ampliada en `css/theme.css` (`--neon-1` cian
  bioluminiscente, `--neon-2` magenta neón, `--neon-3` verde brillante, `--agua-fondo`, `--glass`,
  `--glow-1/2/3`, radios, sombras y tiempos) más una **variante clara opt-in**
  (`<html data-tema="claro">` o `<body class="tema-claro">`), apagada por defecto.
- Tarjetas con acabado de **cristal** (glassmorphism) y utilidad de **borde luminoso animado**
  (`.neon-brd`, degradado cónico giratorio) aplicada a la tarjeta de ponderaciones y a la vista
  previa del resultado. Campos de formulario con foco neón.
- **Separadores de ola SVG** entre secciones y **capa de plancton bioluminiscente** en el hero
  (partículas animadas que se desactivan con `prefers-reduced-motion`).
- Se incorporó una sección de galería fotográfica con nueve tarjetas de peces y sistemas acuícolas; usa imágenes locales del material aportado y enlaces a fotos de Wikimedia Commons con créditos documentados.
- Se conservaron escenas animadas como adorno, pero las fotografías forman parte de la portada, la sección de especies y la galería. En pantallas pequeñas la galería se adapta a una columna.
- Se añadieron alternativas para fallos de carga, textos alternativos y carga diferida.

## Uso de las imágenes locales del ICA

- `Im/peces/cardumen-ica.jpg`: escena de fondo del hero de la landing (con overlay del sitio) y
  tarjeta «Cardumen en producción» de la galería.
- `Im/sistemas/estanque-ica.jpg`: cabecera de la sección de sistemas (`.photo-sec--foto`) y fondo
  del modal/guía visual «¿Cómo se evalúa?» de la metodología.

## Cambios de arquitectura (backend Node.js + Express + PostgreSQL)

- Se añadió `backend/`: API REST con Express (ESM), PostgreSQL (`pg`), JWT + `bcryptjs`, validación
  con `zod`, subida de evidencias con `multer`, `helmet`, `cors` y `morgan`.
- Esquema relacional en `backend/src/db/migrations/` (catálogos ICA + operación) y semilla en
  `backend/src/db/seed.js`, alimentada desde `backend/data/catalogo-ica.json` (exportado de `js/data.js`).
- El frontend incorpora `js/config.js`, `js/api-client.js`, `js/services/*` y
  `js/adapters/persistence.js`: la interfaz opera en modo `api`, `local` o `auto` (por defecto),
  cayendo a local si la API no responde. `npm start` sirve además el frontend en `http://localhost:4000/`.
- `docker-compose.yml` levanta PostgreSQL 16 con las credenciales de `backend/.env.example`.

## Cambios de lógica

- Se conservaron las ponderaciones PMG 35/35/30 y AREL 40/40/20 y la clasificación con límites de 50 %, 75 % y 90 %.
- Se mantiene el bloqueo de resultados definitivos si hay indicadores pendientes o grupos de medida sin ninguna puntuación válida.
- Se corrigió la diferencia de rango de profundidad: jaulas PMG de 2–5 m según tabla 13; AREL de 0,6–1,5 m según tabla 40.
- Las cantidades de peces para tamaño, lesiones y mortalidad deben ser coherentes (enteras cuando representan conteos; los muertos no pueden superar la población declarada).
- Se modificaron las credenciales del usuario demostrativo del estudiante a `evaluador@ica.demo` / `1234`, para evitar dejar un correo personal-looking en el set de ejemplo.
- Los informes/constancias incluyen un aviso de que son documentos simulados para fines académicos, no emitidos por el ICA.
- El dominio de cálculo del backend (`backend/src/domain/`) reproduce exactamente la lógica del frontend; se verifica con pruebas de equivalencia aleatorizadas.

## Pruebas ejecutadas

- `node --check` en `js/app.js`, `js/data.js`, `js/landing.js`, `js/fx.js`, `js/storage.js`,
  `js/config.js`, `js/api-client.js` y `js/adapters/persistence.js`: **superado**.
- `node tests/validation.js`: **superado**. Se verificaron el conteo de indicadores del catálogo, la suma de pesos, cálculos de caso perfecto y casos ponderados, los estados incompletos/inválidos, el tratamiento de un grupo sin datos, los límites de clasificación y la regla de profundidad por modalidad.
- `python tests/check_assets.py`: **superado**; se verificaron las referencias locales (HTML, CSS y literales de JS), ninguna rota.
- `npm test` en `backend/`: **superado (32/32)**. Incluye dominio (cálculo, muestreo, profundidad,
  mortalidad y calculadoras), equivalencia backend ↔ frontend en 80 escenarios aleatorizados, y
  comprobaciones HTTP (`/api/salud`, rutas protegidas 401, 404 y servido estático del frontend).
- Prueba visual en navegador: se abrió el prototipo servido por el backend (`http://localhost:4000/`)
  y se comprobó por consulta al DOM/estilos que el hero, el plancton, los separadores de ola, los
  bordes luminosos, la cabecera fotográfica de sistemas y la guía de metodología se renderizan. No
  se declara una revisión visual manual exhaustiva de todas las pantallas.

## Límites conocidos

- El conjunto detallado tiene 23 indicadores PMG y 15 AREL, aunque un apartado general del PDF menciona 24; se deja documentado para confirmar con la profesora y no se inventa un indicador.
- La tabla 30 AREL solo especifica la regla de muestreo para menos de cuatro lotes; con cuatro o más el prototipo pide verificación.
- El PDF indica un máximo general de 15 ejemplares evaluados por lote y un mínimo de 15 para el indicador de tamaño/peso; este prototipo registra 15 para dicho indicador y deja consignada esa interpretación.
- Las fotos remotas requieren Internet. El entorno no permitió descargarlas como archivos binarios locales; los enlaces, autores y licencias se listan en `CREDITOS_IMAGENES.md`.
- El backend no se ha ejecutado contra una base PostgreSQL real en este entorno de construcción; la lógica está cubierta por pruebas sin base de datos y la conexión se documenta para levantarse con Docker.
- Es un prototipo académico con datos locales y usuarios demo. No debe usarse para procesar datos reales/sensibles ni presentarse como sistema oficial certificado.
