/* =====================================================================
   BIENESTAR ACUÁTICO · Catálogos, constantes e indicadores
   Metodología ICA v2.0 (2024) · Peces de cultivo para consumo humano
   ===================================================================== */

/* ---------- Departamentos y municipios ---------- */
const DEPTOS = {
  "Cundinamarca":  ["Fusagasugá","Silvania","Girardot","Tocaima","La Mesa"],
  "Boyacá":        ["Tunja","Moniquirá","Garagoa","Miraflores"],
  "Meta":          ["Villavicencio","Granada","Acacías","Puerto López"],
  "Huila":         ["Neiva","Gigante","Garzón","Campoalegre"],
  "Tolima":        ["Ibagué","Espinal","Honda","Melgar"],
  "Antioquia":     ["Medellín","San Jerónimo","Santa Fe de Antioquia"],
  "Santander":     ["Bucaramanga","Barrancabermeja","San Gil"],
  "Valle del Cauca":["Cali","Palmira","Tuluá"],
  "Casanare":      ["Yopal","Aguazul"],
  "Cauca":         ["Popayán","Timbío"]
};

/* ---------- Catálogos de productor y sistemas ---------- */
const TIPOS_PRODUCTOR = [
  "Acuicultor de subsistencia",
  "Acuicultura de recursos limitados (AREL)",
  "Pequeño acuicultor",
  "Mediano acuicultor",
  "Gran acuicultor"
];

const SISTEMAS = [
  "Estanque",
  "IPRS (raceways en estanque)",
  "Jaulas flotantes",
  "RAS (recirculación)",
  "Biofloc",
  "Tanques en geomembrana",
  "Integrado (acuaponía)"
];

const DENSIDADES = {
  "Estanque":                 "2 kg/m²",
  "IPRS (raceways en estanque)":"15 kg/m³",
  "Jaulas flotantes":         "10 kg/m³",
  "RAS (recirculación)":      "10 kg/m³",
  "Tanques en geomembrana":   "7 kg/m³"
};

/* ---------- Estados de evaluación ---------- */
const ESTADOS = {
  borrador:   "Borrador",
  en_proceso: "En proceso",
  finalizada: "Finalizada",
  validada:   "Validada",
  cerrada:    "Cerrada"
};

/* ---------- Tipos de medida ---------- */
const MEDIDAS = {
  MBR: { n:"Recursos", full:"Medidas basadas en los recursos", c:"#4aa3ff" },
  MBA: { n:"Animal",   full:"Medidas basadas en el animal",     c:"#2dd4a0" },
  MBG: { n:"Gestión",  full:"Medidas basadas en la gestión",   c:"#9b7bff" }
};

/* ---------- Ponderaciones base ---------- */
const PESOS_BASE = {
  PMG:  { MBR:35, MBA:35, MBG:30 },
  AREL: { MBR:40, MBA:40, MBG:20 }
};

/* ---------- Las 5 libertades del bienestar animal ---------- */
const LIBERTADES = [
  "Hambre, sed y mala nutrición",
  "Molestias físicas y térmicas",
  "Dolor, lesión y enfermedad",
  "Temor y angustia",
  "Manifestar un comportamiento natural"
];

/* ---------- Especies de referencia ---------- */
const ESPECIES_BASE = [
  { id:"cachama", n:"Cachama", act:true, temp:"24 - 29 °C",       od:"4 mg/L",        ph:"6,5", turb:"30 cm",              mort:"≤ 1% (100 pts)"  },
  { id:"tilapia", n:"Tilapia", act:true, temp:"24 - 32 °C",       od:"4 mg/L",        ph:"6",   turb:"25 cm",              mort:"≤ 10% (100 pts)" },
  { id:"trucha",  n:"Trucha",  act:true, temp:"10 - 16 °C",       od:"8 - 8,5 mg/L",  ph:"7",   turb:"Cristalina - 45 cm", mort:"≤ 10% (100 pts)" },
  { id:"otra",    n:"Otra especie de pez", act:true, temp:"Según especie", od:"Según especie", ph:"Según especie", turb:"Según especie", mort:"≤ 10% (100 pts)" }
];

