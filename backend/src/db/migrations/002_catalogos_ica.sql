-- =====================================================================
-- 002_catalogos_ica.sql · Catálogos fijos de referencia
-- Valores tomados del prototipo y de la metodología ICA v2.0 (2024).
-- Los catálogos grandes (indicadores, niveles, especies, reglas) se cargan
-- desde data/catalogo-ica.json con `npm run seed`.
-- =====================================================================

BEGIN;

-- ---------- Roles ----------
INSERT INTO rol (codigo, nombre, descripcion) VALUES
  ('admin','Administrador','Gestiona usuarios, roles, catálogos, especies y parámetros; acceso total.'),
  ('docente','Docente','Parametriza listas de chequeo, revisa y valida evaluaciones.'),
  ('evaluador','Estudiante evaluador','Registra predios y realiza evaluaciones en campo.'),
  ('consultor','Consultor externo','Solo consulta resultados e informes.')
ON CONFLICT (codigo) DO NOTHING;

-- ---------- Tipos de medida ----------
INSERT INTO tipo_medida (codigo, nombre, descripcion, color) VALUES
  ('MBR','Recursos','Medidas basadas en los recursos','#4aa3ff'),
  ('MBA','Animal','Medidas basadas en el animal','#2dd4a0'),
  ('MBG','Gestión','Medidas basadas en la gestión','#9b7bff')
ON CONFLICT (codigo) DO NOTHING;

-- ---------- Modalidades y ponderaciones ----------
INSERT INTO modalidad (codigo, nombre, peso_mbr, peso_mba, peso_mbg) VALUES
  ('PMG','Pequeños, medianos y grandes acuicultores',35,35,30),
  ('AREL','Acuicultura de subsistencia y AREL',40,40,20)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ponderacion (modalidad_id, tipo_medida_id, peso_pct)
SELECT m.id, t.id, v.peso
FROM (VALUES
  ('PMG','MBR',35),('PMG','MBA',35),('PMG','MBG',30),
  ('AREL','MBR',40),('AREL','MBA',40),('AREL','MBG',20)
) AS v(mod, med, peso)
JOIN modalidad m ON m.codigo = v.mod
JOIN tipo_medida t ON t.codigo = v.med
ON CONFLICT (modalidad_id, tipo_medida_id) DO NOTHING;

-- ---------- Categorías de clasificación (§5.5) ----------
INSERT INTO categoria_clasificacion (nombre, min_pct, max_pct, color, descripcion) VALUES
  ('Bajo',      0, 50,  '#ef5b5b','Deficiencias que requieren acciones a corto y mediano plazo.'),
  ('Medio',    50, 75,  '#f5b83d','Si no se corrige rápido, las afectaciones pueden deteriorar la condición de los animales.'),
  ('Alto',     75, 90,  '#4aa3ff','Buen bienestar, pero susceptible de ser mejorado.'),
  ('Excelente',90, 100, '#45e6d2','Bienestar óptimo, con indicadores de bienestar positivo.')
ON CONFLICT (nombre) DO NOTHING;

-- ---------- Las 5 libertades ----------
INSERT INTO libertad (nombre, descripcion) VALUES
  ('Hambre, sed y mala nutrición','Alimento de calidad, bien distribuido y ajustado a la biomasa, con agua apta para la especie.'),
  ('Molestias físicas y térmicas','Temperatura, ruido, vibraciones y profundidad dentro de rangos que no generen estrés.'),
  ('Dolor, lesión y enfermedad','Piel, branquias y aletas sanas; captura, manejo y medicación responsables.'),
  ('Temor y angustia','Procedimientos que reducen el miedo y personal capacitado en bienestar animal.'),
  ('Manifestar un comportamiento natural','Espacio, profundidad y densidades que permiten al pez nadar y expresar su conducta natural.')
ON CONFLICT (nombre) DO NOTHING;

-- ---------- Sistemas productivos ----------
INSERT INTO sistema_productivo (nombre, densidad_ref) VALUES
  ('Estanque','2 kg/m²'),
  ('IPRS (raceways en estanque)','15 kg/m³'),
  ('Jaulas flotantes','10 kg/m³'),
  ('RAS (recirculación)','10 kg/m³'),
  ('Biofloc',''),
  ('Tanques en geomembrana','7 kg/m³'),
  ('Integrado (acuaponía)','')
ON CONFLICT (nombre) DO NOTHING;

-- ---------- Tipos de productor ----------
INSERT INTO tipo_productor (nombre, modalidad_id)
SELECT v.nombre, m.id
FROM (VALUES
  ('Acuicultor de subsistencia','AREL'),
  ('Acuicultura de recursos limitados (AREL)','AREL'),
  ('Pequeño acuicultor','PMG'),
  ('Mediano acuicultor','PMG'),
  ('Gran acuicultor','PMG')
) AS v(nombre, mod)
JOIN modalidad m ON m.codigo = v.mod
ON CONFLICT (nombre) DO NOTHING;

-- ---------- Departamentos y municipios ----------
INSERT INTO departamento (nombre) VALUES
  ('Cundinamarca'),('Boyacá'),('Meta'),('Huila'),('Tolima'),
  ('Antioquia'),('Santander'),('Valle del Cauca'),('Casanare'),('Cauca')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO municipio (nombre, departamento_id)
SELECT v.mun, d.id
FROM (VALUES
  ('Fusagasugá','Cundinamarca'),('Silvania','Cundinamarca'),('Girardot','Cundinamarca'),('Tocaima','Cundinamarca'),('La Mesa','Cundinamarca'),
  ('Tunja','Boyacá'),('Moniquirá','Boyacá'),('Garagoa','Boyacá'),('Miraflores','Boyacá'),
  ('Villavicencio','Meta'),('Granada','Meta'),('Acacías','Meta'),('Puerto López','Meta'),
  ('Neiva','Huila'),('Gigante','Huila'),('Garzón','Huila'),('Campoalegre','Huila'),
  ('Ibagué','Tolima'),('Espinal','Tolima'),('Honda','Tolima'),('Melgar','Tolima'),
  ('Medellín','Antioquia'),('San Jerónimo','Antioquia'),('Santa Fe de Antioquia','Antioquia'),
  ('Bucaramanga','Santander'),('Barrancabermeja','Santander'),('San Gil','Santander'),
  ('Cali','Valle del Cauca'),('Palmira','Valle del Cauca'),('Tuluá','Valle del Cauca'),
  ('Yopal','Casanare'),('Aguazul','Casanare'),
  ('Popayán','Cauca'),('Timbío','Cauca')
) AS v(mun, dep)
JOIN departamento d ON d.nombre = v.dep
ON CONFLICT (nombre, departamento_id) DO NOTHING;

COMMIT;
