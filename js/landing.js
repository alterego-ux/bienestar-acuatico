/* =====================================================================
   BIENESTAR ACUÁTICO · Página pública (landing, menú, footer, páginas públicas)
   Los efectos (cursor, transiciones, fondos que cambian) viven en fx.js
   ===================================================================== */

const L_LINKS = [
  ["metodologia", "Metodología"],
  ["especies",    "Especies"],
  ["sistemas",    "Sistemas"],
  ["libertades",  "Libertades"],
  ["plataforma",  "Plataforma"],
  ["institucional","ICA"],
  ["contacto",    "Contacto"]
];

/* ---------- Guía visual de la metodología (modal) ---------- */
function abrirGuiaMetodologia(){
  if(typeof modal!=="function") return;
  const etapas=(typeof ETAPAS!=="undefined"?ETAPAS:[]);
  modal(`
    <div class="guia">
      <div class="guia-hero" style="background-image:url('Im/sistemas/estanque-ica.jpg')">
        <span class="guia-tag">Metodología ICA v2.0 · 2024</span>
      </div>
      <h3>Cómo se evalúa el bienestar</h3>
      <p class="muted small">La metodología observa el bienestar de los peces desde tres ángulos y lo recorre durante cuatro etapas de visita al predio. El prototipo organiza esa observación en 23 indicadores para PMG o 15 para AREL y los califica con 100, 55, 20 o 0 puntos.</p>
      <div class="guia-grid">
        <div><b>Recursos</b><p>Lo que el entorno ofrece: alimento, calidad del agua, ruido, depredadores y profundidad.</p></div>
        <div><b>Animal</b><p>Cómo se encuentran los peces: tamaño, lesiones, manipulación y densidad poblacional.</p></div>
        <div><b>Gestión</b><p>Lo que hace el productor: medicamentos, plan sanitario, capacitación y sacrificio humanitario.</p></div>
      </div>
      <p class="l-eye" style="margin:18px 0 4px"><b>La visita</b> — cuatro etapas</p>
      <ol>${etapas.map(e=>`<li><b>${esc(e[1])}.</b> ${esc(e[2])}</li>`).join("")}</ol>
      <p class="l-note" style="margin-top:16px">Las fotografías son ilustrativas y provienen del documento de la metodología (crédito ICA, 2023). Este prototipo es académico e independiente: no es una herramienta oficial ni una certificación del ICA.</p>
      <div class="sp"></div>
      <div class="row" style="justify-content:flex-end">
        <a class="l-btn line sm" href="${PDF_URL}" target="_blank" rel="noopener">Abrir PDF ↗</a>
        <button class="btn p" type="button" onclick="closeModal()">Entendido</button>
      </div>
    </div>`);
}

/* ---------- Separadores de olas (SVG decorativo) ---------- */
function waveSep(flip){
  const id="wg"+(waveSep._n=(waveSep._n||0)+1);
  return `<div class="wave-sep${flip?" wave-flip":""}" aria-hidden="true">
    <svg viewBox="0 0 1440 100" preserveAspectRatio="none" role="presentation">
      <defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#22e0d6"/><stop offset=".5" stop-color="#7dff9c"/><stop offset="1" stop-color="#ff3df0"/></linearGradient></defs>
      <path class="w-fill" d="M0 52 C 220 8 420 96 720 52 S 1220 8 1440 52 V 100 H 0 Z"/>
      <path class="w-fill2" d="M0 66 C 260 30 460 104 740 66 S 1240 30 1440 66 V 100 H 0 Z"/>
      <path class="w-line" style="stroke:url(#${id})" d="M0 52 C 220 8 420 96 720 52 S 1220 8 1440 52"/>
    </svg></div>`;
}

/* ---------- Navegación ---------- */
function pubNav(){
  return `
  <header class="l-nav" id="lnav">
    <a class="l-brand" href="#/" data-scroll="top" aria-label="Ir al inicio">
      <img src="Im/Logo.jpg" alt="Logo ICA"><span>Bienestar <b>Acuático</b></span>
    </a>
    <nav class="l-links" aria-label="Secciones">
      ${L_LINKS.map(l=>`<a href="#/" data-scroll="${l[0]}"><span>${l[1]}</span></a>`).join("")}
    </nav>
    <div class="l-cta">
      <a class="l-btn ghost sm" href="#/ingresar">Ingresar</a>
      <a class="l-btn solid sm mag" href="#/registro">Registrarse</a>
    </div>
    <button class="l-burger" type="button" data-menu aria-label="Abrir menú" aria-expanded="false"><i></i><i></i></button>
  </header>
  <div class="l-menu" id="lmenu" aria-hidden="true">
    <nav>
      ${L_LINKS.map((l,i)=>`<a href="#/" data-scroll="${l[0]}"><em>0${i+1}</em><span>${l[1]}</span></a>`).join("")}
    </nav>
    <div class="l-menu-foot">
      <a class="l-btn solid" href="#/ingresar">Ingresar</a>
      <a class="l-btn line" href="#/registro">Crear cuenta</a>
      <a class="l-btn line" href="${PDF_URL}" target="_blank" rel="noopener">Metodología (PDF)</a>
    </div>
  </div>`;
}