/* ---------- Roles del sistema ---------- */
const ROLES = {
  admin: {
    n:"Administrador",
    d:"Gestiona usuarios, roles, catálogos, especies y parámetros; acceso total.",
    p:["Usuarios y roles","Catálogos y especies","Parámetros de la norma","Todas las evaluaciones","Auditoría"]
  },
  docente: {
    n:"Docente",
    d:"Parametriza listas de chequeo, revisa y valida evaluaciones.",
    p:["Validar y cerrar evaluaciones","Ver todos los predios","Tablero e historial"]
  },
  evaluador: {
    n:"Estudiante evaluador",
    d:"Registra predios y realiza evaluaciones en campo.",
    p:["Crear predios","Crear y diligenciar evaluaciones","Generar informe y recomendaciones"]
  },
  consultor: {
    n:"Consultor externo",
    d:"Solo consulta resultados e informes.",
    p:["Historial","Tablero","Informes (solo lectura)"]
  }
};

/* ---------- Preguntas frecuentes ---------- */
const AYUDA = [
  ["¿Cómo se calcula el puntaje final?","Cada indicador vale 0, 20, 55 o 100 puntos. Se promedia cada tipo de medida (recursos, animal y gestión) y se multiplica por su peso: 35/35/30 para pequeños, medianos y grandes acuicultores, y 40/40/20 para AREL. La suma es el puntaje final del predio."],
  ["¿Qué significa cada clasificación?","Excelente: 90% o más. Alto: 75% a menos de 90%. Medio: 50% a menos de 75%. Bajo: menos de 50%."],
  ["¿Cuántos lotes debo muestrear?","Menos de 4 lotes sembrados: todos. De 4 a 9: 3 lotes. Más de 9: 4 lotes. En AREL con menos de 4 lotes se evalúan todos. Máximo 15 peces por lote."],
  ["¿Qué es un indicador 'No aplica'?","Es el que no corresponde al predio (por ejemplo, calidad del aire inyectado si no hay aireadores). No cuenta en el promedio de su tipo de medida."],
  ["¿Cuándo se genera el certificado?","Cuando la evaluación está finalizada con 75% o más y ningún indicador quedó en 0 puntos."],
  ["¿Las recomendaciones son definitivas?","No. Son un apoyo a la decisión: el evaluador debe revisarlas, ajustarlas o complementarlas antes de incluirlas en el informe. Se generan localmente con reglas y no dependen de ningún servicio externo."],
  ["¿Se pierde la información si cierro la página?","No. La información se guarda localmente en tu navegador (localStorage + IndexedDB). Puedes continuar donde quedaste en el mismo dispositivo."]
];

/* =====================================================================
   INDICADORES · 23 para PMG · 15 aplicables a AREL (arel:1)
   ===================================================================== */
