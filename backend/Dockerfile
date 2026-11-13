FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=4100 \
    UPLOADS_DIR=/app/uploads

WORKDIR /app

# Instala solo dependencias necesarias para ejecutar la API.
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && mkdir -p /app/uploads \
    && chown -R node:node /app

# Copia únicamente el código y los datos requeridos por el backend.
COPY --chown=node:node src ./src
COPY --chown=node:node data ./data

USER node

EXPOSE 4100

# Prepara el esquema y los datos iniciales (si la base está vacía) antes de iniciar la API.
CMD ["sh", "-c", "node src/db/ensure.js && exec node src/index.js"]