/* ---------- Footer ---------- */
function pubFoot(){
  return `
  <footer class="l-foot">
    <div class="l-foot-word" aria-hidden="true">Bienestar<br>Acuático</div>
    <div class="l-foot-grid">
      <div>
        <div class="l-brand"><img src="Im/Logo.jpg" alt="Logo ICA"><span>Bienestar <b>Acuático</b></span></div>
        <p>Prototipo académico independiente para apoyar la evaluación del bienestar animal con base en la metodología ICA v2.0 (2024); no es una herramienta oficial del ICA.</p>
      </div>
      <div>
        <h4>Plataforma</h4>
        <a href="#/ingresar">Ingresar</a>
        <a href="#/registro">Registrarse</a>
        <a href="#/ayuda">Ayuda</a>
        <a href="#/conocenos">Conócenos</a>
      </div>
      <div>
        <h4>Explorar</h4>
        ${L_LINKS.slice(0,4).map(l=>`<a href="#/" data-scroll="${l[0]}">${l[1]}</a>`).join("")}
      </div>
      <div>
        <h4>Documentos</h4>
        <a href="${PDF_URL}" target="_blank" rel="noopener">Metodología ICA v2.0 (PDF) ↗</a>
        <a href="https://www.ica.gov.co" target="_blank" rel="noopener">ica.gov.co ↗</a>
        <a href="mailto:contactenos@ica.gov.co">contactenos@ica.gov.co</a>
      </div>
    </div>
    <div class="l-foot-bot">
      <p>Prototipo con almacenamiento local: los datos permanecen en el navegador. Contenido técnico de referencia: ICA y entidades colaboradoras. Prototipo académico independiente, no afiliado ni certificado por el ICA.</p>
      <p class="cred">Fotografías: créditos y licencias en docs/CREDITOS_IMAGENES.md.</p>
      <button class="l-btn line sm" type="button" data-scroll="top">Volver arriba ↑</button>
    </div>
  </footer>`;
}

/* ---------- Páginas públicas internas (Ayuda, Conócenos sin sesión) ---------- */
function pubPage(inner, kicker){
  return pubNav()+`
  <main class="pub-page">
    <div class="pub-hero"><div class="stage mini" data-stage="banner"></div>
      <div class="pub-hero-in"><p class="l-eye"><b>ICA</b> — ${kicker||"Información"}</p></div>
    </div>
    <div class="pub-body">${inner}</div>
  </main>`+pubFoot();
}

/* =====================================================================
   LANDING
   ===================================================================== */
function landingView(){
  const mq = ["23 indicadores","5 libertades","3 tipos de medida","4 categorías","15 indicadores AREL","Peces de cultivo","Metodología ICA v2.0"];
  const grp = mq.map(t=>`<span>${t}</span><i>✦</i>`).join("");
  return pubNav()+`
  <main id="top">
    ${heroHTML()}
    <div class="l-marq" aria-hidden="true"><div class="track">${grp}${grp}${grp}${grp}</div></div>
    ${statsHTML()}
    ${waveSep()}
    ${metodologiaHTML()}
    <div class="l-marq rev" aria-hidden="true"><div class="track">${grp}${grp}${grp}${grp}</div></div>
    ${especiesHTML()}
    ${sistemasHTML()}
    ${libertadesHTML()}
    ${plataformaHTML()}
    ${waveSep(true)}
    ${institucionalHTML()}
    ${contactoHTML()}
    ${ctaHTML()}
  </main>`+pubFoot();
}