const IND = [

  /* ================= MEDIDAS BASADAS EN LOS RECURSOS (MBR) ================= */
  {
    id:"RE01", t:"MBR", n:"Calidad del alimento",
    lib:"Hambre, sed y mala nutrición",
    met:"Inspección visual: almacenamiento y etiquetas",
    q:"¿El alimento es de calidad y se almacena con buenas prácticas?",
    arel:1,
    lv:[
      [100,"Alimento balanceado con registro ICA para la etapa, sin mortalidad ni despojos y con buenas prácticas de almacenamiento"],
      [0,"Incumple alguna condición: sin balanceado, sin registro, no es para la especie/etapa, se da mortalidad o se almacena mal"]
    ],
    rec:"Comprar solo alimento balanceado con registro ICA formulado para la especie y la etapa; almacenarlo sobre estibas, separado de la pared y con control de plagas."
  },
  {
    id:"RE02", t:"MBR", n:"Disponibilidad y acceso al alimento",
    lib:"Hambre, sed y mala nutrición",
    met:"Documental y visual al momento de alimentar",
    q:"¿El alimento se distribuye donde los peces acceden y en horarios adecuados?",
    arel:1,
    lv:[
      [100,"Cumple todo: procedimiento escrito y firmado con registros, distribución adecuada, zona libre de plantas y con profundidad, horario con buen oxígeno y alimentadores funcionando"],
      [55,"Cumple al menos 3 de las condiciones de distribución, zona, horario y alimentadores"],
      [20,"Cumple al menos 2 condiciones"],
      [0,"Cumple menos de 2 condiciones"]
    ],
    rec:"Documentar y firmar el procedimiento de alimentación; distribuir el alimento lejos de la compuerta de salida, en zonas libres de plantas y en horarios de buen oxígeno."
  },
  {
    id:"RE03", t:"MBR", n:"Ajuste de dietas",
    lib:"Hambre, sed y mala nutrición",
    met:"Documental (registros de alimentación)",
    q:"¿Se ajustan las dietas periódicamente según la biomasa?",
    arel:1, calc:"dietas",
    lv:[
      [100,"Se ajusta en períodos menores a 30 días"],
      [55,"Se ajusta entre 30 y 45 días"],
      [20,"Se ajusta en períodos de más de 45 días"],
      [0,"No se ajusta o no hay registros"]
    ],
    rec:"Muestrear la biomasa al menos cada 30 días y ajustar la ración según peso promedio, biomasa y temperatura; registrar cada ajuste."
  },
  {
    id:"RE04", t:"MBR", n:"Calidad del agua",
    lib:"Hambre, sed y mala nutrición · Molestias físicas y térmicas",
    met:"Documental y visual de algunos espejos de agua",
    q:"¿Cuál es la calidad del agua para la especie cultivada?",
    arel:1,
    lv:[
      [100,"Análisis fisicoquímicos y microbiológicos vigentes (< 6 meses; < 1 año en subsistencia y pequeños), registros de temperatura, turbidez, pH y oxígeno, espejos limpios sin peces muertos y correcciones aplicadas"],
      [0,"Falta alguna de las condiciones anteriores"]
    ],
    rec:"Realizar los análisis de agua en el plazo exigido, llevar registros de temperatura, oxígeno, pH y turbidez y retirar de inmediato los peces muertos."
  },
  {
    id:"RE05", t:"MBR", n:"Ausencia de ruido extremo y vibraciones",
    lib:"Molestias físicas y térmicas",
    met:"Visual y entrevista con el productor",
    q:"¿Se controla el ruido generado por fuentes externas?",
    arel:1,
    lv:[
      [100,"Equipos sin ruido ni vibración y mínimo 16 horas de quietud y calma"],
      [55,"Equipos ruidosos pero mínimo 12 horas de quietud"],
      [20,"Equipos ruidosos pero mínimo 8 horas de quietud"],
      [0,"Ruido excesivo y no se garantizan 8 horas de quietud"]
    ],
    rec:"Aislar o mantener motores, aireadores y bombas y garantizar al menos 16 horas diarias de quietud y calma."
  },
  {
    id:"RE06", t:"MBR", n:"Calidad del aire inyectado",
    lib:"Dolor, lesión y enfermedad · Molestias físicas y térmicas",
    met:"Inspección visual",
    q:"¿Hay fuentes de contaminantes cerca de la toma de aire de sopladores o aireadores?",
    na:"No aplica si el predio no tiene sistema de inyección de aire o aireadores",
    lv:[
      [100,"No existen fuentes de contaminación del aire en el entorno"],
      [0,"Se identifican fuentes de contaminación que afectan el aire tomado"]
    ],
    rec:"Alejar fuentes de humo y gases (estufas de leña, motores de combustión) de la toma de aire de sopladores y aireadores."
  },
  {
    id:"RE07", t:"MBR", n:"Proceso de captura de los peces",
    lib:"Dolor, lesión y enfermedad · Temor y angustia",
    met:"Documental o visual cuando corresponda",
    q:"¿Existe procedimiento de captura? ¿Es rápido y sin lesiones, sangre ni anzuelos?",
    arel:1,
    lv:[
      [100,"Procedimiento con registros de tiempos cortos; captura rápida, sin lesiones, sin agua sanguinolenta y sin anzuelos"],
      [55,"Sin procedimiento o registros, pero se observa captura rápida y sin lesiones ni anzuelos"],
      [20,"Con procedimiento, pero captura prolongada, con lesiones o agua sanguinolenta"],
      [0,"Sin procedimiento y captura deficiente, o uso de anzuelos"]
    ],
    rec:"Elaborar un procedimiento de captura con tiempos registrados, usar redes sin bordes cortantes, evitar el hacinamiento prolongado y no usar anzuelos."
  },
  {
    id:"RE08", t:"MBR", n:"Protección contra depredadores",
    lib:"Dolor, lesión y enfermedad · Temor y angustia",
    met:"Inspección visual",
    q:"¿El sistema cuenta con protecciones contra depredadores?",
    arel:1,
    lv:[
      [100,"Protecciones en buen estado y funcionales"],
      [0,"Sin protecciones o en mal estado"]
    ],
    rec:"Instalar o reparar malla anti pájaro y cercos que impidan el ingreso de depredadores terrestres."
  },
  {
    id:"RE09", t:"MBR", n:"Compatibilidad de policultivos",
    lib:"Dolor, lesión y enfermedad · Temor y angustia",
    met:"Visual y documental",
    q:"¿Las especies del policultivo son compatibles y no se depredan?",
    na:"No aplica si no existe policultivo",
    lv:[
      [100,"Existe policultivo y las especies son compatibles"],
      [0,"Existe policultivo y las especies son incompatibles"]
    ],
    rec:"Revisar la compatibilidad de las especies del policultivo y separar las que presenten depredación o agresión."
  },
  {
    id:"RE10", t:"MBR", n:"Profundidad adecuada",
    lib:"Molestias físicas y térmicas · Temor y angustia · Comportamiento natural",
    met:"Visual con medición de la profundidad",
    q:"¿El sistema tiene la profundidad apropiada para los animales?",
    arel:1, calc:"profundidad",
    lv:[
      [100,"PMG: profundidad entre 0,6 y 1,5 m; si es jaula, entre 2 y 5 m. AREL: profundidad entre 0,6 y 1,5 m según tabla 40."],
      [55,"Fuera del rango aplicable, pero se aplican medidas correctivas (ej. polisombra)"],
      [0,"Fuera del rango aplicable y sin medidas correctivas"]
    ],
    rec:"Verificar la profundidad conforme a la modalidad: PMG admite 2–5 m para jaulas; AREL utiliza el rango de 0,6–1,5 m establecido en la tabla 40. Aplicar y documentar medidas correctivas cuando corresponda."
  },

  /* ================= MEDIDAS BASADAS EN EL ANIMAL (MBA) ================= */
  {
    id:"AN01", t:"MBA", n:"Tamaño y peso de los peces",
    lib:"Hambre, sed y mala nutrición",
    met:"Visual sujeta a muestreo (mín. 15 peces por lote)",
    q:"¿Hay diferencia significativa de talla o peso entre peces del mismo lote?",
    arel:1, calc:"tamano",
    lv:[
      [100,"Más del 90% de los peces están en el promedio (± 10%)"],
      [55,"Entre 80% y 90% en el promedio"],
      [20,"Entre 70% y 79% en el promedio"],
      [0,"Menos del 70% en el promedio"]
    ],
    rec:"Clasificar por tallas con más frecuencia y separar lotes para que más del 90% de los peces estén dentro del 10% del promedio."
  },
  {
    id:"AN02", t:"MBA", n:"Lesiones, heridas y problemas en piel, branquias y aletas",
    lib:"Dolor, lesión y enfermedad",
    met:"Visual sujeta a muestreo (mín. 10 peces por lote)",
    q:"¿Se evidencian daños en piel, branquias o aletas?",
    arel:1, calc:"lesiones",
    lv:[
      [100,"Menos del 5% de los peces con daños"],
      [55,"Entre 5% y 10% con daños"],
      [20,"Entre 11% y 20% con daños"],
      [0,"Más del 20% con daños"]
    ],
    rec:"Revisar piel, branquias y aletas de forma periódica, corregir las causas de lesiones (manejo, densidad, calidad de agua) y consultar al MV/MVZ."
  },
  {
    id:"AN03", t:"MBA", n:"Muerte de peces por asfixia",
    lib:"Dolor, lesión y enfermedad · Temor y angustia",
    met:"Documental y entrevista con el productor",
    q:"¿A los animales se les produce la muerte por asfixia?",
    arel:1,
    na:"No aplica si no se puede verificar el sacrificio o hay planta de proceso en el predio",
    lv:[
      [100,"No hay evidencia de muerte por asfixia"],
      [0,"Se produce muerte por asfixia"]
    ],
    rec:"Reemplazar el sacrificio por asfixia con aturdimiento por percusión o eléctrico, aplicado por personal capacitado."
  },
  {
    id:"AN04", t:"MBA", n:"Tiempo de manipulación de los peces",
    lib:"Dolor, lesión y enfermedad · Temor y angustia",
    met:"Inspección visual",
    q:"¿La manipulación fuera del agua es rápida y evita golpes y lesiones?",
    arel:1,
    lv:[
      [100,"Manipulación rápida, sin sobreexposición, golpes ni lesiones"],
      [0,"Manipulación demorada o sin prevenir golpes y lesiones"]
    ],
    rec:"Reducir el tiempo fuera del agua, acercar el punto de manipulación y capacitar al personal para evitar golpes."
  },
  {
    id:"AN05", t:"MBA", n:"Separación y clasificación por lotes",
    lib:"Hambre, sed y mala nutrición · Dolor, lesión y enfermedad · Temor y angustia",
    met:"Documental y visual",
    q:"¿Existe separación de lotes homogéneos?",
    lv:[
      [100,"Hay sistema de separación y los lotes se observan homogéneos"],
      [55,"Sin sistema, pero lotes separados y homogéneos"],
      [20,"Hay sistema, pero no se evidencia separación u homogeneidad"],
      [0,"Sin sistema, sin separación y lotes no homogéneos"]
    ],
    rec:"Implementar un sistema de separación de lotes homogéneos por talla o edad y programar las clasificaciones."
  },
  {
    id:"AN06", t:"MBA", n:"Densidad poblacional",
    lib:"Molestias físicas y térmicas · Hambre, sed y mala nutrición · Comportamiento natural",
    met:"Documental y visual",
    q:"¿La densidad es adecuada para la especie, la etapa y el sistema?",
    arel:1,
    lv:[
      [100,"Densidad igual o menor a la referencia y sin actividad vigorosa, boqueo ni letargia"],
      [55,"Densidad igual o menor a la referencia pero con cierto boqueo o actividad vigorosa"],
      [20,"Densidad mayor a la referencia con boqueo y salpicaduras vigorosas"],
      [0,"Densidad mayor a la referencia con salpicaduras violentas o bloqueo, o sin registros de biomasa"]
    ],
    rec:"Reducir la densidad a la referencia del sistema, verificar oxígeno y recambio de agua y llevar registro de biomasa."
  },

  /* ================= MEDIDAS BASADAS EN LA GESTIÓN (MBG) ================= */
  {
    id:"GE01", t:"MBG", n:"Uso de medicamentos",
    lib:"Dolor, lesión y enfermedad",
    met:"Documental y visual del sitio de almacenamiento",
    q:"¿Se cumplen las buenas prácticas de uso de medicamentos veterinarios?",
    lv:[
      [100,"Se cumplen todas las buenas prácticas"],
      [55,"Registro ICA, sin sustancias prohibidas, prescritos por MV/MVZ y con registros, pero falla otra práctica"],
      [0,"Sin registro ICA, con sustancias prohibidas, sin prescripción o sin registro de tratamientos"]
    ],
    rec:"Usar solo medicamentos con registro ICA, prescritos por MV/MVZ, vigentes y bien almacenados; llevar registro de tratamientos."
  },
  {
    id:"GE02", t:"MBG", n:"Porcentaje de mortalidad del establecimiento",
    lib:"Dolor, lesión y enfermedad",
    met:"Documental (12 meses) y visual de los espejos",
    q:"¿Cuál es el porcentaje de mortalidad de los últimos 12 meses?",
    arel:1, calc:"mortalidad",
    lv:[
      [100,"Cachama ≤ 1% · otras especies ≤ 10%"],
      [55,"Cachama 1,1–2% · otras 11–12%"],
      [20,"Cachama 2,1–3% · otras 13–15%"],
      [0,"Cachama > 3% · otras > 15%, sin registros o peces muertos visibles"]
    ],
    rec:"Llevar registro mensual de mortalidad, identificar causas y aplicar medidas de control (densidad, nutrición, diagnóstico)."
  },
  {
    id:"GE03", t:"MBG", n:"Plan sanitario escrito e implementado",
    lib:"Dolor, lesión y enfermedad",
    met:"Inspección documental",
    q:"¿El establecimiento tiene un plan sanitario implementado?",
    lv:[
      [100,"Plan actualizado, implementado y cumplido totalmente"],
      [55,"Actualizado e implementado, cumplido parcialmente"],
      [20,"Plan no actualizado y cumplido parcialmente"],
      [0,"Sin plan, no se cumple o no lo firma un MV/MVZ con matrícula vigente"]
    ],
    rec:"Elaborar con un MV/MVZ con matrícula vigente un plan sanitario escrito, mantenerlo actualizado y cumplirlo en su totalidad."
  },
  {
    id:"GE04", t:"MBG", n:"Uso de anestesia en procesos habituales",
    lib:"Dolor, lesión y enfermedad",
    met:"Inspección documental",
    q:"¿Se usa anestesia en los procesos habituales (clasificación, muestreo, vacunación)?",
    lv:[
      [100,"Se usa y se llevan registros de tratamientos"],
      [55,"Se usa pero no se llevan registros"],
      [0,"No se usa"]
    ],
    rec:"Usar anestesia en clasificación, muestreo y procedimientos, bajo prescripción de MV/MVZ y con registro."
  },
  {
    id:"GE05", t:"MBG", n:"Conocimiento y capacitación en bienestar animal",
    lib:"Temor y angustia",
    met:"Documental y entrevista al personal",
    q:"¿El personal conoce el bienestar animal y tiene certificados?",
    arel:1, calc:"capacitacion",
    lv:[
      [100,"Todas las personas demuestran conocimiento y tienen certificación escrita"],
      [55,"Más del 50% con conocimiento y certificado, o 100% con conocimiento pero sin certificado"],
      [20,"Más del 50% con conocimiento y sin certificado"],
      [0,"Menos del 50% con conocimiento y sin certificación"]
    ],
    rec:"Capacitar a todo el personal en bienestar animal y conservar los certificados de asistencia."
  },
  {
    id:"GE06", t:"MBG", n:"Procedimiento de manejo de los animales",
    lib:"Dolor, lesión y enfermedad · Temor y angustia",
    met:"Documental (y visual si hay actividad en curso)",
    q:"¿Hay procedimientos documentados e implementados para el manejo?",
    lv:[
      [100,"Todos los procedimientos escritos con registros y ejecución correcta observada"],
      [55,"Falta algún procedimiento o registro, pero la ejecución observada es correcta"],
      [20,"Procedimientos y registros completos, pero se observa incumplimiento"],
      [0,"Sin procedimientos ni registros y se observa incumplimiento"]
    ],
    rec:"Documentar los procedimientos de manejo (manipulación, movilización, regreso al agua, animales moribundos) y conservar los registros de su aplicación."
  },
  {
    id:"GE07", t:"MBG", n:"Sacrificio humanitario",
    lib:"Dolor, lesión y enfermedad",
    met:"Inspección documental",
    q:"¿Hay procedimiento y registro de sacrificio con un método aceptado?",
    lv:[
      [100,"Procedimiento o registro y sacrificio con método aceptado (percusión o aturdimiento eléctrico), o no hubo sacrificio en el último año"],
      [0,"Sin procedimiento o registro, o sacrificio sin método aceptado"]
    ],
    rec:"Documentar el procedimiento de sacrificio humanitario (percusión o aturdimiento eléctrico) y llevar registro de cada sacrificio."
  }
];

