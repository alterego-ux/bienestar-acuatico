# Docker — Bienestar Acuático

Esta guía permite ejecutar el proyecto en Ubuntu, Windows con Docker Desktop, macOS y otros sistemas que tengan Docker Engine/Desktop y Docker Compose v2.

## 1. Qué necesitas

- Docker Engine y el complemento Docker Compose v2 en Linux.
- O Docker Desktop en Windows/macOS.
- No necesitas instalar Node.js, Angular ni PostgreSQL en el equipo anfitrión.

### Instalar en Ubuntu

Sigue los pasos del repositorio oficial de Docker para tu versión de Ubuntu. El procedimiento oficial configura el repositorio APT y después instala Engine, CLI, Buildx y Compose:

```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl status docker
sudo docker run hello-world
```

Si usas Pop!_OS u otra derivada de Ubuntu, la guía de Docker advierte que sus instrucciones pueden funcionar, pero las distribuciones derivadas no están verificadas oficialmente por Docker. Comprueba que el nombre de versión/codename que usa APT corresponda con un repositorio compatible.

En Windows/macOS, instala Docker Desktop desde la página oficial y espera a que el motor esté iniciado antes de ejecutar Compose.

Verifica la instalación:

```bash
docker --version
docker compose version
```

## 2. Preparar las variables privadas

Desde la carpeta principal del proyecto, crea el archivo `.env` a partir del ejemplo.

Ubuntu/macOS:

```bash
cp .env.docker.example .env
```

PowerShell:

```powershell
Copy-Item .env.docker.example .env
```

Edita `.env` y cambia como mínimo `POSTGRES_PASSWORD` y `JWT_SECRET`. Puedes generar valores aleatorios seguros con OpenSSL:

```bash
openssl rand -hex 32
```

Copia un valor para la contraseña de PostgreSQL y genera otro distinto para `JWT_SECRET`. Usa valores hexadecimales para evitar problemas de interpretación de caracteres en el archivo `.env`.

Variables opcionales:

- `GEMINI_API_KEY`: activa AquaAssist cuando se configura una clave válida.
- `SUPABASE_URL` y `SUPABASE_SECRET_KEY`: necesarias para subir, descargar y eliminar nuevas evidencias en Supabase Storage.
- `WEB_HOST_PORT`: puerto del navegador; por defecto `8080`.
- `DB_HOST_PORT`: puerto local para herramientas externas de PostgreSQL; por defecto `5433`. La base no se publica en interfaces de red externas, solo en `127.0.0.1`.

## 3. Construir e iniciar

Ejecuta desde la raíz del proyecto:

```bash
docker compose config
docker compose up --build -d
```

La primera construcción puede tardar más porque descarga las imágenes base e instala las dependencias dentro de Docker.

Comprueba el estado:

```bash
docker compose ps
```

Los servicios `db`, `backend` y `frontend` deben aparecer como `Up`; cuando los healthchecks estén listos, Docker mostrará `healthy`.

Abre en el navegador:

- Aplicación: `http://localhost:8080`
- Salud de la API: `http://localhost:8080/api/salud`

La respuesta de salud debe indicar `baseDatos: "conectada"`.

## 4. Ver registros y detener

```bash
# Ver registros de los tres servicios
docker compose logs -f db backend frontend

# Detener contenedores sin borrar la base de datos
docker compose down

# Volver a iniciar después
docker compose up -d
```

La información de PostgreSQL se conserva en el volumen `postgres_data`. **No ejecutes `docker compose down -v` salvo que quieras borrar la base de datos local y comenzar desde cero.**

## 5. Solución de problemas

### El puerto 8080 ya está ocupado

Cambia `WEB_HOST_PORT` en `.env` (por ejemplo, `8081`) y vuelve a iniciar:

```bash
docker compose up --build -d
```

Abre entonces `http://localhost:8081`.

### El backend no queda saludable

Consulta los registros:

```bash
docker compose logs backend db
```

Comprueba que PostgreSQL aparezca saludable y que `POSTGRES_PASSWORD` no esté vacío. El backend aplica las migraciones y los datos de demostración al iniciar; si ese proceso falla, revisa el mensaje de PostgreSQL o de migración.

### Quieres reconstruir las imágenes desde cero

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

Esto no elimina el volumen de PostgreSQL. Si quieres borrar también la base local, el comando `docker compose down -v` la elimina de forma permanente.

### En Ubuntu aparece permiso denegado al ejecutar Docker

Comprueba primero que Docker Engine esté activo. Para la primera prueba puedes anteponer `sudo` a los comandos. No agregues usuarios al grupo `docker` en un equipo compartido o institucional sin autorización: ese grupo concede privilegios elevados sobre el sistema.

## 6. Qué hace cada contenedor

| Servicio | Tecnología | Responsabilidad |
|---|---|---|
| `frontend` | Nginx + compilación Angular | Entrega la aplicación web y reenvía `/api` al backend. |
| `backend` | Node.js + Express | Ejecuta la API, autenticación, reglas y migraciones SQL. |
| `db` | PostgreSQL 16 | Guarda usuarios, predios, evaluaciones y demás registros. |

Los contenedores comparten una red interna creada por Docker Compose. El navegador solo necesita acceder al puerto publicado del frontend.

## 7. Consideraciones antes de publicar

- El `.env` real es privado y no debe subirse a GitHub.
- Las cuentas de demostración creadas por las semillas (`admin@ica.demo`, `evaluador@ica.demo`, etc.) son solo para pruebas académicas; no deben quedar como credenciales de un despliegue público.
- Gemini es opcional; sin `GEMINI_API_KEY`, AquaAssist no podrá consultar el modelo.
- Evidencias: con `STORAGE_DRIVER=auto` se usa Supabase Storage si está configurado y, si falla, se guardan en el volumen Docker `backend_uploads`. Con `STORAGE_DRIVER=local` todo queda dentro de Docker (sin Supabase). `GET /api/salud` muestra el modo en `almacenEvidencias`.
- Esta configuración es para desarrollo/pruebas y demostración. Antes de producción se deben revisar contraseñas, políticas de respaldo, acceso, CORS, registros y seguridad.