/* ---------- Hero ---------- */
function heroHTML(){
  return `
  <section class="l-hero" id="inicio" data-hero>
    <div class="stage" data-stage="hero"></div>
    <div class="vig"></div><div class="grain"></div>
    <div class="h-inner">
      <p class="h-kicker"><span class="dot"></span> Metodología ICA · v2.0 · 2024</p>
      <h1 class="h-title" data-par-m>
        <span class="ln"><span>Bienestar</span></span>
        <span class="ln out"><span>Acuático</span></span>
      </h1>
      <p class="h-lead">Evalúa el bienestar animal en peces de cultivo para consumo humano: registra predios y aplica 23 indicadores para PMG o 15 para AREL, con resultados, informes y seguimiento.</p>
      <div class="h-cta">
        <a class="l-btn solid big mag" href="#/ingresar">Acceder a la plataforma <i>→</i></a>
        <a class="l-btn line big mag" href="${PDF_URL}" target="_blank" rel="noopener">Ver la metodología <i>↗</i></a>
      </div>
    </div>
    <div class="h-side" aria-hidden="true"><span>ICA · Instituto Colombiano Agropecuario</span></div>
    <div class="h-foot">
      <div class="h-cap" aria-live="off">
        <span class="k" data-cap-k>01</span>
        <div><b data-cap-t>Cardumen</b><small data-cap-s>Espacio, oxígeno y densidad adecuada</small></div>
        <span class="dato" data-cap-d>OD ≥ 4 mg/L</span>
      </div>
      <div class="h-dots" data-dots></div>
      <button class="h-cue" type="button" data-scroll="metodologia" aria-label="Bajar a la siguiente sección">Scroll <i>↓</i></button>
    </div>
  </section>`;
}

/* ---------- Cifras ---------- */
function statsHTML(){
  const st=[
    [23,"","Indicadores para pequeños, medianos y grandes acuicultores"],
    [15,"","Indicadores para acuicultura de subsistencia y AREL"],
    [5,"","Libertades del bienestar animal evaluadas"],
    [4,"","Categorías de clasificación: bajo, medio, alto y excelente"]
  ];
  return `
  <section class="l-stats"><div class="l-wrap">
    ${st.map((s,i)=>`<div class="stat" data-r data-d="${i}">
      <b data-count="${s[0]}" data-suf="${s[1]}">0</b><p>${s[2]}</p></div>`).join("")}
  </div></section>`;
}