/* =====================================================================
   FIN DEL ARCHIVO
   ===================================================================== */

/* =====================================================================
   PÁGINA PÚBLICA · escenas de fondo, etapas, escala y especies de referencia
   (datos tomados de la Metodología ICA v2.0 · 2024)
   ===================================================================== */

/* Documento oficial incluido en el proyecto */
const PDF_URL = "docs/Metodologia_ICA_Bienestar_Peces_v2.pdf";

/* ---------- TUS PROPIAS FOTOS DE FONDO ----------
   Copia tus fotos en la carpeta Im/fondos/ y agrégalas aquí. Se mostrarán primero
   y luego rotarán con las escenas de abajo. Ejemplo:
   { src:"Im/fondos/mi-foto.jpg", t:"Título", sub:"Descripción corta", dato:"Dato curioso" }          */
const FONDOS_LOCALES = [
  { src:["Im/Peces.JPG"], scene:"pond", t:"Peces de cultivo", sub:"Fotografía local del proyecto", dato:"Bienestar medible" },
  { src:["Im/peces/cardumen-ica.jpg"], scene:"deep", t:"Cardumen en producción", sub:"Fotografía reproducida del documento del ICA", dato:"Inspección visual" },
  { src:["Im/sistemas/estanque-ica.jpg"], scene:"pond", t:"Sistema piscícola", sub:"Estanque de producción documentado por el ICA", dato:"Condiciones del predio" }
];

