# Revisión de metodología y reglas de cálculo

## Documento de referencia

Se revisó `Metodologia_ICA_Bienestar_Peces_v2.pdf`, versión 2.0 (2024), en particular las secciones 5, 6, 7 y 8 y las tablas relativas a evaluación, parámetros del agua, muestreo y puntuación. Este archivo resume las comprobaciones aplicadas al prototipo; no reemplaza el criterio profesional ni una validación oficial por parte del ICA.

## Conteo de indicadores

El catálogo incluido en `js/data.js` tiene 23 indicadores PMG (10 MBR, 6 MBA y 7 MBG) y 15 indicadores que marcan `arel: 1` (8 MBR, 5 MBA y 2 MBG). El apartado general de la metodología menciona 24 indicadores, mientras que el listado de la tabla de medidas y los capítulos detallados del proyecto enumeran 23 para PMG y 15 para AREL. Se conserva el conjunto explícito de indicadores del documento y no se inventa un indicador número 24; la diferencia queda documentada para confirmación académica.

## Ponderación global

| Modalidad | MBR | MBA | MBG | Total |
|---|---:|---:|---:|---:|
| PMG | 35 % | 35 % | 30 % | 100 % |
| AREL | 40 % | 40 % | 20 % | 100 % |

El cálculo promedia los indicadores puntuados de cada grupo y aplica la ponderación del esquema. Los valores posibles de puntuación se contrastan con la escala configurada para cada indicador. Un valor que no pertenezca a su escala o una respuesta pendiente se trata como pendiente. Los indicadores `No aplica` no se convierten en cero y no entran en el promedio de su grupo; si un grupo queda sin puntuaciones aplicables, la aplicación bloquea el resultado global definitivo porque la metodología no especifica una fórmula para resolver un grupo completo sin datos. Esta decisión es una regla prudencial del prototipo, no una fórmula adicional atribuida al ICA.

## Clasificación

Se aplican los límites de la sección 5.5: Bajo < 50 %; Medio desde 50 % y menor que 75 %; Alto desde 75 % y menor que 90 %; Excelente desde 90 %. Para evitar confusión visual, una evaluación incompleta muestra `Parcial`/`Incompleta` y no presenta la puntuación como definitiva. La finalización queda bloqueada si hay pendientes o un grupo sin datos aplicables.

## Parámetros del agua y mortalidad

Las tarjetas de especies muestran referencias como ejemplos y advierten que hay que verificar la modalidad del predio. Para AREL, la tabla 35 indica: cachama 24–29 °C, oxígeno disuelto 4 mg/L, pH 6,5 y turbidez 30 cm; tilapia 24–32 °C, oxígeno disuelto 4 mg/L, pH 6 y turbidez 25 cm; trucha 10–16 °C, oxígeno disuelto 8–8,5 mg/L, pH 7 y turbidez cristalina–45 cm. En los sistemas biofloc la metodología indica que la medición de turbidez no aplica.

Las tablas 23 (PMG) y 48 (AREL) diferencian cachama de otras especies para mortalidad: 100 puntos si cachama es ≤ 1 % o las demás especies ≤ 10 %; los intervalos inferiores están definidos en cada tabla. En PMG, la tabla 23 también indica cero puntos ante ausencia de registros o presencia de peces muertos, esqueletos, aves carroñeras o depredadores en las inmediaciones. No deben interpretarse los parámetros de una especie como universales para todas las especies ni todas las modalidades.

## Muestreo

Para PMG se conserva la tabla 1: menos de 4 lotes, todos; de 4 a 9, 3 lotes; más de 9, 4 lotes. La nota general de la metodología indica un máximo de 15 peces por lote cuando se evalúan directamente; sin embargo, el indicador de tamaño y peso en las secciones 7.2.1 y 8.2.1 dice que se seleccione un mínimo de quince (15) individuos. El texto, leído literalmente en conjunto, hace que para ese indicador el número sea exactamente 15. El flujo principal del prototipo registra 15 en ese caso y deja esta tensión documental señalada para que la docente confirme si se interpreta así para todo el muestreo o solo para ese indicador. No se extrapola esta regla de lotes PMG a los lotes AREL.