/* ---------- Metodología ---------- */
function pesoHTML(k){
  const P=PESOS_BASE[k], list=k==="AREL"?IND.filter(i=>i.arel):IND;
  const col={MBR:"#45e6d2",MBA:"#ff7a1a",MBG:"#f1f5ee"};
  return ["MBA","MBR","MBG"].map(t=>{
    const n=list.filter(i=>i.t===t).length;
    return `<div class="w-row">
      <div class="w-l"><b>${MEDIDAS[t].n}</b><small>${MEDIDAS[t].full} · ${n} indicadores</small></div>
      <div class="w-p"><strong>${P[t]}<i>%</i></strong></div>
      <div class="w-bar"><u style="--w:${P[t]}%;--c:${col[t]}"></u></div>
    </div>`;
  }).join("")+`<p class="w-note">${list.length} indicadores en total · cada uno se califica con 100, 55, 20 o 0 puntos y se promedia por tipo de medida.</p>`;
}
function pickPeso(k){
  document.querySelectorAll("[data-w]").forEach(b=>b.classList.toggle("on",b.dataset.w===k));
  const box=document.getElementById("wbody"); if(!box)return;
  box.innerHTML=pesoHTML(k);
  box.querySelectorAll(".w-bar u").forEach(u=>{
    u.style.transition="none";u.style.width="0";
    requestAnimationFrame(()=>requestAnimationFrame(()=>{u.style.transition="";u.style.width=""}));
  });
}
function pickClase(i){
  const c=CLASES[i];
  document.querySelectorAll(".sc-seg").forEach(b=>b.classList.toggle("on",+b.dataset.i===i));
  const d=document.getElementById("scdesc");
  if(d)d.innerHTML=`<b style="color:${c.c}">${c.n} · ${c.r}</b> ${c.d}`;
}
function metodologiaHTML(){
  return `
  <section class="l-sec" id="metodologia"><div class="l-wrap">
    <div class="l-head" data-r>
      <p class="l-eye"><b>01</b> — Metodología</p>
      <h2 class="l-title"><span class="ln"><span>Evaluar</span></span><span class="ln out"><span>para mejorar</span></span></h2>
    </div>

    <div class="m-grid">
      <div class="m-text" data-r>
        <p class="lead">La metodología del ICA mide el bienestar de los peces desde tres ángulos: lo que el entorno les ofrece, cómo se encuentran los animales y qué hace el productor para cuidarlos.</p>
        <ul class="m-bul">
          <li><b>Recursos.</b> Alimento, calidad del agua, ruido, depredadores y profundidad.</li>
          <li><b>Animal.</b> Tamaño, lesiones, manipulación y densidad poblacional.</li>
          <li><b>Gestión.</b> Medicamentos, plan sanitario, capacitación y sacrificio humanitario.</li>
        </ul>
        <div class="m-btns">
          <a class="l-btn solid mag" href="${PDF_URL}" target="_blank" rel="noopener">Abrir la metodología (PDF) ↗</a>
          <button class="l-btn line mag" type="button" onclick="abrirGuiaMetodologia()">¿Cómo se evalúa? · guía visual</button>
          <a class="l-btn line mag" href="#/registro">Crear cuenta</a>
        </div>
      </div>

      <div class="w-card spot neon-brd" data-r data-d="1">
        <div class="w-tabs" role="tablist">
          <button type="button" class="on" data-w="PMG" onclick="pickPeso('PMG')">Pequeños, medianos y grandes</button>
          <button type="button" data-w="AREL" onclick="pickPeso('AREL')">Subsistencia y AREL</button>
        </div>
        <h3 class="w-h">Peso de cada tipo de medida en el puntaje final</h3>
        <div id="wbody">${pesoHTML("PMG")}</div>
      </div>
    </div>

    <div class="scale" data-r>
      <div class="sc-head"><h3>Clasificación final del predio</h3><p>Toca una categoría</p></div>
      <div class="sc-bar">
        ${CLASES.map((c,i)=>`<button type="button" class="sc-seg ${i===3?"on":""}" data-i="${i}" style="--c:${c.c};flex-grow:${c.b-c.a}" onclick="pickClase(${i})"><b>${c.n}</b><small>${c.r}</small></button>`).join("")}
      </div>
      <p class="sc-desc" id="scdesc"><b style="color:${CLASES[3].c}">${CLASES[3].n} · ${CLASES[3].r}</b> ${CLASES[3].d}</p>
    </div>

    <div class="etapas">
      <p class="l-eye" data-r><b>La visita</b> — cuatro etapas</p>
      <div class="et-grid">
        ${ETAPAS.map((e,i)=>`<article class="et spot" data-r data-d="${i}"><em>${e[0]}</em><h3>${e[1]}</h3><p>${e[2]}</p></article>`).join("")}
      </div>
    </div>
  </div></section>`;
}

