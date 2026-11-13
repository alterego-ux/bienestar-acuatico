-- Corrige el enlace de la 5.ª libertad («Manifestar un comportamiento natural»).
-- Los indicadores RE10 y AN06 la mencionan, pero el seed original buscaba el nombre
-- «Comportamiento natural» y nunca creaba la relación. Es idempotente (ON CONFLICT DO NOTHING).
INSERT INTO indicador_libertad (indicador_id, libertad_id)
SELECT i.id, l.id
  FROM indicador i
  JOIN libertad l ON l.nombre = 'Manifestar un comportamiento natural'
 WHERE i.codigo IN ('RE10', 'AN06')
ON CONFLICT DO NOTHING;