La tabla 30 para AREL solo explicita que se evalúan todos los lotes si hay menos de cuatro. Para cuatro o más, la tabla no fija otra regla en el documento leído; el prototipo ya no extrapola la regla PMG y solicita verificación antes de continuar.

## Cambios de seguridad funcional, validación y rotulado

- La valoración parcial ya no aparece como clasificación final; evaluaciones incompletas muestran su avance.
- El botón de finalización comprueba que no existan puntuaciones pendientes/inválidas y que cada grupo tenga datos válidos.
- Las constancias impresas incorporan un aviso visible de que son simulaciones académicas, no certificaciones oficiales del ICA.
- La galería fotográfica incluye texto alternativo, carga diferida y un fondo visual de respaldo cuando falla una imagen remota. Algunas tarjetas utilizan una fotografía local comparable como alternativa, sin adjudicar fotos genéricas a una especie equivocada.
- La regla de profundidad quedó diferenciada por modalidad: PMG contempla 2–5 m cuando el sistema es de jaulas (tabla 13); AREL evalúa el rango de 0,6–1,5 m de la tabla 40. La excepción de jaulas se oculta en el formulario AREL.
- Las operaciones para tamaño, lesiones y mortalidad comprueban que las cantidades estén en rangos coherentes; la mortalidad no puede superar la población usada como denominador.
- Las referencias bibliográficas de imágenes remotas de trucha y cachama se corrigieron para coincidir con sus fichas de Wikimedia Commons y sus licencias.

## Pruebas de lógica ejecutadas

Se añadió `tests/validation.js`, que ejecuta funciones de cálculo del propio `js/app.js` y catálogos del proyecto con Node.js, sin dependencias externas. Se superaron las pruebas de conteos (23/15), suma de ponderaciones (100 % por modalidad), resultado de 100 % para una evaluación con puntuación máxima, ejemplos ponderados (PMG 54,25 % y AREL 62 %), indicador pendiente, puntuación fuera de escala, grupo completo sin datos y límites de clasificación (50 %, 75 %, 90 %). También se comprobó la función usada para el rango de profundidad de PMG y AREL.

Se comprobó la sintaxis con `node --check` para los scripts JavaScript principales y el archivo de pruebas.

## Equivalencia frontend ↔ backend

El backend replica la lógica de cálculo del prototipo en `backend/src/domain/` (cálculo, muestreo, profundidad, mortalidad, calculadoras). Con `npm test` (desde `backend/`) se ejecutan pruebas de dominio y **80 escenarios aleatorizados de equivalencia** que comparan los resultados del backend con los del frontend a partir de los mismos insumos. El objetivo es que registrar una evaluación en local o a través de la API produzca el mismo puntaje y la misma clasificación; la suite pasa 32/32 sin necesidad de una base de datos en marcha.

## Interfaz y accesibilidad (Fase 12)

- El tema neón-acuático define una variante clara opt-in y respeta `prefers-reduced-motion`
  (desactiva plancton, bordes animados y transiciones de revelado).
- Las fotografías se integran como fondo de hero (cardumen), cabecera de la sección de sistemas y
  guía visual de la metodología (estanque), con imágenes locales del documento del ICA (crédito
  ICA, 2023) y alternativas locales para las fotos remotas de Wikimedia Commons.
- La apertura automatizada del navegador y la lógica se comprobaron sirviendo el sitio desde el
  backend; no se declara una revisión visual manual exhaustiva de todas las pantallas.

## Aspectos pendientes de validación

- Confirmar con la profesora/instructor la discrepancia documental del número general de indicadores (24 en el apartado general frente a los 23 indicadores PMG enumerados).
- Dos fotografías de la página 1 del PDF de metodología se extrajeron y se guardaron localmente con atribución al ICA (2023), y `Im/Peces.JPG` ya venía en el ZIP. Las imágenes adicionales de especies y equipos se enlazan desde Wikimedia Commons y necesitan conexión porque no fue posible descargar los archivos binarios externos desde el entorno de construcción.
- Esta revisión es una inspección automatizada/manual del prototipo y no es una certificación de cumplimiento por el ICA.