/* ---------- Especies ---------- */
function fishSVG(e){
  const id="fg"+e.id;
  let extra="";
  if(e.id==="trucha"){
    extra=`<path d="M56 98C130 88 240 86 324 90" stroke="url(#${id}s)" stroke-width="14" stroke-linecap="round" fill="none" opacity=".85"/>`
      +[[150,60],[176,52],[204,56],[232,60],[260,66],[160,76],[196,72],[228,76],[262,82],[120,68],[286,74]]
        .map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#1b2a33" opacity=".55"/>`).join("");
  }else if(e.id==="tilapia"){
    extra=[[120,70],[165,64],[210,66],[255,72]].map((p,i)=>`<path d="M${p[0]} ${p[1]}C${p[0]+6} ${p[1]+22} ${p[0]+6} ${p[1]+40} ${p[0]} ${p[1]+56}" stroke="#000" stroke-opacity=".12" stroke-width="5" fill="none"/>`).join("");
  }else{
    extra=`<path d="M70 118C150 140 250 138 318 112" stroke="${e.acc}" stroke-width="16" stroke-linecap="round" fill="none" opacity=".75"/>`;
  }
  return `<svg viewBox="0 0 400 180" class="fish-ill" role="img" aria-label="Ilustración de ${e.n}">
    <defs>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${e.c2}"/><stop offset=".55" stop-color="${e.c1}"/><stop offset="1" stop-color="#f4f2ea"/></linearGradient>
      <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="${e.acc}"/><stop offset="1" stop-color="${e.acc}" stop-opacity=".25"/></linearGradient>
    </defs>
    <path class="tail" d="M330 90C352 62 384 40 396 28C386 68 386 112 396 152C384 140 352 118 330 90Z" fill="${e.c2}"/>
    <path d="M130 52C158 14 218 10 256 50C218 42 168 42 130 52Z" fill="${e.c2}"/>
    <path d="M188 136C204 162 236 170 264 160C250 150 238 142 232 130Z" fill="${e.acc}" opacity=".9"/>
    <path d="M20 90C55 36 190 14 300 56C326 67 333 80 333 90C333 100 326 113 300 124C190 166 55 144 20 90Z" fill="url(#${id}b)"/>
    ${extra}
    <path d="M106 62C92 86 92 98 106 122" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>
    <circle cx="70" cy="80" r="8" fill="#fff"/><circle cx="72" cy="80" r="4" fill="#0a0a0a"/>
  </svg>`;
}
function speciesHTML(e){
  const photo=e.foto?`<img class="sp-photo" src="${e.foto}" alt="Fotografía de referencia de ${esc(e.n)}" loading="lazy" decoding="async" onerror="this.closest('.sp-vis').classList.add('photo-missing');this.remove()">`:"";
  const g=(label,val,l,w,scale)=>`<div class="gauge"><div class="g-h"><b>${label}</b><span>${val}</span></div>
      <div class="g-t"><u style="--l:${l}%;--w:${w}%"></u></div><div class="g-s">${scale.map(s=>`<i>${s}</i>`).join("")}</div></div>`;
  return `
    <div class="sp-vis">
      <div class="sc-host" data-scene="${e.scene}"></div>${photo}
      <div class="sp-fish">${fishSVG(e)}</div>
      <div class="sp-name"><span>${esc(e.n)}</span></div>
      <span class="sp-type">${e.tipo}</span>
    </div>
    <div class="sp-info">
      <p class="sp-d">${e.d}</p>
      ${g("Temperatura del agua",`${e.tmin} – ${e.tmax} °C`,e.tmin/40*100,(e.tmax-e.tmin)/40*100,["0","20","40 °C"])}
      ${g("Oxígeno disuelto",e.odTxt,0,Math.min(100,e.od/12*100),["0","6","12 mg/L"])}
      ${g("pH mínimo",e.phTxt,0,e.ph/14*100,["0","7","14"])}
      <div class="kvs"><div><small>Turbidez</small><b>${e.turb}</b></div><div><small>Mortalidad máx. (100 pts)</small><b>${e.mort}</b></div></div>
    </div>`;
}
function pickSpecies(id){
  const e=ESPECIES_REF.find(x=>x.id===id); if(!e)return;
  document.querySelectorAll("[data-sp]").forEach(b=>b.classList.toggle("on",b.dataset.sp===id));
  const p=document.getElementById("sppanel"); if(!p)return;
  p.classList.remove("swap");void p.offsetWidth;
  p.innerHTML=speciesHTML(e);p.classList.add("swap");
  if(window.FX)FX.hydrate(p);
}
function especiesHTML(){
  return `
  <section class="l-sec alt" id="especies"><div class="l-wrap">
    <div class="l-head" data-r>
      <p class="l-eye"><b>02</b> — Especies</p>
      <h2 class="l-title"><span class="ln"><span>Cada especie,</span></span><span class="ln out"><span>su agua</span></span></h2>
    </div>
    <div class="sp-tabs" data-r>
      ${ESPECIES_REF.map((e,i)=>`<button type="button" class="${i?"":"on"}" data-sp="${e.id}" onclick="pickSpecies('${e.id}')">${e.n}</button>`).join("")}
    </div>
    <div class="sp-panel swap" id="sppanel" data-r>${speciesHTML(ESPECIES_REF[0])}</div>
    <p class="l-note">Valores de referencia para AREL en las tablas 35 y 48 del documento ICA v2.0. Para evaluar un predio, confirma siempre la tabla que corresponda a su modalidad y sistema productivo.</p>
  </div></section>`;
}