/* ---------- Escenas del hero (fondos que cambian) ----------
   scene = escena animada generada con CSS (siempre se ve, aun sin internet)
   src   = foto opcional que se superpone a la escena cuando carga                              */
const FONDOS = [
  { scene:"pond", src:["https://commons.wikimedia.org/wiki/Special:FilePath/Tilapia_farm_california.jpg?width=1600", "Im/Peces.JPG"], t:"Tilapia", sub:"Sistema de cultivo y manejo del agua", dato:"24–32 °C · referencia de tabla ICA" },
  { scene:"cold", src:["https://commons.wikimedia.org/wiki/Special:FilePath/Rainbow_Trout_%28Oncorhynchus_mykiss%29.jpg?width=1600", "Im/peces/cardumen-ica.jpg"], t:"Trucha arcoíris", sub:"Especie de aguas frías", dato:"10–16 °C · referencia AREL" },
  { scene:"jungle", src:["https://commons.wikimedia.org/wiki/Special:FilePath/Colossoma_macropomum_ostergaard.jpg?width=1200", "Im/peces/cardumen-ica.jpg"], t:"Cachama", sub:"Pez nativo de importancia acuícola", dato:"24–29 °C · referencia de tabla ICA" },
  { scene:"deep", src:["Im/sistemas/estanque-ica.jpg", "https://commons.wikimedia.org/wiki/Special:FilePath/Fish_Farming_Pond.jpg?width=1600"], t:"Sistemas productivos", sub:"Instalaciones, agua y condiciones de cultivo", dato:"Inspección visual" },
  { scene:"pond", src:["https://commons.wikimedia.org/wiki/Special:FilePath/Fish_farm_water_aeration_system_in_operation_-_01.JPG?width=1200", "Im/sistemas/estanque-ica.jpg"], t:"Oxigenación del agua", sub:"Monitoreo de equipos y condiciones del estanque", dato:"OD según especie" }
];

