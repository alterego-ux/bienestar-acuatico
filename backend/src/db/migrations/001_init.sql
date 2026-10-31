-- =====================================================================
-- 001_init.sql · Esquema base
-- Bienestar Acuático · Metodología ICA v2.0 (2024) · Prototipo académico
-- Motor: PostgreSQL 13+
-- El esquema sigue el diagrama ER aprobado en docs/DISENO_BASE_DATOS_UML.md
-- =====================================================================

BEGIN;

-- ---------- Función genérica para "actualizado_en" ----------
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- CATÁLOGOS Y PARAMETRIZACIÓN
-- =====================================================================

CREATE TABLE rol (
  id           SERIAL PRIMARY KEY,
  codigo       VARCHAR(30)  NOT NULL UNIQUE,
  nombre       VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(400) NOT NULL DEFAULT '',
  creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE departamento (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE municipio (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  departamento_id INTEGER NOT NULL REFERENCES departamento(id) ON DELETE RESTRICT,
  UNIQUE (nombre, departamento_id)
);

CREATE TABLE modalidad (
  id        SERIAL PRIMARY KEY,
  codigo    VARCHAR(20) NOT NULL UNIQUE,           -- PMG | AREL
  nombre    VARCHAR(120) NOT NULL,
  peso_mbr  NUMERIC(5,2) NOT NULL CHECK (peso_mbr BETWEEN 0 AND 100),
  peso_mba  NUMERIC(5,2) NOT NULL CHECK (peso_mba BETWEEN 0 AND 100),
  peso_mbg  NUMERIC(5,2) NOT NULL CHECK (peso_mbg BETWEEN 0 AND 100),
  CONSTRAINT modalidad_suma_100 CHECK (peso_mbr + peso_mba + peso_mbg = 100)
);

CREATE TABLE tipo_medida (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(10) NOT NULL UNIQUE,          -- MBR | MBA | MBG
  nombre      VARCHAR(60) NOT NULL,
  descripcion VARCHAR(200) NOT NULL DEFAULT '',
  color       VARCHAR(20)  NOT NULL DEFAULT '#4aa3ff'
);

CREATE TABLE ponderacion (
  id              SERIAL PRIMARY KEY,
  modalidad_id    INTEGER NOT NULL REFERENCES modalidad(id) ON DELETE CASCADE,
  tipo_medida_id  INTEGER NOT NULL REFERENCES tipo_medida(id) ON DELETE RESTRICT,
  peso_pct        NUMERIC(5,2) NOT NULL CHECK (peso_pct BETWEEN 0 AND 100),
  UNIQUE (modalidad_id, tipo_medida_id)
);

CREATE TABLE tipo_productor (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(120) NOT NULL UNIQUE,
  modalidad_id INTEGER REFERENCES modalidad(id) ON DELETE SET NULL
);

CREATE TABLE sistema_productivo (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL UNIQUE,
  densidad_ref  VARCHAR(60)  NOT NULL DEFAULT ''
);

CREATE TABLE especie (
  id                SERIAL PRIMARY KEY,
  codigo            VARCHAR(30)  NOT NULL UNIQUE,
  nombre_comun      VARCHAR(80)  NOT NULL,
  nombre_cientifico VARCHAR(120) NOT NULL DEFAULT '',
  tipo_agua         VARCHAR(40)  NOT NULL DEFAULT '',
  temp_min          NUMERIC(5,2),
  temp_max          NUMERIC(5,2),
  od_min            NUMERIC(5,2),
  ph_min            NUMERIC(5,2),
  turbidez_ref      VARCHAR(80)  NOT NULL DEFAULT '',
  turbidez_aplica   BOOLEAN      NOT NULL DEFAULT TRUE,
  mortalidad_100    NUMERIC(6,2),
  mortalidad_55     NUMERIC(6,2),
  mortalidad_20     NUMERIC(6,2),
  mortalidad_txt    VARCHAR(60)  NOT NULL DEFAULT '',
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE libertad (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(160) NOT NULL UNIQUE,
  descripcion VARCHAR(400) NOT NULL DEFAULT ''
);

CREATE TABLE indicador (
  id              SERIAL PRIMARY KEY,
  codigo          VARCHAR(10)  NOT NULL UNIQUE,      -- RE01, AN01, GE01…
  tipo_medida_id  INTEGER NOT NULL REFERENCES tipo_medida(id) ON DELETE RESTRICT,
  nombre          VARCHAR(200) NOT NULL,
  descripcion     VARCHAR(400) NOT NULL DEFAULT '',
  pregunta        VARCHAR(400) NOT NULL DEFAULT '',
  metodo          VARCHAR(300) NOT NULL DEFAULT '',
  no_aplica       VARCHAR(300) NOT NULL DEFAULT '',
  recomendacion   VARCHAR(1000) NOT NULL DEFAULT '',
  aplica_pmg      BOOLEAN NOT NULL DEFAULT TRUE,
  aplica_arel     BOOLEAN NOT NULL DEFAULT FALSE,
  calculadora     VARCHAR(40),                        -- dietas | profundidad | tamano | ...
  orden           INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE indicador_libertad (
  id            SERIAL PRIMARY KEY,
  indicador_id  INTEGER NOT NULL REFERENCES indicador(id) ON DELETE CASCADE,
  libertad_id   INTEGER NOT NULL REFERENCES libertad(id) ON DELETE CASCADE,
  UNIQUE (indicador_id, libertad_id)
);

CREATE TABLE indicador_nivel (
  id            SERIAL PRIMARY KEY,
  indicador_id  INTEGER NOT NULL REFERENCES indicador(id) ON DELETE CASCADE,
  puntaje       INTEGER NOT NULL CHECK (puntaje IN (0,20,55,100)),
  descripcion   VARCHAR(600) NOT NULL,
  orden         INTEGER NOT NULL DEFAULT 0,
  UNIQUE (indicador_id, puntaje)
);

CREATE TABLE regla_muestreo (
  id                 SERIAL PRIMARY KEY,
  modalidad_id       INTEGER NOT NULL REFERENCES modalidad(id) ON DELETE CASCADE,
  min_lotes          INTEGER NOT NULL,
  max_lotes          INTEGER,                         -- NULL = sin límite superior
  lotes_a_muestrear  INTEGER,                         -- NULL = no documentado / requiere verificación
  nota               VARCHAR(300) NOT NULL DEFAULT ''
);

CREATE TABLE regla_profundidad (
  id            SERIAL PRIMARY KEY,
  modalidad_id  INTEGER NOT NULL REFERENCES modalidad(id) ON DELETE CASCADE,
  es_jaula      BOOLEAN NOT NULL DEFAULT FALSE,
  min_m         NUMERIC(4,2) NOT NULL,
  max_m         NUMERIC(4,2) NOT NULL,
  nota          VARCHAR(300) NOT NULL DEFAULT '',
  UNIQUE (modalidad_id, es_jaula)
);

CREATE TABLE regla_mortalidad (
  id            SERIAL PRIMARY KEY,
  especie_id    INTEGER NOT NULL REFERENCES especie(id) ON DELETE CASCADE,
  modalidad_id  INTEGER REFERENCES modalidad(id) ON DELETE CASCADE,
  umbral_100    NUMERIC(6,2) NOT NULL,
  umbral_55     NUMERIC(6,2) NOT NULL,
  umbral_20     NUMERIC(6,2) NOT NULL,
  UNIQUE (especie_id, modalidad_id)
);

CREATE TABLE categoria_clasificacion (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(40) NOT NULL UNIQUE,
  min_pct     NUMERIC(5,2) NOT NULL,
  max_pct     NUMERIC(5,2) NOT NULL,
  color       VARCHAR(20) NOT NULL,
  descripcion VARCHAR(400) NOT NULL DEFAULT ''
);

-- =====================================================================
-- OPERACIÓN
-- =====================================================================

CREATE TABLE usuario (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  rol_id        INTEGER NOT NULL REFERENCES rol(id) ON DELETE RESTRICT,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_usuario_upd BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TABLE predio (
  id                SERIAL PRIMARY KEY,
  codigo            VARCHAR(30)  NOT NULL UNIQUE,
  nombre            VARCHAR(160) NOT NULL,
  responsable       VARCHAR(160) NOT NULL,
  email             VARCHAR(160) NOT NULL,
  tipo_productor_id INTEGER REFERENCES tipo_productor(id) ON DELETE SET NULL,
  departamento_id   INTEGER REFERENCES departamento(id) ON DELETE SET NULL,
  municipio_id      INTEGER REFERENCES municipio(id) ON DELETE SET NULL,
  vereda            VARCHAR(160) NOT NULL DEFAULT '',
  direccion         VARCHAR(200) NOT NULL DEFAULT '',
  latitud           NUMERIC(10,6),
  longitud          NUMERIC(10,6),
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_predio_upd BEFORE UPDATE ON predio
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TABLE predio_sistema (
  id                   SERIAL PRIMARY KEY,
  predio_id            INTEGER NOT NULL REFERENCES predio(id) ON DELETE CASCADE,
  sistema_productivo_id INTEGER NOT NULL REFERENCES sistema_productivo(id) ON DELETE RESTRICT,
  UNIQUE (predio_id, sistema_productivo_id)
);

CREATE TABLE lote_predio (
  id             SERIAL PRIMARY KEY,
  predio_id      INTEGER NOT NULL REFERENCES predio(id) ON DELETE CASCADE,
  especie_id     INTEGER REFERENCES especie(id) ON DELETE SET NULL,
  cantidad       INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  peso_promedio_g INTEGER NOT NULL DEFAULT 0 CHECK (peso_promedio_g >= 0),
  numero_lotes   INTEGER NOT NULL DEFAULT 0 CHECK (numero_lotes >= 0)
);

CREATE TABLE evaluacion (
  id              SERIAL PRIMARY KEY,
  predio_id       INTEGER NOT NULL REFERENCES predio(id) ON DELETE CASCADE,
  evaluador_id    INTEGER NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
  modalidad_id    INTEGER NOT NULL REFERENCES modalidad(id) ON DELETE RESTRICT,
  especie_id      INTEGER REFERENCES especie(id) ON DELETE SET NULL,
  fecha           DATE NOT NULL,
  evaluador_nombre VARCHAR(160) NOT NULL DEFAULT '',
  lotes_sembrados INTEGER NOT NULL DEFAULT 0 CHECK (lotes_sembrados >= 0),
  estado          VARCHAR(20) NOT NULL DEFAULT 'en_proceso'
                    CHECK (estado IN ('borrador','en_proceso','finalizada','validada','cerrada')),
  puntaje_global  NUMERIC(6,2),
  clasificacion   VARCHAR(20),
  etapa_visita    VARCHAR(4),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrado_en      TIMESTAMPTZ,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evaluacion_predio ON evaluacion(predio_id);
CREATE INDEX idx_evaluacion_estado ON evaluacion(estado);
CREATE INDEX idx_evaluacion_fecha  ON evaluacion(fecha);
CREATE TRIGGER trg_evaluacion_upd BEFORE UPDATE ON evaluacion
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TABLE evaluacion_lote (
  id            SERIAL PRIMARY KEY,
  evaluacion_id INTEGER NOT NULL REFERENCES evaluacion(id) ON DELETE CASCADE,
  nombre_lote   VARCHAR(60) NOT NULL,
  UNIQUE (evaluacion_id, nombre_lote)
);

CREATE TABLE evaluacion_muestreo (
  id                SERIAL PRIMARY KEY,
  evaluacion_id     INTEGER NOT NULL REFERENCES evaluacion(id) ON DELETE CASCADE,
  especie_id        INTEGER REFERENCES especie(id) ON DELETE SET NULL,
  cantidad_evaluada INTEGER NOT NULL DEFAULT 0,
  peso_promedio_g   INTEGER NOT NULL DEFAULT 0,
  lote_ref          VARCHAR(60) NOT NULL DEFAULT '',
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE respuesta_indicador (
  id             SERIAL PRIMARY KEY,
  evaluacion_id  INTEGER NOT NULL REFERENCES evaluacion(id) ON DELETE CASCADE,
  indicador_id   INTEGER NOT NULL REFERENCES indicador(id) ON DELETE CASCADE,
  puntaje        INTEGER CHECK (puntaje IS NULL OR puntaje IN (0,20,55,100)),
  no_aplica      BOOLEAN NOT NULL DEFAULT FALSE,
  observacion    VARCHAR(2000) NOT NULL DEFAULT '',
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluacion_id, indicador_id)
);
CREATE INDEX idx_respuesta_eval ON respuesta_indicador(evaluacion_id);
CREATE TRIGGER trg_respuesta_upd BEFORE UPDATE ON respuesta_indicador
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TABLE respuesta_calculo (
  id            SERIAL PRIMARY KEY,
  respuesta_id  INTEGER NOT NULL REFERENCES respuesta_indicador(id) ON DELETE CASCADE,
  clave         VARCHAR(40) NOT NULL,
  valor         VARCHAR(200) NOT NULL DEFAULT '',
  UNIQUE (respuesta_id, clave)
);

CREATE TABLE evidencia (
  id              SERIAL PRIMARY KEY,
  respuesta_id    INTEGER NOT NULL REFERENCES respuesta_indicador(id) ON DELETE CASCADE,
  nombre_archivo  VARCHAR(260) NOT NULL,
  tipo_mime       VARCHAR(120) NOT NULL DEFAULT '',
  tamano_bytes    BIGINT NOT NULL DEFAULT 0,
  almacenamiento  VARCHAR(400) NOT NULL DEFAULT '',   -- ruta relativa o clave de IndexedDB
  subido_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evidencia_respuesta ON evidencia(respuesta_id);

CREATE TABLE recomendacion (
  id            SERIAL PRIMARY KEY,
  evaluacion_id INTEGER NOT NULL REFERENCES evaluacion(id) ON DELETE CASCADE,
  indicador_id  INTEGER REFERENCES indicador(id) ON DELETE SET NULL,
  titulo        VARCHAR(200) NOT NULL,
  texto         VARCHAR(2000) NOT NULL,
  puntaje_ref   INTEGER,
  orden         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_recomendacion_eval ON recomendacion(evaluacion_id);

CREATE TABLE plan_mejora (
  id            SERIAL PRIMARY KEY,
  evaluacion_id INTEGER NOT NULL REFERENCES evaluacion(id) ON DELETE CASCADE,
  accion        VARCHAR(2000) NOT NULL,
  responsable   VARCHAR(160) NOT NULL DEFAULT '',
  prioridad     VARCHAR(10) NOT NULL DEFAULT 'Media' CHECK (prioridad IN ('Alta','Media','Baja')),
  plazo         DATE,
  completado    BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_plan_eval ON plan_mejora(evaluacion_id);

CREATE TABLE auditoria (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  accion      VARCHAR(200) NOT NULL,
  entidad     VARCHAR(60)  NOT NULL DEFAULT '',
  entidad_id  INTEGER,
  fecha_hora  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_hora DESC);

-- =====================================================================
-- Tabla de control de migraciones
-- =====================================================================
CREATE TABLE IF NOT EXISTS migraciones (
  id          SERIAL PRIMARY KEY,
  archivo     VARCHAR(200) NOT NULL UNIQUE,
  aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