/* ---------- Galería fotográfica de sistemas e indicadores ---------- */
function sistemasHTML(){
  const cards=[
    {t:"Estanques piscícolas",k:"Sistema de producción",src:"Im/sistemas/estanque-ica.jpg",alt:"Estanques de producción acuícola fotografiados en la metodología aportada por el ICA",d:"Observa el espejo de agua, la limpieza y las condiciones generales del predio."},
    {t:"Peces de cultivo",k:"Inspección visual",src:"Im/Peces.JPG",alt:"Varios peces de cultivo dispuestos juntos en la fotografía incluida en el proyecto",d:"La especie, las condiciones y las observaciones deben verificarse en el predio real."},
    {t:"Cardumen en producción",k:"Bienestar animal",src:"Im/peces/cardumen-ica.jpg",alt:"Cardumen de peces observado desde arriba en una fotografía del documento del ICA",d:"La densidad, el comportamiento y el estado general requieren revisión según el indicador."},
    {t:"Tilapia",k:"Especie de cultivo",src:"https://commons.wikimedia.org/wiki/Special:FilePath/Tilapia_farm_california.jpg?width=1400",fallback:"Im/Peces.JPG",alt:"Tilapias creciendo en una granja piscícola de California; imagen ilustrativa de la especie",d:"Comprueba los parámetros de la especie y la tabla que corresponda a la modalidad del predio."},
    {t:"Trucha arcoíris",k:"Aguas frías",src:"https://commons.wikimedia.org/wiki/Special:FilePath/Rainbow_Trout_%28Oncorhynchus_mykiss%29.jpg?width=1400",alt:"Trucha arcoíris nadando bajo el agua en un río",d:"Sus referencias de temperatura y oxígeno son diferentes a las de especies de aguas cálidas."},
    {t:"Cachama",k:"Especie nativa",src:"https://commons.wikimedia.org/wiki/Special:FilePath/Colossoma_macropomum_ostergaard.jpg?width=1000",alt:"Ejemplar de Colossoma macropomum, especie conocida como cachama o tambaqui",d:"No extrapoles valores de una especie a otra; utiliza la tabla aplicable y los datos verificados."},
    {t:"Estanque de engorde",k:"Infraestructura",src:"https://commons.wikimedia.org/wiki/Special:FilePath/Fish_Farming_Pond.jpg?width=1400",fallback:"Im/sistemas/estanque-ica.jpg",alt:"Instalación de estanques para producción acuícola",d:"Revisa el tipo de sistema, el manejo del agua y la evidencia visual/documental disponible."},
    {t:"Oxigenación del agua",k:"Equipos y recursos",src:"https://commons.wikimedia.org/wiki/Special:FilePath/Fish_farm_water_aeration_system_in_operation_-_01.JPG?width=1200",alt:"Sistema de aireación operando en una granja piscícola",d:"La operación de equipos y las condiciones del entorno deben verificarse en la inspección."},
    {t:"Sistemas acuícolas",k:"Vista panorámica",src:"https://commons.wikimedia.org/wiki/Special:FilePath/Multi_Aquaculture_Systems_Fish_Farm_View_from_Napeague_State_Park.jpg?width=1400",fallback:"Im/sistemas/estanque-ica.jpg",alt:"Vista panorámica de instalaciones de sistemas acuícolas",d:"La imagen es ilustrativa y no representa ni certifica las condiciones de un predio colombiano."}
  ];
  return `
  <section class="l-sec photo-sec photo-sec--foto" id="sistemas"><div class="l-wrap">
    <div class="l-head" data-r>
      <p class="l-eye"><b>03</b> — Acuicultura en imágenes</p>
      <h2 class="l-title"><span class="ln"><span>Del estanque</span></span><span class="ln out"><span>a los indicadores</span></span></h2>
      <p class="photo-intro">Una mirada visual a las especies, instalaciones y condiciones que se observan durante la evaluación. Las fotografías son ilustrativas: no sustituyen la inspección real del predio.</p>
    </div>
    <div class="photo-grid">
      ${cards.map((c,i)=>`<article class="photo-card spot" data-r data-d="${i%3}">
        <div class="photo-frame"><img src="${c.src}" ${c.fallback?`data-fallback="${c.fallback}"` : ""} alt="${c.alt}" loading="lazy" decoding="async" onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback=''}else{this.closest('.photo-frame').classList.add('photo-missing');this.remove()}"><span class="photo-index">${String(i+1).padStart(2,"0")}</span><span class="photo-open" aria-hidden="true">↗</span></div>
        <div class="photo-copy"><p class="photo-k">${c.k}</p><h3>${c.t}</h3><p>${c.d}</p></div>
      </article>`).join("")}
    </div>
    <p class="l-note">Las fotografías locales incluidas en el proyecto funcionan sin conexión. Algunas imágenes adicionales se consultan en Wikimedia Commons y requieren Internet; cuando existe una alternativa local equivalente se utiliza como respaldo. Consulta autoría, licencia y fuente en <code>docs/CREDITOS_IMAGENES.md</code>.</p>
  </div></section>`;
}