/* Fotografías consultadas en Wikimedia Commons. Los créditos completos, autores, licencias
   y enlaces a la ficha original se documentan en docs/CREDITOS_IMAGENES.md. */
const CREDITOS_IMG = [
  "Peces de cultivo — Im/Peces.JPG, archivo aportado en el ZIP original; autor/licencia no identificados.",
  "Cardumen en producción — fotografía extraída para uso académico del PDF ICA v2.0 (2024), página 1; crédito fotográfico en el documento: ICA, 2023.",
  "Estanque piscícola — fotografía extraída para uso académico del PDF ICA v2.0 (2024), página 1; crédito fotográfico en el documento: ICA, 2023.",
  "Tilapia de cultivo — fotografía de Mark Meyer, aportada en Wikimedia Commons por USDA NRCS California, CC BY 2.0; https://commons.wikimedia.org/wiki/File:Tilapia_farm_california.jpg.",
  "Truchas arcoíris — Eric Engbretson / U.S. Fish and Wildlife Service, dominio público según ficha de Wikimedia Commons.",
  "Cachama / Colossoma macropomum — Vincent A. Vos, CC BY 4.0 (Wikimedia Commons).",
  "Estanque piscícola — Alabama Extension, CC0 1.0 (Wikimedia Commons).",
  "Aireación piscícola — Anna Frodesiak, CC0 1.0 (Wikimedia Commons).",
  "Vista general de sistemas acuícolas — Hayden Soloviev, CC BY 4.0 (Wikimedia Commons)."
];

