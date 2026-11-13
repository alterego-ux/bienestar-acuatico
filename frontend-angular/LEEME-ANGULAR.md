# Bienestar Acuático · Frontend Angular (tema ejecutivo)

## Arranque (un solo comando, sin el proyecto anterior)
Desde la **raíz del proyecto** (o desde `frontend-angular`):

    npm run dev

Requiere Node 22.22.3+ o 24.15+. El script crea `backend/.env` si falta, instala dependencias,
aplica migraciones, carga datos demo si la base está vacía y levanta
**API → http://localhost:4100** y **Angular → http://localhost:4200** (proxy `/api`).

Base de datos: `docker compose up -d db` (PostgreSQL propio, puerto 5433) **o** Supabase
(pega la cadena *Session pooler* en `DATABASE_URL` de `backend/.env`).
El proyecto anterior usaba el puerto 4000; este no lo necesita ni lo sirve.

## Flujo
Predios → ficha del predio (datos, especies y lotes, historial solo de esa finca) → «Nueva evaluación»
→ elegir especie → muestreo automático (<4 todos · 4–9 → 3 · >9 → 4) → indicadores (0/20/55/100)
→ finalizar → clasificación + recomendaciones de los criterios con 0 puntos.

## Tema
Claro/oscuro con el botón de la barra superior (se recuerda; por defecto sigue al sistema).

Usuarios demo: admin@ica.demo / admin123 · evaluador@ica.demo / 1234