/* ---------- Libertades ---------- */
function libHTML(i){
  const info=LIB_INFO[i];
  const list=IND.filter(x=>x.lib.includes(info.k));
  return `
    <div class="lb-top"><b>${list.length}</b><span>indicadores se relacionan con esta libertad</span></div>
    <p class="lb-d">${info.d}</p>
    <ul class="lb-ind">${list.map(x=>`<li><span class="tp t-${x.t}">${x.t}</span>${esc(x.n)}${x.arel?`<small>AREL</small>`:""}</li>`).join("")}</ul>`;
}
function pickLib(i){
  document.querySelectorAll("[data-lb]").forEach(b=>b.classList.toggle("on",+b.dataset.lb===i));
  const p=document.getElementById("lbpanel"); if(!p)return;
  p.classList.remove("swap");void p.offsetWidth;
  p.innerHTML=libHTML(i);p.classList.add("swap");
}
function libertadesHTML(){
  return `
  <section class="l-sec" id="libertades"><div class="l-wrap">
    <div class="l-head" data-r>
      <p class="l-eye"><b>04</b> — Libertades</p>
      <h2 class="l-title"><span class="ln"><span>Cinco libertades,</span></span><span class="ln out"><span>un solo criterio</span></span></h2>
    </div>
    <div class="lb-grid">
      <ul class="lb-list" data-r>
        ${LIBERTADES.map((l,i)=>`<li><button type="button" class="${i?"":"on"}" data-lb="${i}" onclick="pickLib(${i})" onmouseenter="pickLib(${i})"><em>0${i+1}</em><span>${l}</span><i>→</i></button></li>`).join("")}
      </ul>
      <div class="lb-panel spot swap" id="lbpanel" data-r data-d="1">${libHTML(0)}</div>
    </div>
  </div></section>`;
}