/* ---------- Las 4 etapas de la visita (§6 de la metodología) ---------- */
const ETAPAS = [
  ["I",  "Reunión inicial",         "Planeación con el responsable del predio: información básica, tamaño de muestra y selección de lotes."],
  ["II", "Inspección del predio",   "Recorrido de espacios, recursos y estado general de los animales, respetando la bioseguridad."],
  ["III","Inspección documental",   "Registros, procedimientos y firmas, contrastados con lo observado durante el recorrido."],
  ["IV", "Procesamiento y entrega", "Tabulación de los indicadores y entrega de la calificación final del predio."]
];

/* ---------- Clasificación final (§5.5) ---------- */
const CLASES = [
  { n:"Bajo",      r:"< 50%",     a:0,  b:50,  c:"#ef5b5b", d:"Deficiencias que requieren acciones a corto y mediano plazo." },
  { n:"Medio",     r:"50 – 74%",  a:50, b:75,  c:"#f5b83d", d:"Si no se corrige rápido, las afectaciones pueden deteriorar la condición de los animales." },
  { n:"Alto",      r:"75 – 89%",  a:75, b:90,  c:"#4aa3ff", d:"Buen bienestar, pero susceptible de ser mejorado." },
  { n:"Excelente", r:"≥ 90%",     a:90, b:100, c:"#45e6d2", d:"Bienestar óptimo, con indicadores de bienestar positivo." }
];