/* ---------- Plataforma ---------- */
function plataformaHTML(){
  const f=[
    ["Gestión de predios","Responsable, ubicación, sistema productivo e inventario de peces."],
    ["Evaluación guiada","Asistente por pasos, indicadores con observaciones y evidencias."],
    ["Cálculo automático","Puntaje por tipo de medida, por libertad y clasificación global."],
    ["Recomendaciones","Plan de mejora generado a partir de los hallazgos."],
    ["Historial y comparación","Filtros, exportación CSV y comparación entre evaluaciones."],
    ["Informe y constancia simulada","Documentos de demostración para imprimir o guardar como PDF."]
  ];
  return `
  <section class="l-sec alt" id="plataforma"><div class="l-wrap">
    <div class="l-head" data-r>
      <p class="l-eye"><b>05</b> — Plataforma</p>
      <h2 class="l-title"><span class="ln"><span>Todo el flujo</span></span><span class="ln out"><span>en un solo lugar</span></span></h2>
    </div>
    <div class="pl-grid">
      <div class="feat">
        ${f.map((x,i)=>`<article class="spot" data-r data-d="${i%2}"><em>0${i+1}</em><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join("")}
      </div>
      <aside class="pv spot neon-brd" data-r data-d="1" aria-label="Vista previa del resultado">
        <div class="pv-top"><span>Resultado</span><span class="live"><i></i>Excelente</span></div>
        <div class="pv-ring">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="rb"/><circle cx="60" cy="60" r="52" class="rf" pathLength="100"/></svg>
          <b>91<i>%</i></b>
        </div>
        ${[["Animal",94,"#ff7a1a"],["Recursos",90,"#45e6d2"],["Gestión",88,"#f1f5ee"]].map(r=>`<div class="pv-row"><span>${r[0]}</span><div class="w-bar"><u style="--w:${r[1]}%;--c:${r[2]}"></u></div><b>${r[1]}</b></div>`).join("")}
        <a class="l-btn solid mag" href="#/ingresar" style="margin-top:20px;width:100%;justify-content:center">Explorar el prototipo →</a>
      </aside>
    </div>
  </div></section>`;
}

/* ---------- Institucional ---------- */
function institucionalHTML(){
  return `
  <section class="l-sec" id="institucional"><div class="l-wrap">
    <div class="l-head" data-r>
      <p class="l-eye"><b>06</b> — Institucional</p>
      <h2 class="l-title"><span class="ln"><span>Instituto Colombiano</span></span><span class="ln out"><span>Agropecuario</span></span></h2>
    </div>
    <div class="in-grid">
      <figure class="in-img" data-r><img src="Im/ICA.jpg" alt="Sede del ICA en Bogotá" loading="lazy" data-par="0.06"></figure>
      <div class="in-body" data-r data-d="1">
        <p>La Oficina de Atención al Ciudadano del ICA promueve la articulación entre las áreas, fortaleciendo la relación Estado–ciudadanía y garantizando transparencia y calidad en los servicios.</p>
        <p>La metodología fue elaborada por el ICA en coordinación con FEDEACUA, la Universidad Antonio Nariño, la Universidad Nacional de Colombia y AGROSAVIA.</p>
        <div class="kv2">
          <div><small>Dirección</small><b>Av. Cra. 20 N° 83-20, NeoPoint 83, Bogotá D.C.</b></div>
          <div><small>Horario</small><b>Lunes a viernes · 7:30 a.m. – 4:30 p.m.</b></div>
          <div><small>Conmutador</small><b><a href="tel:+576017953930">(+57) 601-7953930</a></b></div>
          <div><small>Línea gratuita</small><b><a href="tel:018000412718">01-8000-412718</a></b></div>
        </div>
      </div>
    </div>
  </div></section>`;
}

/* ---------- Contacto ---------- */
function sendContact(ev){
  if(ev)ev.preventDefault();
  const n=(document.getElementById("cn")||{}).value||"",e=(document.getElementById("ce")||{}).value||"",m=(document.getElementById("cm")||{}).value||"";
  const err=document.getElementById("cerr");
  if(n.trim().length<2){err.textContent="Escribe tu nombre.";return}
  if(!/^\S+@\S+\.\S+$/.test(e.trim())){err.textContent="Escribe un correo válido.";return}
  if(m.trim().length<5){err.textContent="Cuéntanos tu mensaje.";return}
  err.textContent="";
  const body=encodeURIComponent(`${m.trim()}\n\n— ${n.trim()} (${e.trim()})`);
  window.location.href=`mailto:contactenos@ica.gov.co?subject=${encodeURIComponent("Consulta desde Bienestar Acuático")}&body=${body}`;
  if(typeof toast==="function")toast("Abriendo tu correo para enviar el mensaje…");
}
function contactoHTML(){
  return `
  <section class="l-sec alt" id="contacto"><div class="l-wrap">
    <div class="l-head" data-r>
      <p class="l-eye"><b>06</b> — Contacto</p>
      <h2 class="l-title"><span class="ln"><span>Hablemos</span></span><span class="ln out"><span>de bienestar</span></span></h2>
    </div>
    <div class="ct-grid">
      <div class="ct-left" data-r>
        <div class="ct-card spot"><small>Sede principal</small><b>Avenida Carrera 20 N° 83-20, edificio NeoPoint 83, Bogotá, D.C.</b></div>
        <div class="ct-card spot"><small>Canales</small><b>(+57) 601-7953930 · 01-8000-412718<br>contactenos@ica.gov.co</b></div>
        <figure class="ct-map"><img src="Im/Captura1.png" alt="Mapa de ubicación del ICA en Bogotá" loading="lazy">
          <a class="l-btn solid sm" href="https://www.google.com/maps/search/?api=1&query=ICA+Instituto+Colombiano+Agropecuario+Bogot%C3%A1" target="_blank" rel="noopener">Abrir en Maps ↗</a></figure>
      </div>
      <form class="ct-form spot" data-r data-d="1" onsubmit="sendContact(event)" novalidate>
        <h3>Escríbenos</h3>
        <div class="field"><label for="cn">Nombre</label><input class="input" id="cn" autocomplete="name" placeholder="Tu nombre"></div>
        <div class="field"><label for="ce">Correo</label><input class="input" id="ce" type="email" autocomplete="email" placeholder="correo@ejemplo.com"></div>
        <div class="field"><label for="cm">Mensaje</label><textarea class="input" id="cm" rows="5" placeholder="¿En qué podemos ayudarte?"></textarea></div>
        <div id="cerr" class="err"></div>
        <button class="l-btn solid mag" type="submit">Enviar mensaje →</button>
        <p class="tiny muted">Se abrirá tu aplicación de correo con el mensaje listo para enviar a contactenos@ica.gov.co.</p>
      </form>
    </div>
  </div></section>`;
}

/* ---------- Llamado final ---------- */
function ctaHTML(){
  return `
  <section class="l-cta-big">
    <div class="stage mini" data-stage="banner"></div>
    <div class="cb-in">
      <h2 data-r><span class="ln"><span>Tu predio,</span></span><span class="ln out"><span>bien evaluado</span></span></h2>
      <div class="cb-btns" data-r data-d="1">
        <a class="l-btn solid big mag" href="#/registro">Crear cuenta gratis →</a>
        <a class="l-btn line big mag" href="#/ingresar">Ya tengo cuenta</a>
      </div>
    </div>
  </section>`;
}