/* ---------- Parámetros de referencia por especie (Tabla 35 y Tabla 23) ---------- */
const ESPECIES_REF = [
  { id:"tilapia", n:"Tilapia", tipo:"Aguas cálidas", tmin:24, tmax:32, od:4,   odTxt:"4 mg/L",       ph:6,   phTxt:"6",   turb:"25 cm",           mort:"≤ 10%",
    foto:"https://commons.wikimedia.org/wiki/Special:FilePath/Tilapia_farm_california.jpg?width=1400", scene:"pond", c1:"#c9d3d1", c2:"#7c8f8c", acc:"#e0675a",
    d:"La especie de mayor producción comercial en Colombia; se cultiva en estanques, jaulas, RAS y biofloc." },
  { id:"trucha", n:"Trucha arcoíris", tipo:"Aguas frías", tmin:10, tmax:16, od:8.25, odTxt:"8 – 8,5 mg/L", ph:7,   phTxt:"7",   turb:"Cristalina – 45 cm", mort:"≤ 10%",
    foto:"https://commons.wikimedia.org/wiki/Special:FilePath/Rainbow_Trout_%28Oncorhynchus_mykiss%29.jpg?width=1400", scene:"cold", c1:"#9fc3d8", c2:"#3d6a86", acc:"#ff8fa8",
    d:"Exige agua fría y muy oxigenada; se produce sobre todo en Boyacá, Cundinamarca y Nariño." },
  { id:"cachama", n:"Cachama", tipo:"Nativa", tmin:24, tmax:29, od:4,   odTxt:"4 mg/L",       ph:6.5, phTxt:"6,5", turb:"30 cm",           mort:"≤ 1%",
    foto:"https://commons.wikimedia.org/wiki/Special:FilePath/Colossoma_macropomum_ostergaard.jpg?width=1200", scene:"jungle", c1:"#b9a27a", c2:"#4a3b26", acc:"#e2583e",
    d:"Especie nativa de la Orinoquía y la Amazonía, clave para la economía regional. Es la más exigente en mortalidad." }
];

/* ---------- Las 5 libertades: descripción corta y palabra clave para cruzar con los indicadores ---------- */
const LIB_INFO = [
  { k:"Hambre",        d:"Alimento de calidad, bien distribuido y ajustado a la biomasa, con agua apta para la especie." },
  { k:"Molestias",     d:"Temperatura, ruido, vibraciones y profundidad dentro de rangos que no generen estrés." },
  { k:"Dolor",         d:"Piel, branquias y aletas sanas; captura, manejo y medicación responsables." },
  { k:"Temor",         d:"Procedimientos que reducen el miedo y personal capacitado en bienestar animal." },
  { k:"Comportamiento",d:"Espacio, profundidad y densidades que permiten al pez nadar y expresar su conducta natural." }
];
