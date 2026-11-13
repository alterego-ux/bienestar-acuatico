/* ============ Aplicación principal ============ */
let UI={q:"",tab:"MBR",adm:"usuarios",hist:{},cmp:[],dash:{},dr:null,dp:null,ind:null};

const $=id=>document.getElementById(id);
const val=id=>{const e=$(id);return e?e.value.trim():""};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fd=s=>{if(!s)return"—";const p=s.slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0]};
const COL={Excelente:"#2dd4a0",Alto:"#4aa3ff",Medio:"#f5b83d",Bajo:"#ef5b5b"};
const clsOf=t=>t>=90?"Excelente":t>=75?"Alto":t>=50?"Medio":"Bajo";
const pc=n=>Math.round(n)+"%";

const me=()=>S.users.find(u=>u.id===S.sess);
const role=()=>(me()||{}).r;
const canWrite=()=>role()!=="consultor";
const isAdm=()=>role()==="admin";
const canVal=()=>role()==="admin"||role()==="docente";
const pred=id=>S.predios.find(p=>p.id===id)||{n:"(eliminado)",sis:[],inv:[]};
const evo=id=>S.evals.find(e=>e.id===id);
function audit(a){S.audit.unshift({t:nowStr(),u:me()?me().n:"Sistema",a});S.audit=S.audit.slice(0,300);save()}

/* ---------- Cálculos ---------- */
// Regla metodológica de profundidad: tabla 13 PMG contempla jaulas 2–5 m;
// tabla 40 AREL usa el rango 0,6–1,5 m.
function depthRange(reg,isJaula){
  return reg!=="AREL"&&!!isJaula?[2,5]:[0.6,1.5];
}
function calc(e){
  const list=indFor(e.reg),pesos=(S.pesos&&S.pesos[e.reg])||PESOS_BASE[e.reg]||PESOS_BASE.PMG;
  const by={MBR:{s:0,n:0},MBA:{s:0,n:0},MBG:{s:0,n:0}};
  let done=0,pend=0,na=0;const items=[];
  list.forEach(i=>{
    const r=e.resp&&e.resp[i.id];let st;
    if(!r||r.score===undefined||r.score===null){pend++;st="pe"}
    else if(r.score==="NA"){na++;st="na"}
    else if(!i.lv.some(level=>Number(level[0])===Number(r.score))){pend++;st="pe"}
    else{done++;st="ok";by[i.t].s+=Number(r.score);by[i.t].n++}
    items.push({i,r,st});
  });
  const avg={};let total=0;const gruposSinDato=[];
  for(const t of Object.keys(by)){
    avg[t]=by[t].n?by[t].s/by[t].n:null;
    if(avg[t]===null)gruposSinDato.push(t);
    else total+=avg[t]*Number(pesos[t]||0)/100;
  }
  const isComplete=pend===0;
  const isFinal=isComplete&&gruposSinDato.length===0;
  return{avg,by,done,pend,na,total,cls:isFinal?clsOf(total):"Incompleta",items,count:list.length,pesos,isComplete,isFinal,gruposSinDato};
}
function scoreText(c){
  if(c.isFinal)return pc(c.total);
  if(c.pend)return `Parcial · ${c.done+c.na}/${c.count}`;
  return "No calculable";
}
function finalOrDash(c,n=1){return c.isFinal?Number(n===1?c.total:n).toFixed(1):"—"}
function libScores(c){
  const keys=[["Hambre, sed y mala nutrición","Hambre"],["Molestias físicas y térmicas","Molestias"],["Dolor, lesión y enfermedad","Dolor"],["Temor y angustia","Temor"],["Manifestar un comportamiento natural","Comportamiento natural"]];
  return keys.map(([n,k])=>{
    const s=c.items.filter(x=>x.st==="ok"&&x.i.lib.includes(k)).map(x=>x.r.score);
    return{n,v:s.length?s.reduce((a,b)=>a+b,0)/s.length:null};
  });
}
function eligible(e,c){
  c=c||calc(e);
  if(!["finalizada","validada","cerrada"].includes(e.est))return{ok:false,why:"La evaluación aún no está finalizada."};
  if(c.pend)return{ok:false,why:"Hay indicadores pendientes o con puntuación no permitida."};
  if(c.gruposSinDato.length)return{ok:false,why:"No hay puntuaciones aplicables para calcular todos los grupos: "+c.gruposSinDato.join(", ")};
  if(!c.isFinal)return{ok:false,why:"El resultado global todavía no se puede calcular."};
  if(c.total<75)return{ok:false,why:"El puntaje es menor a 75%."};
  if(c.items.some(x=>x.st==="ok"&&Number(x.r.score)===0))return{ok:false,why:"Hay indicadores calificados con 0 puntos."};
  return{ok:true};
}
function muestreo(n,reg="PMG"){
  if(!(n>0)||!Number.isFinite(n))return null;
  if(reg==="AREL")return n<4?n:null; // Tabla 30 solo documenta todos los lotes cuando hay menos de cuatro; no se extrapola.
  if(n<4)return n;if(n<=9)return 3;return 4;
}

/* ---------- UI helpers ---------- */
function toast(m){
  const t=document.createElement("div");t.className="toast";t.textContent=m;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2800);
}
function modal(html){
  closeModal();
  const m=document.createElement("div");m.className="modal";m.id="modal";
  m.innerHTML=`<div class="mb">${html}</div>`;
  m.addEventListener("click",e=>{if(e.target===m)closeModal()});
  document.body.appendChild(m);
}
function closeModal(){const m=$("modal");if(m)m.remove()}
function confirmBox(msg,fn){
  window.__cf=fn;
  modal(`<h3>Confirmar</h3><p class="muted">${esc(msg)}</p><div class="sp"></div>
    <div class="row" style="justify-content:flex-end">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn d" onclick="closeModal();window.__cf()">Confirmar</button>
    </div>`);
}
const go=h=>{location.hash="#/"+h};
function ring(v,size,col,label,sw){
  sw=sw||10;const r=(size-sw)/2,c=2*Math.PI*r,o=c*(1-Math.min(100,Math.max(0,v))/100),m=size/2;
  return`<span class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="#0a1b23" stroke-width="${sw}"/>
      <circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${o}" transform="rotate(-90 ${m} ${m})"/>
    </svg><b>${label}</b></span>`;
}
const badge=c=>`<span class="bd b-${c}">${c}</span>`;
const stBadge=s=>`<span class="bd b-st">${ESTADOS[s]||s}</span>`;
function bars(rows,max){
  return rows.map(r=>`<div class="rl">
    <span class="small muted">${esc(r.l)}</span>
    <div class="bar"><i style="width:${Math.min(100,r.v/(max||100)*100)}%;background:${r.c||"linear-gradient(90deg,var(--cyan),var(--turq))"}"></i></div>
    <b class="small">${r.t!=null?r.t:Math.round(r.v)}</b>
  </div>`).join("");
}
function download(name,txt,type){
  const b=new Blob([txt],{type:type||"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;
  document.body.appendChild(a);a.click();a.remove();
}

/* ======================= LANDING PÚBLICA ======================= */
/* ======================= AUTENTICACIÓN ======================= */
function loginView(){
  return`<div class="auth-page">
    <div class="auth-hero">
      <div class="stage mini" data-stage="auth"></div>
      <img class="logo" src="Im/Logo.jpg" alt="ICA">
      <h1>Bienestar Acuático</h1>
      <p>Accede a la plataforma de evaluación del bienestar animal en peces de cultivo según la metodología del ICA.</p>
      <div class="chips">
        <span class="tag">23 indicadores</span>
        <span class="tag papaya">5 libertades</span>
        <span class="tag violet">Almacenamiento local</span>
      </div>
    </div>
    <div class="auth-form">
      <div class="auth-card">
        <h2>Iniciar sesión</h2>
        <p class="lead">Ingresa tus credenciales para continuar.</p>
        <form onsubmit="event.preventDefault();doLogin()">
          <div class="field"><label for="lu">Correo electrónico</label>
            <input class="input" id="lu" type="email" autocomplete="username" placeholder="correo@ejemplo.com"></div>
          <div class="field"><label for="lp">Contraseña</label>
            <div class="input-wrap">
              <input class="input" id="lp" type="password" autocomplete="current-password" placeholder="••••••••">
              <button type="button" class="toggle" onclick="togglePass('lp')">Ver</button>
            </div></div>
          <div id="lerr" class="err"></div>
          <button class="btn p" type="submit" style="width:100%;justify-content:center">Ingresar</button>
          <p style="text-align:center;margin:14px 0 0"><a href="javascript:void(0)" onclick="forgot()" class="small">¿Olvidaste tu contraseña?</a></p>
        </form>
        <div class="demo-users">
          ${[["Evaluador","evaluador@ica.demo","1234"],["Docente","docente@ica.demo","docente123"],["Admin","admin@ica.demo","admin123"],["Consultor","consultor@ica.demo","consultor123"]]
            .map(a=>`<button class="btn s ghost" onclick="demoFill('${a[1]}','${a[2]}')">${a[0]}</button>`).join("")}
        </div>
        <p class="auth-switch">¿No tienes cuenta? <a href="#/registro">Regístrate</a></p>
        <a href="#/" class="back-link small" data-scroll="top" style="display:block;text-align:center;margin-top:8px">← Volver al inicio</a>
        <p class="demo-note">Autenticación de demostración. Con el backend activo se valida contra PostgreSQL; sin conexión se usa el almacenamiento local.</p>
      </div>
    </div>
  </div>`;
}
function registerView(){
  return`<div class="auth-page">
    <div class="auth-hero">
      <div class="stage mini" data-stage="auth"></div>
      <img class="logo" src="Im/Logo.jpg" alt="ICA">
      <h1>Crea tu cuenta</h1>
      <p>Regístrate para comenzar a registrar predios y evaluar el bienestar animal en peces de cultivo.</p>
      <div class="chips">
        <span class="tag">Predios</span>
        <span class="tag papaya">Evaluaciones</span>
        <span class="tag violet">Informes</span>
      </div>
    </div>
    <div class="auth-form">
      <div class="auth-card">
        <h2>Crear cuenta</h2>
        <p class="lead">Completa el formulario para registrarte.</p>
        <form onsubmit="event.preventDefault();doRegister()">
          <div class="field"><label for="rn">Nombre completo</label>
            <input class="input" id="rn" autocomplete="name"></div>
          <div class="field"><label for="re">Correo electrónico</label>
            <input class="input" id="re" type="email" autocomplete="email"></div>
          <div class="field"><label for="rr">Rol</label>
            <select class="input" id="rr">
              <option value="evaluador">Estudiante evaluador</option>
              <option value="docente">Docente</option>
              <option value="consultor">Consultor externo</option>
            </select></div>
          <div class="field"><label for="rp">Contraseña (mín. 4 caracteres)</label>
            <div class="input-wrap">
              <input class="input" id="rp" type="password" autocomplete="new-password">
              <button type="button" class="toggle" onclick="togglePass('rp')">Ver</button>
            </div></div>
          <div class="field"><label for="rc">Confirmar contraseña</label>
            <div class="input-wrap">
              <input class="input" id="rc" type="password" autocomplete="new-password">
              <button type="button" class="toggle" onclick="togglePass('rc')">Ver</button>
            </div></div>
          <div id="rerr" class="err"></div>
          <button class="btn p" type="submit" style="width:100%;justify-content:center">Crear cuenta</button>
        </form>
        <p class="auth-switch">¿Ya tienes cuenta? <a href="#/ingresar">Inicia sesión</a></p>
        <a href="#/" class="back-link small" data-scroll="top" style="display:block;text-align:center;margin-top:8px">← Volver al inicio</a>
        <p class="demo-note">Los datos se guardan únicamente en este navegador.</p>
      </div>
    </div>
  </div>`;
}
function togglePass(id){const e=$(id);if(e)e.type=e.type==="password"?"text":"password"}
function demoFill(u,p){$("lu").value=u;$("lp").value=p}
function doLogin(){
  const u=val("lu").toLowerCase(),p=$("lp").value;
  const x=S.users.find(a=>a.e.toLowerCase()===u&&a.p===p);
  if(!u||!p){$("lerr").textContent="Ingresa usuario y contraseña.";return}
  if(!x){$("lerr").textContent="Credenciales incorrectas.";return}
  if(!x.a){$("lerr").textContent="Tu usuario está inactivo. Contacta al administrador.";return}
  S.sess=x.id;save();audit("Inicio de sesión");
  // Intenta autenticar contra la API (si está disponible) para obtener el token.
  if(window.Persistencia)Persistencia.login(u,p);
  go("inicio");
}
function doRegister(){
  const n=val("rn"),e=val("re"),r=val("rr"),p=$("rp").value,c=$("rc").value;
  const err=$("rerr");
  if(!n){err.textContent="Ingresa tu nombre completo.";return}
  if(!/^\S+@\S+\.\S+$/.test(e)){err.textContent="Correo inválido.";return}
  if(S.users.some(x=>x.e.toLowerCase()===e.toLowerCase())){err.textContent="Ya existe una cuenta con ese correo.";return}
  if(p.length<4){err.textContent="La contraseña debe tener al menos 4 caracteres.";return}
  if(p!==c){err.textContent="Las contraseñas no coinciden.";return}
  S.users.push({id:uid("u"),n,e,p,r,a:true});
  audit("Registro de usuario: "+e);save();
  // Crea también la cuenta en el servidor cuando la API está activa.
  if(window.Persistencia)Persistencia.registrar({nombre:n,email:e,password:p,rol:r});
  toast("Cuenta creada. Ahora puedes iniciar sesión.");
  go("ingresar");
}
function forgot(){
  modal(`<h3>Recuperar contraseña</h3>
    <p class="muted small">Esta funcionalidad es una simulación local: no se envía ningún correo real.</p>
    <div class="field"><label for="fm">Correo</label><input class="input" id="fm" type="email"></div>
    <div id="ferr" class="err"></div>
    <div class="row" style="justify-content:flex-end">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn p" onclick="sendReset()">Enviar enlace (simulado)</button>
    </div>`);
}
function sendReset(){
  const m=val("fm");
  if(!/^\S+@\S+\.\S+$/.test(m)){$("ferr").textContent="Escribe un correo válido.";return}
  closeModal();toast("Enlace simulado enviado a "+m);
}
function logout(){audit("Cierre de sesión");S.sess=null;save();if(window.Persistencia)Persistencia.logout();go("")}

/* ======================= SHELL PRIVADO ======================= */
const NAV=[
  ["inicio","🏠","Inicio"],
  ["predios","🌿","Predios"],
  ["evaluacion/nueva","➕","Nueva evaluación","w"],
  ["evaluaciones","📝","Evaluaciones en curso","w"],
  ["resultados","📊","Resultados"],
  ["historial","🕘","Historial"],
  ["tablero","📈","Tablero"],
  ["especies","🐠","Tipos de especies"],
  ["administracion","⚙️","Administración","a"],
  ["configuracion","🔧","Configuración"],
  ["conocenos","ℹ️","Conócenos"],
  ["ayuda","❓","Ayuda"]
];
function notifs(){
  const L=[];
  S.evals.forEach(e=>{
    const p=pred(e.pid).n;
    if(e.est==="en_proceso"||e.est==="borrador")
      L.push({t:`Evaluación pendiente: ${p} (${fd(e.fecha)})`,h:`evaluacion/${e.id}/indicadores`});
    if(e.est==="finalizada"&&canVal())
      L.push({t:`Por validar: ${p}`,h:`evaluacion/${e.id}/resultados`});
    if(e.est==="validada"&&canVal())
      L.push({t:`Por cerrar: ${p}`,h:`evaluacion/${e.id}/resultados`});
  });
  return L;
}
function shell(inner,act){
  const u=me(),n=notifs();
  const nav=NAV.filter(x=>!(x[3]==="w"&&!canWrite())&&!(x[3]==="a"&&!isAdm()))
    .map(x=>`<a href="#/${x[0]}" class="${act===x[0].split("/")[0]?"on":""}" onclick="closeSide()"><span class="ic">${x[1]}</span>${x[2]}</a>`).join("");
  return`<div class="shell">
    <aside class="side" id="side">
      <div class="side-brand"><img src="Im/Logo.jpg" alt="ICA"><span>Bienestar Acuático</span></div>
      <div class="sec">Navegación</div>
      <nav class="nav">${nav}</nav>
      <div class="side-user">
        <div class="avatar">${esc(u.n[0]||"?")}</div>
        <div style="min-width:0">
          <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.9rem">${esc(u.n)}</div>
          <div class="tiny muted">${ROLES[u.r].n}</div>
        </div>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <button class="burger" onclick="$('side').classList.toggle('open')" aria-label="Menú">☰</button>
        <span class="muted small">ICA v2.0 · Peces de cultivo</span>
        <span class="right"></span>
        <button class="btn s" onclick="toggleNot()" aria-label="Notificaciones">🔔 ${n.length?`<b style="color:var(--warn)">${n.length}</b>`:""}</button>
        <button class="btn s" onclick="logout()">Salir</button>
      </div>
      <div id="notdd" style="position:relative"></div>
      <div class="page">${inner}</div>
    </div>
  </div>`;
}
function closeSide(){const s=$("side");if(s)s.classList.remove("open")}
function toggleNot(){
  const d=$("notdd");
  if(d.innerHTML){d.innerHTML="";return}
  const n=notifs();
  d.innerHTML=`<div class="dd"><div style="padding:14px 16px;border-bottom:1px solid var(--line);font-weight:600">Notificaciones</div>
    ${n.length?n.map(x=>`<div class="li" onclick="go('${x.h}')">${esc(x.t)}</div>`).join(""):'<div class="li static muted">No tienes pendientes</div>'}</div>`;
}
function head(title,sub,right,crumb){
  return`<div class="ph"><div>${crumb?`<div class="crumb">${crumb}</div>`:""}
    <h1>${title}</h1>${sub?`<div class="muted" style="margin-top:4px">${sub}</div>`:""}</div>
    <div class="right">${right||""}</div></div>`;
}
function evRow(e){
  const p=pred(e.pid),c=calc(e);
  const target=(e.est==="en_proceso"||e.est==="borrador")?"indicadores":"resultados";
  return`<tr class="click" onclick="go('evaluacion/${e.id}/${target}')">
    <td>${fd(e.fecha)}</td><td>${esc(p.n)}</td><td>${esc(e.ev)}</td><td>${esc(e.esp)}</td>
    <td><b>${scoreText(c)}</b></td><td>${badge(c.cls)}</td><td>${stBadge(e.est)}</td></tr>`;
}
const evHead="<tr><th>Fecha</th><th>Predio</th><th>Evaluador</th><th>Especie</th><th>Puntaje</th><th>Clasificación</th><th>Estado</th></tr>";

/* ======================= INICIO ======================= */
function inicioView(){
  const u=me();
  const done=S.evals.filter(e=>["finalizada","validada","cerrada"].includes(e.est));
  const doneValid=done.map(e=>calc(e)).filter(c=>c.isFinal);
  const prom=doneValid.length?doneValid.reduce((a,c)=>a+c.total,0)/doneValid.length:null;
  const prog=S.evals.filter(e=>["en_proceso","borrador"].includes(e.est));
  const tiles=[
    ["predios","🌿","Predios","Registra y consulta los predios"],
    canWrite()?["evaluacion/nueva","📝","Nueva evaluación","Inicia una evaluación de bienestar"]:["resultados","📊","Resultados","Consulta resultados"],
    ["historial","🕘","Histórico","Evaluaciones realizadas"],
    isAdm()?["administracion","⚙️","Administración","Usuarios, roles y catálogos"]:["tablero","📈","Tablero","Indicadores agregados"]
  ];
  return head(`Hola, ${esc(u.n.split(" ")[0])}`,"Panel de control")+
    `<div class="banner"><div class="stage mini" data-stage="banner"></div>
      <div class="b-in"><h2>Bienestar animal en peces de cultivo</h2><p>Registra predios y aplica criterios de la metodología ICA v2.0. Los informes y constancias son simulaciones académicas, no documentos oficiales del ICA.</p></div></div>
    <div class="cards g4">${tiles.map(t=>`<div class="card glow" onclick="go('${t[0]}')" style="cursor:pointer">
      <div class="ic" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:1.3rem;background:linear-gradient(135deg,rgba(214,255,63,.18),rgba(255,122,26,.1));border:1px solid rgba(214,255,63,.3);margin-bottom:12px">${t[1]}</div>
      <h3>${t[2]}</h3><span class="muted small">${t[3]}</span></div>`).join("")}
    </div><div class="sp"></div>
    <div class="cards g4">
      <div class="card kpi"><b>${S.predios.filter(p=>p.act).length}</b><span>Predios activos</span></div>
      <div class="card kpi"><b>${S.evals.length}</b><span>Evaluaciones</span></div>
      <div class="card kpi"><b>${prog.length}</b><span>En proceso</span></div>
      <div class="card kpi"><b>${prom===null?"—":pc(prom)}</b><span>Puntaje promedio válido</span></div>
    </div><div class="sp"></div>
    <div class="cards g2">
      <div class="card"><h3>Evaluaciones en proceso</h3>
        ${prog.length?prog.map(e=>{const c=calc(e);return`<div class="li" onclick="go('evaluacion/${e.id}/indicadores')">
          <div style="flex:1"><b>${esc(pred(e.pid).n)}</b><div class="tiny muted">${fd(e.fecha)} · ${esc(e.ev)}</div></div>
          <span class="small muted">${c.done+c.na}/${c.count}</span></div>`}).join(""):'<p class="muted small">Sin evaluaciones pendientes.</p>'}
      </div>
      <div class="card"><h3>Últimas evaluaciones</h3>
        ${done.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,4).map(e=>{const c=calc(e);
          return`<div class="li" onclick="go('evaluacion/${e.id}/resultados')">
            <div style="flex:1"><b>${esc(pred(e.pid).n)}</b><div class="tiny muted">${fd(e.fecha)} · ${esc(e.ev)}</div></div>
            <span class="right">${scoreText(c)} ${badge(c.cls)}</span></div>`}).join("")||'<p class="muted small">Sin evaluaciones completadas.</p>'}
      </div>
    </div>`;
}

/* ======================= PREDIOS ======================= */
function prediosView(){
  const q=UI.q.toLowerCase();
  const L=S.predios.filter(p=>!q||(p.n+p.cod+p.resp+p.mun+p.dep).toLowerCase().includes(q));
  return head("Predios","Registra, consulta y edita predios",
    canWrite()?`<button class="btn p" onclick="newPredio()">+ Nuevo predio</button>`:"")+
    `<div style="max-width:380px;margin-bottom:14px">
      <input class="input" id="pq" placeholder="Buscar por nombre, código, municipio…" value="${esc(UI.q)}" oninput="UI.q=this.value;renderKeep('pq')">
    </div>
    <div class="tw"><table>
      <tr><th>Código</th><th>Predio</th><th>Ubicación</th><th>Tipo</th><th>Sistemas</th><th>Evals.</th><th>Estado</th><th></th></tr>
      ${L.map(p=>`<tr>
        <td>${esc(p.cod)}</td>
        <td><b>${esc(p.n)}</b><div class="tiny muted">${esc(p.resp)}</div></td>
        <td>${esc(p.mun)}, ${esc(p.dep)}</td>
        <td class="small">${esc(p.tipo)}</td>
        <td class="small">${esc((p.sis||[]).join(", "))}</td>
        <td>${S.evals.filter(e=>e.pid===p.id).length}</td>
        <td>${p.act?'<span class="bd b-ok">Activo</span>':'<span class="bd b-na">Inactivo</span>'}</td>
        <td><button class="btn s" onclick="editPredio('${p.id}')">${canWrite()?"Editar":"Ver"}</button></td>
      </tr>`).join("")||'<tr><td colspan="8" class="muted">Sin resultados</td></tr>'}
    </table></div>`;
}
function renderKeep(id){
  const pos=($(id)||{}).selectionStart;render();
  const e=$(id);if(e){e.focus();try{e.setSelectionRange(pos,pos)}catch(x){}}
}
function newPredio(){
  UI.dp={id:null,cod:"PRD-"+String(S.predios.length+1).padStart(4,"0"),n:"",resp:"",mail:"",tipo:"",sis:[],dep:"",mun:"",ver:"",dir:"",lat:"",lng:"",inv:[{esp:"",cant:"",peso:"",lotes:""}],act:true};
  go("predios/form");
}
function editPredio(id){
  UI.dp=JSON.parse(JSON.stringify(pred(id)));
  if(!UI.dp.inv||!UI.dp.inv.length)UI.dp.inv=[{esp:"",cant:"",peso:"",lotes:""}];
  go("predios/form");
}
function syncPredio(){
  const d=UI.dp;if(!d||!$("pn"))return;
  d.cod=val("pc");d.n=val("pn");d.resp=val("pr");d.mail=val("pm");d.tipo=val("pt");
  d.dep=val("pd");d.mun=val("pmun");d.ver=val("pv");d.dir=val("pdi");
  d.lat=val("pla");d.lng=val("pln");d.act=$("pa").checked;
  d.sis=[...document.querySelectorAll(".sisck:checked")].map(x=>x.value);
  d.inv=d.inv.map((r,i)=>({esp:val("ie"+i),cant:val("ic"+i),peso:val("ip"+i),lotes:val("il"+i)}));
}
function predioForm(){
  const d=UI.dp;if(!d){go("predios");return""}
  const ro=!canWrite()?"disabled":"";
  const mun=d.dep?DEPTOS[d.dep]:[];
  const esps=S.esp.filter(e=>e.act).map(e=>e.n);
  return head(d.id?"Editar predio":"Registrar predio","Completa los datos del predio","",
    `<a href="#/predios">Predios</a> / ${d.id?"Editar":"Nuevo"}`)+
    `<div class="card"><div class="fg">
      <div class="field"><label for="pc">Código del predio *</label><input class="input" id="pc" value="${esc(d.cod)}" ${ro}></div>
      <div class="field"><label for="pn">Nombre del predio *</label><input class="input" id="pn" value="${esc(d.n)}" ${ro}></div>
      <div class="field"><label for="pr">Responsable *</label><input class="input" id="pr" value="${esc(d.resp)}" ${ro}></div>
      <div class="field"><label for="pm">Correo del responsable *</label><input class="input" id="pm" type="email" value="${esc(d.mail)}" ${ro}></div>
      <div class="field full"><label for="pt">Tipo de predio / productor *</label>
        <select class="input" id="pt" ${ro}><option value="">Seleccionar</option>
          ${TIPOS_PRODUCTOR.map(t=>`<option ${d.tipo===t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div class="field full"><label>Sistema productivo *</label>
        <div>${SISTEMAS.map(s=>`<label class="chk"><input type="checkbox" class="sisck" value="${s}" ${(d.sis||[]).includes(s)?"checked":""} ${ro}>${s}</label>`).join("")}</div></div>
      <div class="field"><label for="pd">Departamento *</label>
        <select class="input" id="pd" onchange="syncPredio();UI.dp.mun='';render()" ${ro}><option value="">Seleccionar</option>
          ${Object.keys(DEPTOS).map(x=>`<option ${d.dep===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="pmun">Municipio *</label>
        <select class="input" id="pmun" ${ro}><option value="">Seleccionar</option>
          ${mun.map(x=>`<option ${d.mun===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="pv">Vereda</label><input class="input" id="pv" value="${esc(d.ver)}" ${ro}></div>
      <div class="field"><label for="pdi">Dirección</label><input class="input" id="pdi" value="${esc(d.dir)}" ${ro}></div>
      <div class="field"><label for="pla">Latitud (opcional)</label><input class="input" id="pla" value="${esc(d.lat)}" ${ro}></div>
      <div class="field"><label for="pln">Longitud (opcional)</label><input class="input" id="pln" value="${esc(d.lng)}" ${ro}></div>
    </div><div class="sp"></div>
    <h3>Inventario de peces</h3>
    ${d.inv.map((r,i)=>`<div class="row" style="margin-bottom:8px;align-items:flex-end">
      <div class="field" style="flex:1;min-width:150px"><label>Especie</label>
        <select class="input" id="ie${i}" ${ro}><option value="">Seleccionar</option>${esps.map(x=>`<option ${r.esp===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field" style="width:120px"><label>Cantidad</label><input class="input" type="number" min="0" id="ic${i}" value="${esc(r.cant)}" ${ro}></div>
      <div class="field" style="width:130px"><label>Peso prom. (g)</label><input class="input" type="number" min="0" id="ip${i}" value="${esc(r.peso)}" ${ro}></div>
      <div class="field" style="width:100px"><label>Lotes</label><input class="input" type="number" min="0" id="il${i}" value="${esc(r.lotes)}" ${ro}></div>
      ${canWrite()?`<button class="btn s d" onclick="syncPredio();UI.dp.inv.splice(${i},1);if(!UI.dp.inv.length)UI.dp.inv.push({esp:'',cant:'',peso:'',lotes:''});render()">Quitar</button>`:""}
    </div>`).join("")}
    ${canWrite()?`<button class="btn s" onclick="syncPredio();UI.dp.inv.push({esp:'',cant:'',peso:'',lotes:''});render()">+ Agregar especie</button>`:""}
    <div class="sp"></div>
    <label class="chk" style="max-width:240px"><input type="checkbox" id="pa" ${d.act?"checked":""} ${ro}>Predio activo</label>
    <div id="perr" class="err"></div><div class="sp"></div>
    <div class="row"><button class="btn" onclick="go('predios')">Volver</button>
      ${canWrite()?`<button class="btn p" onclick="savePredio()">Guardar predio</button>`:""}
      ${d.id&&canWrite()?`<button class="btn d right" onclick="delPredio('${d.id}')">Eliminar</button>`:""}
    </div></div>`;
}
function savePredio(){
  syncPredio();const d=UI.dp,er=[];
  if(!d.cod)er.push("código");
  if(!d.n)er.push("nombre");
  if(!d.resp)er.push("responsable");
  if(!/^\S+@\S+\.\S+$/.test(d.mail))er.push("correo válido");
  if(!d.tipo)er.push("tipo de predio");
  if(!d.sis.length)er.push("sistema productivo");
  if(!d.dep)er.push("departamento");
  if(!d.mun)er.push("municipio");
  if((d.lat&&isNaN(+d.lat))||(d.lng&&isNaN(+d.lng)))er.push("coordenadas numéricas");
  if(S.predios.some(p=>p.cod===d.cod&&p.id!==d.id))er.push("código único");
  if(er.length){$("perr").textContent="Revisa: "+er.join(", ")+".";return}
  d.inv=d.inv.filter(r=>r.esp).map(r=>({esp:r.esp,cant:+r.cant||0,peso:+r.peso||0,lotes:+r.lotes||0}));
  if(d.id){S.predios=S.predios.map(p=>p.id===d.id?d:p);audit("Predio editado: "+d.n)}
  else{d.id=uid("p");S.predios.push(d);audit("Predio creado: "+d.n)}
  save();toast("Predio guardado");UI.dp=null;
  if(window.Persistencia)Persistencia.predioGuardado(d);
  go("predios");
}
function delPredio(id){
  const n=S.evals.filter(e=>e.pid===id).length;
  confirmBox(n?`Este predio tiene ${n} evaluaciones. Si lo eliminas quedarán sin predio. ¿Continuar?`:"¿Eliminar este predio?",()=>{
    const p=pred(id);S.predios=S.predios.filter(x=>x.id!==id);
    audit("Predio eliminado: "+p.n);save();toast("Predio eliminado");UI.dp=null;
    if(window.Persistencia)Persistencia.predioEliminado(id);
    go("predios");
  });
}

/* ======================= EVALUACIONES ======================= */
function newEval(){UI.dr={step:1,pid:"",fecha:today(),ev:me().n,esp:"",reg:"PMG",lotes:"",sel:[],cant:"",peso:"",lote:""};go("evaluacion/nueva")}
function syncDr(){
  const d=UI.dr;if(!d||d.step!==1||!$("ev_f"))return;
  d.pid=val("ev_p");d.fecha=val("ev_f");d.ev=val("ev_e");d.esp=val("ev_s");d.reg=val("ev_t");d.lotes=val("ev_l");
}
function predChange(){
  syncDr();
  const p=S.predios.find(x=>x.id===UI.dr.pid);
  if(p){
    UI.dr.reg=/AREL|subsistencia/i.test(p.tipo)?"AREL":"PMG";
    const l=p.inv.reduce((a,r)=>a+(+r.lotes||0),0);
    UI.dr.lotes=l||"";
    if(p.inv[0])UI.dr.esp=p.inv[0].esp;
  }
  render();
}
function evalWizard(){
  const d=UI.dr;if(!d){go("evaluaciones");return""}
  const p=S.predios.find(x=>x.id===d.pid);
  const st=["Datos generales","Selección de lotes","Información de peces"];
  let body="";
  if(d.step===1){
    const us=S.users.filter(u=>u.a&&u.r!=="consultor");
    body=`<div class="fg">
      <div class="field"><label for="ev_p">Predio *</label>
        <select class="input" id="ev_p" onchange="predChange()"><option value="">Seleccionar</option>
          ${S.predios.filter(x=>x.act).map(x=>`<option value="${x.id}" ${d.pid===x.id?"selected":""}>${esc(x.n)}</option>`).join("")}</select></div>
      <div class="field"><label for="ev_f">Fecha *</label><input class="input" type="date" id="ev_f" value="${d.fecha}"></div>
      <div class="field"><label for="ev_e">Evaluador *</label>
        <select class="input" id="ev_e">${us.map(u=>`<option ${d.ev===u.n?"selected":""}>${esc(u.n)}</option>`).join("")}</select></div>
      <div class="field"><label for="ev_s">Especie *</label>
        <select class="input" id="ev_s"><option value="">Seleccionar</option>
          ${S.esp.filter(x=>x.act).map(x=>`<option ${d.esp===x.n?"selected":""}>${x.n}</option>`).join("")}</select></div>
      <div class="field full"><label for="ev_t">Tipo de evaluación *</label>
        <select class="input" id="ev_t" onchange="syncDr();render()">
          <option value="PMG" ${d.reg==="PMG"?"selected":""}>Pequeños, medianos y grandes (23 indicadores · 35/35/30)</option>
          <option value="AREL" ${d.reg==="AREL"?"selected":""}>Subsistencia / AREL (15 indicadores · 40/40/20)</option>
        </select></div>
      <div class="field"><label for="ev_l">Número de lotes sembrados *</label>
        <input class="input" type="number" min="1" id="ev_l" value="${esc(d.lotes)}" onchange="syncDr();render()"></div>
    </div>
    ${p?`<div class="sp"></div><h3>Datos del establecimiento</h3>
      <div class="cards g2">
        <div class="small"><span class="muted">Nombre:</span> ${esc(p.n)}</div>
        <div class="small"><span class="muted">Responsable:</span> ${esc(p.resp)}</div>
        <div class="small"><span class="muted">Ubicación:</span> ${esc(p.mun)}, ${esc(p.dep)}</div>
        <div class="small"><span class="muted">Sistemas:</span> ${esc((p.sis||[]).join(", "))}</div>
        <div class="small full"><span class="muted">Tipo:</span> ${esc(p.tipo)}</div>
      </div>`:""}`;
  }
  if(d.step===2){
    const n=+d.lotes,req=muestreo(n,d.reg),all=req===n;
    if(all)d.sel=Array.from({length:n},(_,i)=>"Lote "+(i+1));
    if(req===null){
      body=`<div class="alert w"><b>Verificación metodológica necesaria:</b> la tabla 30 del apartado AREL indica evaluar todos los lotes cuando hay menos de cuatro; no permite inferir automáticamente el tamaño de muestra para ${n} lotes. Confirma el criterio aplicable antes de continuar.</div>`;
    }else{
      body=`<div class="alert i"><b>Regla de muestreo (${d.reg}):</b> con ${n} lotes, se evalúan <b>${all?"todos":req}</b>. ${d.reg==="AREL"?"En la tabla 30 se documenta este criterio para menos de cuatro lotes.":"PMG: menos de 4 → todos; de 4 a 9 → 3; más de 9 → 4."}</div>
      <div class="sp"></div>
      <div class="small muted" style="margin-bottom:10px">Seleccionados: ${d.sel.length} de ${req}</div>
      ${Array.from({length:n},(_,i)=>{const nm="Lote "+(i+1);
        return`<label class="chk"><input type="checkbox" ${d.sel.includes(nm)?"checked":""} ${all?"disabled":""} onchange="toggleLote('${nm}')">${nm}</label>`}).join("")}`;
    }
  }
  if(d.step===3){
    body=`<div class="fg">
      <div class="field"><label>Especie</label><input class="input" value="${esc(d.esp)}" disabled></div>
      <div class="field"><label for="pi_c">Cantidad de especímenes *</label>
        <input class="input" type="number" min="15" max="15" step="1" id="pi_c" value="${esc(d.cant||15)}"><small class="muted">El indicador de tamaño y peso indica un mínimo de 15; la nota general fija un máximo de 15 por lote. Para este flujo, se registran 15.</small></div>
      <div class="field"><label for="pi_p">Peso promedio (g) *</label>
        <input class="input" type="number" min="1" id="pi_p" value="${esc(d.peso)}"></div>
      <div class="field"><label>Tipo de predio</label><input class="input" value="${esc(p?p.tipo:"")}" disabled></div>
      <div class="field full"><label for="pi_l">Lote *</label>
        <select class="input" id="pi_l">${d.sel.map(x=>`<option ${d.lote===x?"selected":""}>${x}</option>`).join("")}</select></div>
    </div>`;
  }
  return head("Nueva evaluación","Asistente de evaluación","",
    `<a href="#/evaluaciones">Evaluaciones</a> / Nueva`)+
    `<div class="steps">${st.map((s,i)=>`<div class="${d.step===i+1?"on":d.step>i+1?"done":""}">${i+1}. ${s}</div>`).join("")}</div>
    <div class="card">${body}<div id="werr" class="err" style="margin-top:10px"></div><div class="sp"></div>
      <div class="row"><button class="btn" onclick="${d.step===1?"go('evaluaciones')":"wBack()"}">${d.step===1?"Cancelar":"Volver"}</button>
        <button class="btn p" onclick="wNext()">${d.step===3?"Iniciar evaluación":"Continuar"}</button>
      </div></div>`;
}
function toggleLote(n){
  const d=UI.dr,req=muestreo(+d.lotes,d.reg);
  if(req===null){toast("La muestra AREL requiere verificación metodológica para 4 lotes o más.");return}
  const i=d.sel.indexOf(n);
  if(i>=0)d.sel.splice(i,1);
  else if(d.sel.length<req)d.sel.push(n);
  else toast("Ya seleccionaste "+req+" lotes");
  render();
}
function wBack(){UI.dr.step--;render()}
function wNext(){
  const d=UI.dr;syncDr();
  const E=m=>{$("werr").textContent=m};
  if(d.step===1){
    if(!d.pid)return E("Selecciona un predio.");
    if(!d.fecha)return E("Indica la fecha.");
    if(!d.esp)return E("Selecciona la especie.");
    if(!(+d.lotes>0))return E("Indica el número de lotes sembrados.");
    d.step=2;d.sel=[];render();return;
  }
  if(d.step===2){
    const req=muestreo(+d.lotes,d.reg);
    if(req===null)return E("La tabla 30 de AREL solo especifica el muestreo para menos de cuatro lotes. Verifica el criterio aplicable antes de continuar.");
    if(d.sel.length!==req)return E("Debes seleccionar exactamente "+req+" lote(s).");
    d.step=3;d.lote=d.sel[0];render();return;
  }
  d.cant=val("pi_c");d.peso=val("pi_p");d.lote=val("pi_l");
  if(+d.cant!==15||!Number.isInteger(+d.cant)||!(+d.peso>0))return E("Para este flujo de evaluación, registra 15 ejemplares por lote (mínimo señalado en tamaño y peso y máximo de la nota general) y un peso promedio mayor que cero.");
  const e={id:uid("e"),pid:d.pid,fecha:d.fecha,ev:d.ev,reg:d.reg,esp:d.esp,lotes:+d.lotes,sel:d.sel,
    peces:{esp:d.esp,cant:+d.cant,peso:+d.peso,lote:d.lote},resp:{},est:"en_proceso",recs:[],plan:[],cr:today(),up:nowStr()};
  S.evals.push(e);audit("Evaluación creada: "+pred(d.pid).n);save();
  if(window.Persistencia)Persistencia.evaluacionGuardada(e);
  UI.dr=null;toast("Evaluación creada");go("evaluacion/"+e.id+"/indicadores");
}
function evaluacionesView(){
  const L=S.evals.filter(e=>["en_proceso","borrador"].includes(e.est));
  return head("Evaluaciones en curso","Continúa donde quedaste",
    canWrite()?`<button class="btn p" onclick="newEval()">+ Nueva evaluación</button>`:"")+
    (L.length?`<div class="tw"><table>${evHead}${L.map(evRow).join("")}</table></div>`:'<div class="card muted">Sin evaluaciones en curso.</div>');
}
function indListView(id){
  const e=evo(id);if(!e){go("evaluaciones");return""}
  const c=calc(e),p=pred(e.pid),t=UI.tab;
  const rows=c.items.filter(x=>x.i.t===t);
  const edit=canWrite()&&["en_proceso","borrador"].includes(e.est);
  const lbl={ok:"Completado",pe:"Pendiente",na:"No aplica"};
  return head("Indicadores",`${esc(p.n)} · ${esc(e.esp)} · ${e.reg==="AREL"?"AREL":"PMG"}`,"",
    `<a href="#/evaluaciones">Evaluaciones</a> / Indicadores`)+
    `<div class="card" style="margin-bottom:16px"><div class="row">
      <div style="flex:1;min-width:200px">
        <div class="small muted">Avance general</div>
        <div class="bar" style="margin:8px 0"><i style="width:${(c.done+c.na)/c.count*100}%"></i></div>
        <div class="small">${c.done+c.na} de ${c.count} indicadores · Último guardado: ${esc(e.up)}</div>
      </div>${ring((c.done+c.na)/c.count*100,72,"#2dd4a0",pc((c.done+c.na)/c.count*100),8)}</div></div>
    <div class="tabs">${["MBR","MBA","MBG"].map(k=>`<button class="${t===k?"on":""}" onclick="UI.tab='${k}';render()">
      ${k} · ${MEDIDAS[k].n} (${c.items.filter(x=>x.i.t===k&&x.st!=="pe").length}/${c.items.filter(x=>x.i.t===k).length})</button>`).join("")}</div>
    <div class="card" style="padding:0">
      <div class="small muted" style="padding:14px 16px;border-bottom:1px solid var(--line)">
        ${MEDIDAS[t].full} · peso ${c.pesos[t]}%</div>
      ${rows.map(x=>`<div class="li" onclick="openInd('${e.id}','${x.i.id}')">
        <div style="flex:1"><b>${x.i.id}</b> · ${esc(x.i.n)}
          <div class="tiny muted">${x.r&&x.r.score!==undefined&&x.r.score!=="NA"?x.r.score+" puntos":esc(x.i.met)}</div></div>
        <span class="bd b-${x.st}">${lbl[x.st]}</span><span class="muted">›</span></div>`).join("")}
    </div><div class="sp"></div>
    <div class="row"><button class="btn" onclick="go('evaluaciones')">Guardar y salir</button>
      <button class="btn p right" onclick="go('evaluacion/${e.id}/resumen')">Siguiente: resumen</button></div>
    ${edit?"":'<div class="alert i" style="margin-top:12px">Modo solo lectura.</div>'}`;
}
function openInd(eid,iid){
  const e=evo(eid),r=e.resp[iid]||{};
  UI.ind={ev:eid,id:iid,tab:"p",score:r.score,obs:r.obs||"",evid:(r.evid||[]).slice(),
    calc:JSON.parse(JSON.stringify(r.calc||{})),msg:""};
  go(`evaluacion/${eid}/indicador/${iid}`);
}
function syncInd(){
  const u=UI.ind;if(!u)return;
  if($("i_obs"))u.obs=$("i_obs").value;
  document.querySelectorAll("[data-c]").forEach(x=>{u.calc[x.dataset.c]=x.type==="checkbox"?x.checked:x.value});
}
function setScore(v){syncInd();UI.ind.score=v;render()}
function indTab(t){syncInd();UI.ind.tab=t;render()}
function indView(eid,iid){
  const e=evo(eid),i=IND.find(x=>x.id===iid);
  if(!e||!i){go("evaluaciones");return""}
  if(!UI.ind||UI.ind.ev!==eid||UI.ind.id!==iid)openInd(eid,iid);
  const u=UI.ind,edit=canWrite()&&["en_proceso","borrador"].includes(e.est),dis=edit?"":"disabled";
  let body="";
  if(u.tab==="p"){
    body=`<p><b>${esc(i.q)}</b></p>${i.lv.map(l=>`<label class="opt ${u.score===l[0]?"sel":""}">
      <input type="radio" name="sc" ${u.score===l[0]?"checked":""} ${dis} onchange="setScore(${l[0]})">
      <b>${l[0]}</b><span>${esc(l[1])}</span></label>`).join("")}
      ${i.na?`<label class="opt ${u.score==="NA"?"sel":""}">
        <input type="radio" name="sc" ${u.score==="NA"?"checked":""} ${dis} onchange="setScore('NA')">
        <b>N/A</b><span>${esc(i.na)}</span></label>`:""}
      <div class="field" style="margin-top:14px"><label for="i_obs">Observaciones adicionales</label>
        <textarea class="input" id="i_obs" placeholder="Escribe aquí…" ${dis}>${esc(u.obs)}</textarea></div>`;
  }
  if(u.tab==="m")body=muestras(e,i,dis);
  if(u.tab==="e")body=`<p class="muted small">Adjunta fotografías, documentos o videos cortos como evidencia. Los archivos se guardan localmente (IndexedDB).</p>
    ${edit?`<label class="card" style="display:block;text-align:center;border-style:dashed;cursor:pointer;padding:26px">
      <div style="font-size:1.6rem">⬆️</div>Subir archivo o imágenes
      <input type="file" multiple accept="image/*,.pdf,video/*" style="display:none" onchange="addEvid(this)"></label>`:""}
    <div class="sp"></div>
    ${u.evid.length?u.evid.map((f,k)=>`<div class="li static">
      📎 ${esc(typeof f==="string"?f:f.name||"archivo")}
      ${edit?`<button class="btn s d right" onclick="syncInd();UI.ind.evid.splice(${k},1);render()">Quitar</button>`:""}</div>`).join(""):'<p class="muted small">Sin evidencias adjuntas.</p>'}`;
  return head(`Indicador ${i.id} · ${esc(i.n)}`,`${MEDIDAS[i.t].full} · ${esc(i.lib)}`,"",
    `<a href="#/evaluacion/${eid}/indicadores">Indicadores</a> / ${i.id}`)+
    `<div class="tabs">${[["p","Preguntas"],["m","Muestras"],["e","Evidencias"]].map(t=>
      `<button class="${u.tab===t[0]?"on":""}" onclick="indTab('${t[0]}')">${t[1]}</button>`).join("")}</div>
    <div class="card">${body}<div id="ierr" class="err"></div><div class="sp"></div>
      <div class="row"><button class="btn" onclick="go('evaluacion/${eid}/indicadores')">Cancelar</button>
        ${edit?`<button class="btn p right" onclick="saveInd()">Guardar indicador</button>`:""}
      </div></div>`;
}
async function addEvid(inp){
  syncInd();
  const files=[...inp.files];
  for(const f of files){
    const key=uid("ev");
    try{await idbPut(key,f);UI.ind.evid.push({key,name:f.name,type:f.type,size:f.size,_file:f})}
    catch(e){toast("No se pudo guardar "+f.name)}
  }
  render();
}
/* Sube al servidor las evidencias pendientes de un indicador (solo modo API). */
function subirEvidencias(e,codigo,evid){
  if(!window.Persistencia||!Persistencia.esApi())return;
  (evid||[]).forEach(f=>{const file=f&&f._file;if(file)Persistencia.evidencia(e,codigo,file);});
}
function saveInd(){
  syncInd();const u=UI.ind,e=evo(u.ev);
  if(u.score===undefined||u.score===null){$("ierr").textContent="Selecciona un resultado.";return}
  e.resp[u.id]={score:u.score,obs:u.obs,evid:u.evid,calc:u.calc};
  e.up=nowStr();if(e.est==="borrador")e.est="en_proceso";
  audit(`Indicador ${u.id} guardado (${pred(e.pid).n})`);save();toast("Indicador guardado");
  if(window.Persistencia){
    Persistencia.respuestaGuardada(e,u.id,e.resp[u.id]).then(()=>subirEvidencias(e,u.id,u.evid));
  }
  UI.ind=null;go(`evaluacion/${u.ev}/indicadores`);
}
function mrow(l,id,v,ph,t){
  return`<div class="field"><label for="${id}">${l}</label>
    <input class="input" type="${t||"number"}" min="0" step="any" id="${id}" data-c="${id}" value="${esc(v!=null?v:"")}" placeholder="${ph||""}"></div>`;
}
function muestras(e,i,dis){
  const c=UI.ind.calc,p=pred(e.pid);
  let h=`<div class="alert i"><b>Método:</b> ${esc(i.met)}.<br>
    <b>Lotes a muestrear:</b> ${esc((e.sel||[]).join(", ")||"—")}. Máximo 15 peces por lote.</div><div class="sp"></div>`;
  const btn=`<div class="sp"></div><button class="btn p" ${dis} onclick="applyCalc()">Calcular y aplicar puntaje</button>`;
  const res=UI.ind.msg?`<div class="alert g" style="margin-top:12px">${esc(UI.ind.msg)}</div>`:"";
  switch(i.calc){
    case"dietas":h+=`<div class="fg">${mrow("Días entre ajustes","d_dias",c.d_dias)}
      <label class="chk" style="align-self:end"><input type="checkbox" data-c="d_sin" ${c.d_sin?"checked":""}>No hay registros</label></div>`+btn;break;
    case"profundidad":h+=`<div class="alert i">Rango de referencia: ${e.reg==="AREL"?"0,6–1,5 m (tabla 40, AREL)":"0,6–1,5 m; para jaulas, 2–5 m (tabla 13, PMG)"}.</div>
      <div class="fg">${mrow("Profundidad (m)","p_prof",c.p_prof)}
      ${e.reg==="AREL"?"":`<label class="chk"><input type="checkbox" data-c="p_jaula" ${c.p_jaula?"checked":""}>Sistema de jaulas</label>`}
      <label class="chk"><input type="checkbox" data-c="p_med" ${c.p_med?"checked":""}>Se aplican medidas correctivas</label></div>`+btn;break;
    case"tamano":h+=`<div class="fg">${mrow("Peces medidos","t_tot",c.t_tot)}${mrow("Peces ± 10% del promedio","t_prom",c.t_prom)}</div>`+btn;break;
    case"lesiones":h+=`<div class="fg">${mrow("Peces revisados","l_tot",c.l_tot)}${mrow("Peces con daños","l_dan",c.l_dan)}</div>`+btn;break;
    case"mortalidad":h+=`<div class="fg">${mrow("Muertos en 12 meses","m_mue",c.m_mue)}
      ${mrow("Población promedio","m_pob",c.m_pob)}
      <label class="chk full"><input type="checkbox" data-c="m_sin" ${c.m_sin?"checked":""}>Sin registros o peces muertos visibles</label>
      </div><p class="small muted">Especie: ${esc(e.esp)} (${e.esp==="Cachama"?"umbral cachama":"umbral otras"})</p>`+btn;break;
    case"capacitacion":h+=`<div class="fg">${mrow("Personas en producción","k_tot",c.k_tot)}
      ${mrow("Con conocimiento","k_con",c.k_con)}${mrow("Con certificado","k_cer",c.k_cer)}</div>`+btn;break;
    default:h+=`<p class="muted">Este indicador se califica directamente en <b>Preguntas</b>.</p>`;
  }
  if(i.id==="RE04"){const s=S.esp.find(x=>x.n===e.esp)||S.esp[3];
    h+=`<div class="sp"></div><h3>Parámetros de referencia · ${esc(s.n)}</h3>
      <div class="cards g4">
        <div class="card kpi"><b style="font-size:1.1rem">${s.temp}</b><span>Temperatura</span></div>
        <div class="card kpi"><b style="font-size:1.1rem">${s.od}</b><span>Oxígeno</span></div>
        <div class="card kpi"><b style="font-size:1.1rem">${s.ph}</b><span>pH</span></div>
        <div class="card kpi"><b style="font-size:1.1rem">${s.turb}</b><span>Turbidez</span></div>
      </div>`;}
  if(i.id==="AN06")h+=`<div class="sp"></div><h3>Densidades de referencia</h3>
    <div class="tw"><table><tr><th>Sistema</th><th>Referencia</th></tr>
      ${(p.sis.length?p.sis:Object.keys(DENSIDADES)).map(s=>`<tr><td>${esc(s)}</td><td>${DENSIDADES[s]||"—"}</td></tr>`).join("")}
    </table></div>`;
  return h+res;
}
function applyCalc(){
  syncInd();
  const u=UI.ind,c=u.calc,e=evo(u.ev),i=IND.find(x=>x.id===u.id);
  let s=null,m="";const n=k=>parseFloat(c[k]);
  if(i.calc==="dietas"){
    if(c.d_sin)s=0;else if(isNaN(n("d_dias")))return toast("Ingresa los días");
    else s=n("d_dias")<30?100:n("d_dias")<=45?55:20;
    m=`Ajuste ${c.d_sin?"— (sin registros)":n("d_dias")+" días"} → ${s} pts`;
  }
  if(i.calc==="profundidad"){
    if(isNaN(n("p_prof"))||n("p_prof")<=0)return toast("Ingresa una profundidad mayor que cero");
    // ICA v2.0: la tabla 13 (PMG) contempla 2–5 m en sistemas de jaulas;
    // la tabla 40 (AREL) presenta el rango general 0,6–1,5 m.
    const [lo,hi]=depthRange(e.reg,c.p_jaula),jaulaPMG=e.reg!=="AREL"&&!!c.p_jaula;
    const ok=n("p_prof")>=lo&&n("p_prof")<=hi;
    s=ok?100:(c.p_med?55:0);m=`${n("p_prof")} m (rango ${lo}–${hi} m${jaulaPMG?", jaula PMG":""}) → ${s} pts`;
  }
  if(i.calc==="tamano"){
    if(!(n("t_tot")>0)||!Number.isInteger(n("t_tot"))||!Number.isInteger(n("t_prom"))||n("t_prom")<0||n("t_prom")>n("t_tot"))return toast("Revisa los valores: usa cantidades enteras y no cuentes más peces en el promedio que los medidos.");
    const p=n("t_prom")/n("t_tot")*100;s=p>90?100:p>=80?55:p>=70?20:0;
    m=`${p.toFixed(1)}% en promedio → ${s} pts`;
  }
  if(i.calc==="lesiones"){
    if(!(n("l_tot")>0)||!Number.isInteger(n("l_tot"))||!Number.isInteger(n("l_dan"))||n("l_dan")<0||n("l_dan")>n("l_tot"))return toast("Revisa los valores: usa cantidades enteras y los peces con daños no pueden superar los revisados.");
    const p=n("l_dan")/n("l_tot")*100;s=p<5?100:p<=10?55:p<=20?20:0;
    m=`${p.toFixed(1)}% con daños → ${s} pts`;
  }
  if(i.calc==="mortalidad"){
    if(c.m_sin){s=0;m="Sin registros o peces muertos visibles → 0 pts"}
    else{
      if(!Number.isFinite(n("m_mue"))||!Number.isFinite(n("m_pob"))||n("m_mue")<0||!(n("m_pob")>0)||n("m_mue")>n("m_pob"))return toast("Revisa los valores: los muertos no pueden ser negativos ni superar la población y la población debe ser mayor que cero.");
      const p=n("m_mue")/n("m_pob")*100,ca=e.esp==="Cachama",t=ca?[1,2,3]:[10,12,15];
      s=p<=t[0]?100:p<=t[1]?55:p<=t[2]?20:0;
      m=`Mortalidad ${p.toFixed(2)}% → ${s} pts`;
    }
  }
  if(i.calc==="capacitacion"){
    const t=n("k_tot"),k=n("k_con"),r=n("k_cer");
    if(!(t>0)||isNaN(k)||isNaN(r)||k>t||r>t)return toast("Revisa los valores");
    s=(k===t&&r===t)?100:((k>t/2&&r>t/2)||k===t)?55:k>t/2?20:0;
    m=`${k}/${t} con conocimiento, ${r}/${t} certificados → ${s} pts`;
  }
  u.score=s;u.msg=m+". Revisa la pestaña Preguntas para confirmar.";
  render();
}
function resumenView(id){
  const e=evo(id);if(!e){go("evaluaciones");return""}
  const c=calc(e),p=pred(e.pid);
  const edit=canWrite()&&["en_proceso","borrador"].includes(e.est);
  return head("Resumen de evaluación",`${esc(p.n)} · ${fd(e.fecha)}`,"",
    `<a href="#/evaluacion/${id}/indicadores">Indicadores</a> / Resumen`)+
    `<div class="cards g2">
      <div class="card"><h3>Avance general</h3>
        <div class="row" style="gap:24px">${ring((c.done+c.na)/c.count*100,120,"#2dd4a0",pc((c.done+c.na)/c.count*100),12)}
          <div class="col" style="gap:6px">
            <div><span class="bd b-ok">●</span> Completados <b>${c.done}</b></div>
            <div><span class="bd b-pe">●</span> Pendientes <b>${c.pend}</b></div>
            <div><span class="bd b-na">●</span> No aplica <b>${c.na}</b></div>
          </div>
        </div>
      </div>
      <div class="card"><h3>Por tipo de medida</h3>
        ${bars(["MBA","MBR","MBG"].map(k=>({l:k,v:c.avg[k]===null?0:c.avg[k],c:MEDIDAS[k].c,t:c.avg[k]===null?"Sin dato":pc(c.avg[k])})))}
      </div>
    </div><div class="sp"></div>
    ${c.pend?`<div class="alert r">Indicadores pendientes: ${c.items.filter(x=>x.st==="pe").map(x=>x.i.id).join(", ")}.</div>`
      :'<div class="alert g">Todos los indicadores están diligenciados.</div>'}<div class="sp"></div>
    <div class="row"><button class="btn" onclick="go('evaluacion/${id}/indicadores')">Volver a indicadores</button>
      ${edit?`<button class="btn p right" ${c.pend?"disabled":""} onclick="closeEval('${id}')">Cerrar evaluación</button>`
        :`<button class="btn p right" onclick="go('evaluacion/${id}/resultados')">Ver resultados</button>`}</div>`;
}
function closeEval(id){
  const e=evo(id),c=calc(e);
  if(c.pend){toast("No se puede finalizar: hay indicadores pendientes o con puntuación inválida.");return}
  if(c.gruposSinDato.length){toast("No se puede finalizar: falta puntuación válida en "+c.gruposSinDato.join(", ")+".");return}
  e.est="finalizada";e.up=nowStr();
  audit("Evaluación finalizada: "+pred(e.pid).n);save();toast("Evaluación finalizada");
  if(window.Persistencia)Persistencia.finalizada(e);
  go("evaluacion/"+id+"/resultados");
}
function resultadosRedirect(){
  const L=S.evals.filter(e=>!["en_proceso","borrador"].includes(e.est)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  go(L.length?`evaluacion/${L[0].id}/resultados`:"historial");
  return"";
}

/* ======================= RESULTADOS ======================= */
function resultView(id){
  const e=evo(id);if(!e){go("historial");return""}
  const c=calc(e),p=pred(e.pid),el=eligible(e,c),ls=libScores(c);
  const crit=c.items.filter(x=>x.st==="ok"&&x.r.score===0);
  const mej=c.items.filter(x=>x.st==="ok"&&x.r.score>0&&x.r.score<100);
  const fort=c.items.filter(x=>x.st==="ok"&&x.r.score===100);
  const wr=canWrite()&&!["validada","cerrada"].includes(e.est);
  const acts=`<button class="btn" onclick="go('informe/${id}')">📄 Informe</button>
    ${el.ok?`<button class="btn" onclick="go('certificado/${id}')">🏅 Constancia simulada</button>`:""}
    ${["en_proceso","borrador"].includes(e.est)&&canWrite()?`<button class="btn p" onclick="go('evaluacion/${id}/indicadores')">Continuar</button>`:""}
    ${e.est==="finalizada"&&canVal()?`<button class="btn p" onclick="setEst('${id}','validada')">Validar</button>`:""}
    ${e.est==="validada"&&canVal()?`<button class="btn p" onclick="setEst('${id}','cerrada')">Cerrar</button>`:""}`;
  return head("Resultados",`<b>${esc(p.n)}</b> · ${esc(e.esp)} · ${fd(e.fecha)} · ${esc(e.ev)} · ${stBadge(e.est)}`,acts,
    `<a href="#/historial">Historial</a> / Resultados`)+
    ((!c.isFinal)?`<div class="alert w" style="margin-bottom:16px">${c.pend?`Hay ${c.pend} indicador(es) pendiente(s); el porcentaje de trabajo no es un resultado definitivo.`:`No hay un resultado global calculable: falta puntuación aplicable en ${c.gruposSinDato.join(", ")}.`}</div>`:"")+
    `<div class="cards" style="grid-template-columns:minmax(280px,1fr) 2fr">
      <div class="card" style="text-align:center"><h3>${c.isFinal?"Puntaje global":"Resultado provisional"}</h3>
        ${ring(c.isFinal?c.total:0,180,c.isFinal?COL[c.cls]:"#6b8794",`<span style="font-size:2.2rem;font-weight:700">${c.isFinal?pc(c.total):"—"}</span>`,16)}
        <div style="margin-top:12px;font-size:1.2rem">${badge(c.cls)}</div>
        <div class="small muted" style="margin-top:6px">${c.done+c.na} indicadores evaluados de ${c.count}</div>
      </div>
      <div class="card"><h3>Por tipo de medida</h3>
        <div class="row" style="justify-content:space-around;margin:10px 0">
          ${["MBA","MBR","MBG"].map(k=>`<div style="text-align:center">
            ${ring(c.avg[k]===null?0:c.avg[k],100,MEDIDAS[k].c,c.avg[k]===null?"—":Math.round(c.avg[k]),10)}
            <div style="margin-top:8px"><b>${MEDIDAS[k].n}</b></div>
            <div class="small muted">peso ${c.pesos[k]}%</div></div>`).join("")}
        </div>
        <h3 style="margin-top:14px">Cumplimiento por libertad</h3>
        ${bars(ls.map((x,i)=>({l:["Hambre","Molestias","Dolor","Temor","Comport."][i],v:x.v||0,t:x.v==null?"—":Math.round(x.v)})))}
      </div>
    </div><div class="sp"></div>
    <div class="card"><h3>Diagnóstico automático</h3>
      <div class="cards g2">
        <div><b style="color:var(--turq)">Fortalezas (${fort.length})</b>
          <div class="small muted" style="margin-top:6px">${fort.map(x=>`✔ ${esc(x.i.n)}`).join("<br>")||"—"}</div></div>
        <div><b style="color:var(--warn)">Oportunidades (${mej.length})</b>
          <div class="small muted" style="margin-top:6px">${mej.map(x=>`• ${esc(x.i.n)} (${x.r.score})`).join("<br>")||"—"}</div></div>
      </div>
      <div class="sp"></div>
      ${crit.length?`<div class="alert r"><b>Hallazgos con 0 puntos (${crit.length}):</b><br>
        ${crit.map(x=>`⚠ ${x.i.id} · ${esc(x.i.n)}${x.r.obs?` — <i>${esc(x.r.obs)}</i>`:""}`).join("<br>")}</div>`
        :'<div class="alert g">Sin indicadores críticos (0 puntos).</div>'}
    </div><div class="sp"></div>
    <div class="card"><div class="row"><h3>Recomendaciones</h3>
      ${wr?`<button class="btn s p right" id="gbtn" onclick="genRecs('${id}')">✨ ${e.recs.length?"Regenerar":"Generar"}</button>`:""}
    </div>
    <div class="alert i small">Las recomendaciones se generan con reglas locales como apoyo a la decisión. El evaluador debe revisarlas y ajustarlas.</div>
    <div class="sp"></div>
    ${e.recs.length?e.recs.map((r,k)=>`<div style="margin-bottom:12px">
      <div class="row"><b>${esc(r.id)} · ${esc(r.n)}</b> <span class="bd b-${r.sc===0?"Bajo":r.sc===20?"Medio":"Alto"}">${r.sc} pts</span>
        ${wr?`<button class="btn s d right" onclick="delRec('${id}',${k})">Quitar</button>`:""}</div>
      <textarea class="input" ${wr?"":"disabled"} oninput="evo('${id}').recs[${k}].t=this.value;save()">${esc(r.t)}</textarea>
    </div>`).join(""):'<p class="muted small">Aún no hay recomendaciones.</p>'}
    </div><div class="sp"></div>
    <div class="card"><div class="row"><h3>Plan de mejora</h3>
      ${wr&&e.recs.length?`<button class="btn s right" onclick="makePlan('${id}')">Convertir recomendaciones en plan</button>`:""}
    </div>
    ${e.plan.length?`<div class="tw"><table><tr><th>Acción</th><th>Responsable</th><th>Prioridad</th><th>Plazo</th><th></th></tr>
      ${e.plan.map((a,k)=>`<tr>
        <td><textarea class="input" style="min-height:60px" ${wr?"":"disabled"} oninput="evo('${id}').plan[${k}].a=this.value;save()">${esc(a.a)}</textarea></td>
        <td><input class="input" ${wr?"":"disabled"} value="${esc(a.r)}" oninput="evo('${id}').plan[${k}].r=this.value;save()"></td>
        <td><select class="input" ${wr?"":"disabled"} onchange="evo('${id}').plan[${k}].p=this.value;save()">
          ${["Alta","Media","Baja"].map(x=>`<option ${a.p===x?"selected":""}>${x}</option>`).join("")}</select></td>
        <td><input class="input" type="date" ${wr?"":"disabled"} value="${a.d}" onchange="evo('${id}').plan[${k}].d=this.value;save()"></td>
        <td>${wr?`<button class="btn s d" onclick="evo('${id}').plan.splice(${k},1);save();render()">✕</button>`:""}</td>
      </tr>`).join("")}</table></div>`:'<p class="muted small">Sin acciones.</p>'}
    </div><div class="sp"></div>
    <div class="card"><h3>Constancia académica simulada</h3>
      ${el.ok?`<div class="alert g">Cumple los criterios internos del prototipo para generar una constancia simulada. <a href="#/certificado/${id}">Ver constancia</a></div>`
        :`<div class="alert w">Aún no cumple: ${esc(el.why)}</div>`}
    </div>`;
}
function setEst(id,s){
  const e=evo(id);e.est=s;e.up=nowStr();
  audit(`Evaluación ${ESTADOS[s].toLowerCase()}: ${pred(e.pid).n}`);
  save();
  if(window.Persistencia)Persistencia.estadoCambiado(e,s);
  toast("Estado: "+ESTADOS[s]);render();
}
function genRecs(id){
  const e=evo(id),p=pred(e.pid),b=$("gbtn");
  if(b){b.disabled=true;b.textContent="Generando…"}
  setTimeout(()=>{
    const c=calc(e);
    e.recs=c.items.filter(x=>x.st==="ok"&&x.r.score<100)
      .sort((a,b)=>a.r.score-b.r.score)
      .map(x=>({id:x.i.id,n:x.i.n,sc:x.r.score,
        t:`${x.i.rec} (Contexto: ${e.esp} en ${(p.sis||[]).join(", ")||"sistema no definido"}; resultado actual ${x.r.score}/100.)`}));
    audit("Recomendaciones generadas: "+p.n);save();
    if(window.Persistencia)Persistencia.recomendaciones(e);
    toast(e.recs.length?"Recomendaciones generadas":"Sin hallazgos");render();
  },700);
}
function delRec(id,k){evo(id).recs.splice(k,1);save();render()}
function makePlan(id){
  const e=evo(id),p=pred(e.pid);
  e.plan=e.recs.map(r=>({a:r.t.replace(/ \(Contexto:.*$/,""),r:p.resp,p:r.sc<=20?"Alta":"Media",d:addDays(r.sc===0?30:r.sc===20?60:90)}));
  audit("Plan de mejora creado: "+p.n);save();
  if(window.Persistencia)Persistencia.plan(e);
  toast("Plan creado");render();
}

/* ======================= INFORME / CERTIFICADO ======================= */
function informeView(id){
  const e=evo(id);if(!e){go("historial");return""}
  const c=calc(e),p=pred(e.pid),ls=libScores(c);
  return`<div class="noprint row" style="margin-bottom:14px">
    <button class="btn" onclick="go('evaluacion/${id}/resultados')">← Volver</button>
    <button class="btn p right" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div>
    <div class="paper">
      <div style="border:1px solid #a8c8d0;background:#edf7f8;color:#163742;padding:12px 14px;border-radius:8px;margin-bottom:16px;font-size:.9rem"><b>Prototipo académico independiente.</b> Este documento es una simulación local basada en una metodología pública; no es una certificación ni un informe oficial emitido por el ICA.</div>
      ${!c.isFinal?`<div style="border:1px solid #c58c31;background:#fff7e8;color:#653e00;padding:12px 14px;border-radius:8px;margin-bottom:16px"><b>RESULTADO NO DEFINITIVO.</b> La evaluación está incompleta o no tiene puntuaciones válidas en todos los grupos.</div>`:""}
      <div class="row">
        <img src="Im/Logo.jpg" alt="ICA" style="width:60px;height:60px;object-fit:contain;background:#fff;border-radius:10px;padding:4px">
        <div><h2 style="margin:0">Informe de evaluación de bienestar animal</h2>
          <div style="color:#4b6b78">Bienestar Acuático · Metodología ICA v2.0 (2024)</div></div>
      </div><hr style="border:0;border-top:1px solid #cfe5db;margin:18px 0">
      <table><tr><th>Predio</th><td>${esc(p.n)} (${esc(p.cod)})</td><th>Fecha</th><td>${fd(e.fecha)}</td></tr>
        <tr><th>Responsable</th><td>${esc(p.resp)}</td><th>Evaluador</th><td>${esc(e.ev)}</td></tr>
        <tr><th>Ubicación</th><td>${esc(p.mun)}, ${esc(p.dep)}</td><th>Especie</th><td>${esc(e.esp)}</td></tr>
        <tr><th>Sistema</th><td>${esc((p.sis||[]).join(", "))}</td><th>Modalidad</th><td>${e.reg==="AREL"?"Subsistencia / AREL":"PMG"}</td></tr>
      </table>
      <h2 style="margin-top:20px">Resumen general</h2>
      <p><b style="font-size:1.7rem">${scoreText(c)}</b> — Clasificación: <b>${c.isFinal?c.cls:"Sin clasificación definitiva"}</b>. ${c.done+c.na} de ${c.count} indicadores.</p>
      <table><tr><th>Tipo de medida</th><th>Peso</th><th>Promedio</th><th>Aporte</th></tr>
        ${["MBA","MBR","MBG"].map(k=>`<tr><td>${MEDIDAS[k].full}</td><td>${c.pesos[k]}%</td>
          <td>${c.avg[k]===null?"Sin dato":c.avg[k].toFixed(1)}</td><td>${c.avg[k]===null?"—":(c.avg[k]*c.pesos[k]/100).toFixed(1)}</td></tr>`).join("")}
        <tr><th colspan="3">${c.isFinal?"Puntaje final":"Resultado"}</th><th>${c.isFinal?c.total.toFixed(1)+"%":scoreText(c)}</th></tr>
      </table>
      <h2 style="margin-top:20px">Por libertad</h2>
      <table>${ls.map(x=>`<tr><td>${x.n}</td><td>${x.v==null?"—":x.v.toFixed(0)}</td></tr>`).join("")}</table>
      <h2 style="margin-top:20px">Detalle por indicador</h2>
      <table><tr><th>Código</th><th>Indicador</th><th>Puntaje</th><th>Observaciones</th></tr>
        ${c.items.map(x=>`<tr><td>${x.i.id}</td><td>${esc(x.i.n)}</td>
          <td>${x.st==="ok"?x.r.score:x.st==="na"?"N/A":"Pendiente"}</td>
          <td>${x.r&&x.r.obs?esc(x.r.obs):""}</td></tr>`).join("")}</table>
      ${e.recs.length?`<h2 style="margin-top:20px">Recomendaciones</h2><ol>${e.recs.map(r=>`<li><b>${esc(r.n)}:</b> ${esc(r.t)}</li>`).join("")}</ol>`:""}
      ${e.plan.length?`<h2 style="margin-top:20px">Plan de mejora</h2>
        <table><tr><th>Acción</th><th>Responsable</th><th>Prioridad</th><th>Plazo</th></tr>
          ${e.plan.map(a=>`<tr><td>${esc(a.a)}</td><td>${esc(a.r)}</td><td>${a.p}</td><td>${fd(a.d)}</td></tr>`).join("")}
        </table>`:""}
      <div class="row" style="margin-top:60px;justify-content:space-around">
        <div style="text-align:center;border-top:1px solid #12303c;padding-top:8px;min-width:200px">${esc(e.ev)}<br><small>Evaluador</small></div>
        <div style="text-align:center;border-top:1px solid #12303c;padding-top:8px;min-width:200px">${esc(p.resp)}<br><small>Responsable del predio</small></div>
      </div>
      <p style="font-size:.78rem;color:#4b6b78;margin-top:24px">Documento generado el ${nowStr()}. Las recomendaciones son un apoyo a la decisión revisadas por el evaluador.</p>
    </div>`;
}
function certView(id){
  const e=evo(id);if(!e){go("historial");return""}
  const c=calc(e),p=pred(e.pid),el=eligible(e,c);
  if(!el.ok)return`<div class="alert w">No se puede generar la constancia simulada: ${esc(el.why)}</div>
    <div class="sp"></div><button class="btn" onclick="go('evaluacion/${id}/resultados')">← Volver</button>`;
  return`<div class="noprint row" style="margin-bottom:14px">
    <button class="btn" onclick="go('evaluacion/${id}/resultados')">← Volver</button>
    <button class="btn right" onclick="toast('Constancia simulada; no se envió ningún documento real.')">✉️ Enviar (simulado)</button>
    <button class="btn p" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div>
    <div class="paper"><div style="border:1px solid #a8c8d0;background:#edf7f8;color:#163742;padding:12px 14px;border-radius:8px;margin-bottom:18px;text-align:center"><b>DOCUMENTO SIMULADO · PROYECTO ACADÉMICO</b><br>No constituye una certificación oficial del Instituto Colombiano Agropecuario (ICA).</div><div class="cert">
      <img src="Im/Logo.jpg" alt="Logo de referencia incluido en el prototipo" style="width:70px;height:70px;object-fit:contain;margin:0 auto">
      <p style="letter-spacing:.24em;margin:16px 0 0;color:#1fa87c">BIENESTAR ACUÁTICO</p>
      <h1>Constancia académica de resultados</h1>
      <p>Se deja constancia, únicamente para fines de demostración académica, de los resultados del predio</p>
      <h2>${esc(p.n)}</h2>
      <p>${esc(p.mun)}, ${esc(p.dep)} · Responsable: ${esc(p.resp)}</p>
      <p>obtenidos al diligenciar el prototipo basado en la metodología ICA v2.0 (2024), con un puntaje de</p>
      <p style="font-size:2.6rem;font-weight:700;color:#1fa87c;margin:10px 0">${pc(c.total)} · ${c.cls}</p>
      <p>Evaluación del ${fd(e.fecha)} · Especie: ${esc(e.esp)} · Evaluador: ${esc(e.ev)}</p>
      <p style="font-size:.85rem;color:#4b6b78">Referencia simulada CONST-${e.fecha.slice(0,4)}-${e.id.toUpperCase()} · Generada el ${fd(today())}</p>
    </div></div>`;
}

/* ======================= HISTORIAL ======================= */
function histFiltered(){
  const h=UI.hist;
  return S.evals
    .filter(e=>(!h.pid||e.pid===h.pid)&&(!h.d||e.fecha>=h.d)&&(!h.h||e.fecha<=h.h))
    .filter(e=>(!h.c||calc(e).cls===h.c)&&(!h.q||(pred(e.pid).n+e.ev+e.esp).toLowerCase().includes(h.q.toLowerCase())))
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
function histView(){
  const h=UI.hist,L=histFiltered();
  return head("Historial","Filtra, compara y exporta",
    `<button class="btn" onclick="exportCSV()">⬇ CSV</button>
     <button class="btn p" ${UI.cmp.length===2?"":"disabled"} onclick="compare()">Comparar (${UI.cmp.length}/2)</button>`)+
    `<div class="card" style="margin-bottom:14px">
      <div class="fg" style="grid-template-columns:repeat(5,1fr)">
        <div class="field"><label>Predio</label>
          <select class="input" id="h_p" onchange="hf()"><option value="">Todos</option>
            ${S.predios.map(p=>`<option value="${p.id}" ${h.pid===p.id?"selected":""}>${esc(p.n)}</option>`).join("")}
          </select></div>
        <div class="field"><label>Desde</label><input class="input" type="date" id="h_d" value="${h.d||""}" onchange="hf()"></div>
        <div class="field"><label>Hasta</label><input class="input" type="date" id="h_h" value="${h.h||""}" onchange="hf()"></div>
        <div class="field"><label>Clasificación</label>
          <select class="input" id="h_c" onchange="hf()"><option value="">Todas</option>
            ${["Excelente","Alto","Medio","Bajo"].map(x=>`<option ${h.c===x?"selected":""}>${x}</option>`).join("")}
          </select></div>
        <div class="field"><label>Buscar</label>
          <input class="input" id="h_q" value="${esc(h.q||"")}" oninput="hf(true)" placeholder="Predio, evaluador…"></div>
      </div>
    </div>
    <div class="tw"><table>
      <tr><th></th><th>Fecha</th><th>Predio</th><th>Evaluador</th><th>Puntaje</th><th>Clasificación</th><th>Estado</th><th></th></tr>
      ${L.map(e=>{const c=calc(e);
        return`<tr>
          <td><input type="checkbox" ${UI.cmp.includes(e.id)?"checked":""} onchange="togCmp('${e.id}')" aria-label="Comparar"></td>
          <td>${fd(e.fecha)}</td><td>${esc(pred(e.pid).n)}</td><td>${esc(e.ev)}</td>
          <td><b>${scoreText(c)}</b></td><td>${badge(c.cls)}</td><td>${stBadge(e.est)}</td>
          <td style="white-space:nowrap">
            <button class="btn s" onclick="go('evaluacion/${e.id}/${["en_proceso","borrador"].includes(e.est)?"indicadores":"resultados"}')">Ver</button>
            <button class="btn s" onclick="go('informe/${e.id}')">PDF</button>
          </td></tr>`}).join("")||'<tr><td colspan="8" class="muted">Sin resultados</td></tr>'}
    </table></div>
    <p class="small muted" style="margin-top:8px">Marca dos evaluaciones para compararlas.</p>`;
}
function hf(keep){UI.hist={pid:val("h_p"),d:val("h_d"),h:val("h_h"),c:val("h_c"),q:val("h_q")};if(keep)renderKeep("h_q");else render()}
function togCmp(id){
  const i=UI.cmp.indexOf(id);
  if(i>=0)UI.cmp.splice(i,1);
  else{if(UI.cmp.length>=2)UI.cmp.shift();UI.cmp.push(id)}
  render();
}
function compare(){
  const [a,b]=UI.cmp.map(evo).sort((x,y)=>x.fecha.localeCompare(y.fecha));
  const ca=calc(a),cb=calc(b);
  const d=(x,y)=>{if(x===null||x===undefined||y===null||y===undefined)return'<span class="muted">—</span>';const v=y-x;return`<b style="color:${v>0?"var(--turq)":v<0?"var(--danger)":"var(--muted)"}">${v>0?"+":""}${v.toFixed(1)}</b>`};
  const ch=ca.items.map((x,k)=>({x,y:cb.items[k]})).filter(o=>o.x.st==="ok"&&o.y&&o.y.st==="ok"&&o.x.r.score!==o.y.r.score);
  modal(`<h3>Comparación de evaluaciones</h3>
    <p class="small muted">${esc(pred(a.pid).n)} vs ${esc(pred(b.pid).n)}</p>
    <table><tr><th></th><th>${fd(a.fecha)}</th><th>${fd(b.fecha)}</th><th>Δ</th></tr>
      <tr><td><b>Global</b></td><td>${(ca.isFinal?ca.total.toFixed(1):"—")}%</td><td>${(cb.isFinal?cb.total.toFixed(1):"—")}%</td><td>${d(ca.isFinal?ca.total:null,cb.isFinal?cb.total:null)}</td></tr>
      ${["MBA","MBR","MBG"].map(k=>`<tr><td>${MEDIDAS[k].n}</td>
        <td>${ca.avg[k]===null?"—":ca.avg[k].toFixed(1)}</td><td>${cb.avg[k]===null?"—":cb.avg[k].toFixed(1)}</td><td>${d(ca.avg[k],cb.avg[k])}</td></tr>`).join("")}
    </table>
    <h3 style="margin-top:14px">Indicadores que cambiaron (${ch.length})</h3>
    ${ch.map(o=>`<div class="small" style="padding:4px 0">${o.x.i.id} · ${esc(o.x.i.n)}: ${o.x.r.score} → <b>${o.y.r.score}</b></div>`).join("")||'<p class="muted small">Sin cambios.</p>'}
    <div class="sp"></div><button class="btn" onclick="closeModal()">Cerrar</button>`);
}
function exportCSV(){
  const rows=[["Fecha","Predio","Especie","Evaluador","Modalidad","Puntaje","Clasificación","Estado"]]
    .concat(histFiltered().map(e=>{const c=calc(e);return[e.fecha,pred(e.pid).n,e.esp,e.ev,e.reg,c.isFinal?c.total.toFixed(1):scoreText(c),c.cls,ESTADOS[e.est]]}));
  download("historial_evaluaciones.csv","\ufeff"+rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv");
  toast("CSV exportado");
}

/* ======================= TABLERO ======================= */
function tableroView(){
  const d=UI.dash;
  const L=S.evals.filter(e=>["finalizada","validada","cerrada"].includes(e.est)&&(!d.pid||e.pid===d.pid)&&(!d.esp||e.esp===d.esp)).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const C=L.map(e=>({e,c:calc(e)}));
  const validC=C.filter(x=>x.c.isFinal);const prom=validC.length?validC.reduce((a,x)=>a+x.c.total,0)/validC.length:null,ok=validC.filter(x=>x.c.total>=75).length;
  const W=640,H=200,bw=Math.min(60,(W-60)/Math.max(1,C.length)-10);
  const chart=C.length?`<svg viewBox="0 0 ${W} ${H+40}" class="chart" role="img" aria-label="Puntaje por evaluación">
    <g stroke="#1b3d52">${[0,25,50,75,100].map(v=>`<line x1="40" x2="${W}" y1="${H-v*H/100+10}" y2="${H-v*H/100+10}"/>`).join("")}</g>
    ${[0,50,100].map(v=>`<text x="30" y="${H-v*H/100+14}" fill="#7b98a6" font-size="11" text-anchor="end">${v}</text>`).join("")}
    ${C.map((x,i)=>{const bx=50+i*((W-60)/C.length)+5,h=(x.c.isFinal?x.c.total:0)*H/100;
      return`<rect x="${bx}" y="${H-h+10}" width="${bw}" height="${h}" rx="4" fill="${COL[x.c.cls]}"/>
        <text x="${bx+bw/2}" y="${H-h+4}" fill="#eaf6fb" font-size="11" text-anchor="middle">${Math.round(x.c.isFinal?x.c.total:0)}</text>
        <text x="${bx+bw/2}" y="${H+28}" fill="#7b98a6" font-size="10" text-anchor="middle">${fd(x.e.fecha).slice(0,5)}</text>`}).join("")}
  </svg>`:'<p class="muted">Sin datos para estos filtros.</p>';
  const hall=IND.map(i=>{
    const s=C.map(x=>x.c.items.find(y=>y.i.id===i.id)).filter(y=>y&&y.st==="ok").map(y=>y.r.score);
    return{i,n:s.length,avg:s.length?s.reduce((a,b)=>a+b,0)/s.length:null,low:s.filter(v=>v<=20).length};
  }).filter(x=>x.avg!==null).sort((a,b)=>a.avg-b.avg).slice(0,5);
  return head("Tablero","Resultados agregados por predio y especie")+
    `<div class="row" style="margin-bottom:14px">
      <div class="field"><label>Predio</label>
        <select class="input" onchange="UI.dash.pid=this.value;render()">
          <option value="">Todos</option>${S.predios.map(p=>`<option value="${p.id}" ${d.pid===p.id?"selected":""}>${esc(p.n)}</option>`).join("")}
        </select></div>
      <div class="field"><label>Especie</label>
        <select class="input" onchange="UI.dash.esp=this.value;render()">
          <option value="">Todas</option>${S.esp.map(p=>`<option ${d.esp===p.n?"selected":""}>${p.n}</option>`).join("")}
        </select></div>
    </div>
    <div class="cards g4">
      <div class="card kpi"><b>${C.length}</b><span>Evaluaciones completadas</span></div>
      <div class="card kpi"><b>${prom===null?"—":pc(prom)}</b><span>Puntaje promedio válido</span></div>
      <div class="card kpi"><b>${C.length?pc(ok/C.length*100):"—"}</b><span>Alto o Excelente</span></div>
      <div class="card kpi"><b>${C.reduce((a,x)=>a+x.c.items.filter(y=>y.st==="ok"&&y.r.score===0).length,0)}</b><span>Hallazgos críticos</span></div>
    </div><div class="sp"></div>
    <div class="card"><h3>Puntaje por evaluación</h3>${chart}</div><div class="sp"></div>
    <div class="cards g2">
      <div class="card"><h3>Promedio por tipo de medida</h3>
        ${bars(["MBA","MBR","MBG"].map(k=>{const vals=C.map(x=>x.c.avg[k]).filter(v=>v!==null);const v=vals.length?vals.reduce((a,x)=>a+x,0)/vals.length:0;return{l:k,v,c:MEDIDAS[k].c,t:vals.length?Math.round(v):"—"}}))}
        <h3 style="margin-top:14px">Distribución por clasificación</h3>
        ${bars(["Excelente","Alto","Medio","Bajo"].map(k=>({l:k,v:C.filter(x=>x.c.cls===k).length,c:COL[k],t:C.filter(x=>x.c.cls===k).length})),Math.max(1,C.length))}
      </div>
      <div class="card"><h3>Indicadores con menor cumplimiento</h3>
        ${hall.map(x=>`<div class="li static">
          <div style="flex:1"><b>${x.i.id}</b> · ${esc(x.i.n)}
            <div class="tiny muted">${x.n} evaluaciones · ${x.low} con ≤ 20 pts</div></div>
          <b>${Math.round(x.avg)}</b></div>`).join("")||'<p class="muted small">Sin datos.</p>'}
      </div>
    </div>`;
}

/* ======================= ESPECIES ======================= */
function especiesView(){
  return head("Tipos de especies","Catálogo con parámetros de referencia")+
    `<div class="cards g2">${S.esp.map(s=>`<div class="card">
      <div class="sp-thumb"><div class="sc-host" data-scene="${/trucha/i.test(s.n)?"cold":/cachama/i.test(s.n)?"jungle":"pond"}"></div></div>
      <div class="row"><h3>🐠 ${esc(s.n)}</h3>
        <span class="right">${s.act?'<span class="bd b-ok">Activa</span>':'<span class="bd b-na">Inactiva</span>'}</span></div>
      <div class="cards g2 small" style="margin-top:10px">
        <div><span class="muted">Temperatura:</span> ${s.temp}</div>
        <div><span class="muted">Oxígeno:</span> ${s.od}</div>
        <div><span class="muted">pH:</span> ${s.ph}</div>
        <div><span class="muted">Turbidez:</span> ${s.turb}</div>
        <div class="full"><span class="muted">Mortalidad máx.:</span> ${s.mort}</div>
      </div>
      ${isAdm()?`<div class="sp"></div><button class="btn s" onclick="togEsp('${s.id}')">${s.act?"Desactivar":"Activar"}</button>`:""}
    </div>`).join("")}</div>
    <p class="small muted" style="margin-top:14px">Valores tomados de las Tablas 6, 23 y 35 de la metodología.</p>`;
}
function togEsp(id){const s=S.esp.find(x=>x.id===id);s.act=!s.act;audit(`Especie ${s.act?"activada":"desactivada"}: ${s.n}`);save();render()}

/* ======================= CONFIGURACIÓN ======================= */
function configView(){
  const u=me();
  return head("Configuración","Perfil y parámetros del sistema")+
    `<div class="cards g2">
      <div class="card"><h3>Mi perfil</h3>
        <div class="small"><div><span class="muted">Nombre:</span> ${esc(u.n)}</div>
          <div><span class="muted">Correo:</span> ${esc(u.e)}</div>
          <div><span class="muted">Rol:</span> ${ROLES[u.r].n}</div></div>
        <div class="sp"></div><button class="btn" onclick="chPass()">Cambiar contraseña</button>
      </div>
      <div class="card"><h3>Ponderación por tipo de medida</h3>
        ${["PMG","AREL"].map(r=>`<div class="row" style="margin-bottom:8px"><b style="width:60px">${r}</b>
          ${["MBR","MBA","MBG"].map(k=>`<div class="field" style="width:90px"><label>${k}</label>
            <input class="input" type="number" min="0" max="100" id="w_${r}_${k}" value="${S.pesos[r][k]}" ${isAdm()?"":"disabled"}></div>`).join("")}
        </div>`).join("")}
        ${isAdm()?`<div id="werr2" class="err"></div><button class="btn p" onclick="savePesos()">Guardar</button>`:""}
      </div>
    </div>
    <div class="sp"></div>
    <div class="cards g2">
      <div class="card"><h3>Clasificación</h3>
        ${[["Excelente","≥ 90%"],["Alto","≥ 75% y < 90%"],["Medio","≥ 50% y < 75%"],["Bajo","< 50%"]].map(x=>
          `<div class="li static">${badge(x[0])}<span class="right">${x[1]}</span></div>`).join("")}
      </div>
      <div class="card"><h3>Backup local</h3>
        <p class="small muted">Exporta o restaura todos los datos guardados en este navegador.</p>
        <div class="row">
          <button class="btn" onclick="exportBackup()">⬇ Exportar JSON</button>
          <label class="btn" style="cursor:pointer">⬆ Importar JSON
            <input type="file" accept=".json" style="display:none" onchange="doImport(this)"></label>
        </div>
        ${isAdm()?`<div class="sp"></div>
          <button class="btn d" onclick="confirmBox('Se borrarán todos los datos y volverá la demo. ¿Continuar?',()=>{resetAll();S.sess=S.users[0].id;save();toast('Datos restablecidos');go('inicio')})">Restablecer datos</button>`:""}
      </div>
    </div>
    <div class="sp"></div>
    ${persistenciaCard()}`;
}
/* Tarjeta de estado de la persistencia (localStorage ↔ API PostgreSQL). */
function persistenciaCard(){
  const P=window.Persistencia;
  if(!P)return "";
  const st=P.estado();
  const activa=P.esApi();
  return `<div class="card"><div class="row"><h3>Persistencia y servidor</h3>
      <span class="right">${activa?'<span class="bd b-ok">API activa</span>':(st.online?'<span class="bd b-Medio">API en espera</span>':'<span class="bd b-na">Modo local</span>')}</span></div>
    <div class="small" style="margin-top:6px">
      <div><span class="muted">Modo configurado:</span> ${esc(APP_CONFIG.MODO)}</div>
      <div><span class="muted">URL de la API:</span> ${esc(APP_CONFIG.API_URL)}</div>
      <div><span class="muted">Base de datos:</span> ${activa?"PostgreSQL (servidor)":"localStorage + IndexedDB"}</div>
      ${st.usuarioApi?`<div><span class="muted">Sesión API:</span> ${esc(st.usuarioApi.nombre||st.usuarioApi.email||"")}</div>`:""}
      ${st.ultimaSync?`<div><span class="muted">Última sincronización:</span> ${esc(new Date(st.ultimaSync).toLocaleString("es-CO"))}</div>`:""}
    </div>
    <div class="sp"></div>
    <div class="row">
      <button class="btn" onclick="probarApi()">Probar conexión</button>
      ${isAdm()?`<button class="btn p" onclick="subirDatos()">⬆ Subir datos locales al servidor</button>`:""}
    </div>
    <div id="apimsg" class="small muted" style="margin-top:8px"></div>
    ${st.avisos.length?`<details style="margin-top:10px"><summary class="small muted">Registro de sincronización (${st.avisos.length})</summary>
      <div class="small muted" style="max-height:180px;overflow:auto;margin-top:6px">
        ${st.avisos.map(a=>`<div>${esc(a.t)} · ${esc(a.m)}</div>`).join("")}</div></details>`:""}
  </div>`;
}
async function probarApi(){
  const el=$("apimsg");if(el)el.textContent="Comprobando…";
  const st=await Persistencia.iniciar();
  if(el)el.textContent=st.online?"✔ El servidor responde. Sincronización activa.":"✖ No se pudo contactar la API. Revisa que el backend y PostgreSQL estén en ejecución.";
  render();
}
async function subirDatos(){
  const el=$("apimsg");if(el)el.textContent="Subiendo datos…";
  try{
    const r=await Persistencia.subirTodo();
    toast(`Sincronizado: ${r.predios} predios, ${r.evaluaciones} evaluaciones`);
    if(el)el.textContent=r.errores.length?"Sincronizado con avisos:\n"+r.errores.join("\n"):"✔ Datos sincronizados con el servidor.";
  }catch(e){toast("No fue posible sincronizar: "+(e.message||e));if(el)el.textContent="✖ "+(e.message||e);}
}
function savePesos(){
  const o={};
  for(const r of["PMG","AREL"]){
    o[r]={};let s=0;
    for(const k of["MBR","MBA","MBG"]){o[r][k]=+val(`w_${r}_${k}`);s+=o[r][k]}
    if(s!==100){$("werr2").textContent=`${r} debe sumar 100 (suma ${s}).`;return}
  }
  S.pesos=o;audit("Ponderaciones actualizadas");save();toast("Ponderaciones guardadas");
}
function chPass(){
  modal(`<h3>Cambiar contraseña</h3>
    <div class="field"><label>Contraseña actual</label><input class="input" type="password" id="cp0"></div>
    <div class="field"><label>Nueva contraseña (mín. 4)</label><input class="input" type="password" id="cp1"></div>
    <div id="cperr" class="err"></div>
    <div class="row" style="justify-content:flex-end">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn p" onclick="doPass()">Guardar</button>
    </div>`);
}
function doPass(){
  const u=me();
  if($("cp0").value!==u.p){$("cperr").textContent="Contraseña actual incorrecta.";return}
  if($("cp1").value.length<4){$("cperr").textContent="Contraseña muy corta.";return}
  u.p=$("cp1").value;audit("Contraseña cambiada");save();closeModal();toast("Contraseña actualizada");
}
function doImport(inp){
  const f=inp.files[0];if(!f)return;
  importBackup(f,ok=>{
    if(ok){toast("Datos restaurados");go("inicio");render()}
    else toast("Archivo inválido");
  });
}

/* ======================= ADMINISTRACIÓN ======================= */
function adminView(){
  const t=UI.adm;let b="";
  if(t==="usuarios")b=`<div class="row" style="margin-bottom:12px">
    <span class="muted small">Gestiona usuarios y roles</span>
    <button class="btn p right" onclick="userForm()">+ Nuevo usuario</button></div>
    <div class="tw"><table><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr>
      ${S.users.map(u=>`<tr><td>${esc(u.n)}</td><td>${esc(u.e)}</td><td>${ROLES[u.r].n}</td>
        <td>${u.a?'<span class="bd b-ok">Activo</span>':'<span class="bd b-na">Inactivo</span>'}</td>
        <td style="white-space:nowrap"><button class="btn s" onclick="userForm('${u.id}')">Editar</button>
          <button class="btn s" onclick="togUser('${u.id}')">${u.a?"Inactivar":"Activar"}</button></td></tr>`).join("")}
    </table></div>`;
  if(t==="roles")b=`<div class="cards g2">${Object.entries(ROLES).map(([k,r])=>`<div class="card">
    <h3>${r.n}</h3><p class="small muted">${r.d}</p>
    <ul class="small" style="margin:0;padding-left:18px">${r.p.map(x=>`<li>${x}</li>`).join("")}</ul>
    <span class="small muted">${S.users.filter(u=>u.r===k).length} usuario(s)</span></div>`).join("")}</div>`;
  if(t==="catalogos")b=`<div class="cards g2">
    <div class="card"><h3>Tipos de productor</h3>${TIPOS_PRODUCTOR.map(x=>`<div class="li static">${x}</div>`).join("")}</div>
    <div class="card"><h3>Sistemas productivos</h3>${SISTEMAS.map(x=>`<div class="li static">${x}</div>`).join("")}</div>
    <div class="card"><h3>Estados</h3>${Object.values(ESTADOS).map(x=>`<div class="li static">${x}</div>`).join("")}</div>
    <div class="card"><h3>Departamentos y municipios</h3>
      ${Object.entries(DEPTOS).map(([d,m])=>`<div class="li static">${d}<span class="right small muted">${m.length} municipios</span></div>`).join("")}
    </div></div>`;
  if(t==="auditoria")b=`<div class="tw"><table><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th></tr>
    ${S.audit.map(a=>`<tr><td class="small">${esc(a.t)}</td><td>${esc(a.u)}</td><td>${esc(a.a)}</td></tr>`).join("")}
  </table></div>`;
  return head("Administración","Usuarios, roles, catálogos y auditoría")+
    `<div class="tabs">${[["usuarios","Usuarios"],["roles","Roles"],["catalogos","Catálogos"],["auditoria","Auditoría"]]
      .map(x=>`<button class="${t===x[0]?"on":""}" onclick="UI.adm='${x[0]}';render()">${x[1]}</button>`).join("")}
    </div>${b}`;
}
function userForm(id){
  const u=S.users.find(x=>x.id===id)||{n:"",e:"",p:"",r:"evaluador",a:true};
  window.__uid=id||null;
  modal(`<h3>${id?"Editar":"Nuevo"} usuario</h3>
    <div class="field"><label>Nombre *</label><input class="input" id="un" value="${esc(u.n)}"></div>
    <div class="field"><label>Correo *</label><input class="input" type="email" id="ue" value="${esc(u.e)}"></div>
    <div class="field"><label>Rol *</label><select class="input" id="ur">
      ${Object.entries(ROLES).map(([k,r])=>`<option value="${k}" ${u.r===k?"selected":""}>${r.n}</option>`).join("")}
    </select></div>
    <div class="field"><label>Contraseña ${id?"(dejar vacío para no cambiar)":"*"}</label><input class="input" type="password" id="up"></div>
    <label class="chk"><input type="checkbox" id="ua" ${u.a?"checked":""}>Usuario activo</label>
    <div id="uerr" class="err"></div><div class="sp"></div>
    <div class="row" style="justify-content:flex-end">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn p" onclick="saveUser()">Guardar</button>
    </div>`);
}
function saveUser(){
  const id=window.__uid,n=val("un"),e=val("ue"),r=val("ur"),p=$("up").value,a=$("ua").checked;
  if(!n||!/^\S+@\S+\.\S+$/.test(e)){$("uerr").textContent="Nombre y correo válido son obligatorios.";return}
  if(S.users.some(x=>x.e.toLowerCase()===e.toLowerCase()&&x.id!==id)){$("uerr").textContent="Correo ya en uso.";return}
  if(!id&&p.length<4){$("uerr").textContent="Contraseña mín. 4 caracteres.";return}
  if(id){const u=S.users.find(x=>x.id===id);Object.assign(u,{n,e,r,a});if(p)u.p=p;audit("Usuario editado: "+n)}
  else{S.users.push({id:uid("u"),n,e,r,a,p});audit("Usuario creado: "+n);
    if(window.Persistencia)Persistencia.usuarioGuardado(null,{nombre:n,email:e,password:p,rol:r,activo:a});}
  save();closeModal();toast("Usuario guardado");render();
}
function togUser(id){
  const u=S.users.find(x=>x.id===id);
  if(u.id===S.sess){toast("No puedes inactivar tu propio usuario");return}
  u.a=!u.a;audit(`Usuario ${u.a?"activado":"inactivado"}: ${u.n}`);save();render();
}

/* ======================= CONÓCENOS / AYUDA ======================= */
function conocenosView(){
  return head("Conócenos","Acerca de la plataforma")+
    `<div class="cards g2">
      <div class="card"><h3>¿Qué es Bienestar Acuático?</h3>
        <p class="small muted">Aplicación web para evaluar el bienestar animal en predios de producción de peces para consumo humano. Apoya la evaluación académica de bienestar animal: registra predios, organiza indicadores, calcula puntajes y genera recomendaciones e informes y constancias simuladas. No es una herramienta oficial del ICA.</p></div>
      <div class="card"><h3>Metodología</h3>
        <p class="small muted">Basada en la metodología del ICA (v2.0, 2024) elaborada con FEDEACUA, Universidad Antonio Nariño, Universidad Nacional y AGROSAVIA.</p></div>
    </div><div class="sp"></div>
    <div class="card"><h3>Cinco libertades del bienestar animal</h3>
      <div class="tag-row">${LIBERTADES.map(l=>`<span class="tag papaya">${l}</span>`).join("")}</div></div><div class="sp"></div>
    <div class="cards g3">
      <div class="card"><h3>3 tipos de medida</h3><p class="small muted">Recursos (entorno), animal (estado de los peces) y gestión (procedimientos del productor).</p></div>
      <div class="card"><h3>Arquitectura propuesta</h3><p class="small muted">Frontend SPA con JavaScript vanilla. Persistencia local con localStorage e IndexedDB.</p></div>
      <div class="card"><h3>Este prototipo</h3><p class="small muted">Prototipo académico. Los datos se guardan en el navegador; no hay servidor remoto.</p></div>
    </div>`;
}
function ayudaView(){
  return head("Ayuda","Preguntas frecuentes y guía de calificación",`<a class="btn p s" href="${PDF_URL}" target="_blank" rel="noopener">Metodología ICA (PDF) ↗</a>`)+
    `<div class="faq">${AYUDA.map(a=>`<details><summary>${a[0]}</summary><p class="muted">${a[1]}</p></details>`).join("")}</div>
    <div class="sp"></div>
    <div class="card"><h3>Escala de puntos por indicador</h3>
      <div class="cards g4">
        <div><b style="color:var(--turq);font-size:1.4rem">100</b><div class="small muted">Cumple totalmente</div></div>
        <div><b style="color:var(--blue);font-size:1.4rem">55</b><div class="small muted">Cumple en gran parte</div></div>
        <div><b style="color:var(--warn);font-size:1.4rem">20</b><div class="small muted">Cumple parcialmente</div></div>
        <div><b style="color:var(--danger);font-size:1.4rem">0</b><div class="small muted">No cumple</div></div>
      </div></div>
    <div class="sp"></div>
    <div class="card"><h3>Flujo de una evaluación</h3>
      <ol class="small" style="padding-left:20px">
        <li>Registra o selecciona el predio.</li>
        <li>Crea la evaluación: datos, lotes a muestrear e información de los peces.</li>
        <li>Diligencia los indicadores (recursos, animal y gestión) con observaciones y evidencias.</li>
        <li>Revisa el resumen y cierra la evaluación.</li>
        <li>Consulta resultados y plan de mejora; genera informe y constancia académica simulada.</li>
        <li>El docente valida y cierra.</li>
      </ol></div>`;
}

/* ======================= RENDER ======================= */
function render(){_render();if(window.FX)FX.afterRender()}
function _render(){
  const y=window.scrollY;
  const h=(location.hash.slice(2)||"").split("/"),r=h[0];
  // Landing pública
  if(!S.sess){
    if(r==="ingresar"){$("app").innerHTML=loginView();return}
    if(r==="registro"){$("app").innerHTML=registerView();return}
    if(r==="ayuda"){$("app").innerHTML=pubPage(ayudaView(),"Ayuda");return}
    if(r==="conocenos"){$("app").innerHTML=pubPage(conocenosView(),"Conócenos");return}
    $("app").innerHTML=landingView();return;
  }
  if(r==="ingresar"||r==="registro"||!r){location.hash="#/inicio";return}
  let v="";
  switch(r){
    case"inicio":v=inicioView();break;
    case"predios":v=h[1]==="form"?predioForm():prediosView();break;
    case"evaluaciones":v=evaluacionesView();break;
    case"evaluacion":
      if(h[1]==="nueva"){v=canWrite()?evalWizard():(go("inicio"),"")}
      else if(h[2]==="indicadores")v=indListView(h[1]);
      else if(h[2]==="indicador")v=indView(h[1],h[3]);
      else if(h[2]==="resumen")v=resumenView(h[1]);
      else if(h[2]==="resultados")v=resultView(h[1]);
      else v=(go("inicio"),"");
      break;
    case"resultados":v=resultadosRedirect();break;
    case"informe":v=informeView(h[1]);break;
    case"certificado":v=certView(h[1]);break;
    case"historial":v=histView();break;
    case"tablero":v=tableroView();break;
    case"especies":v=especiesView();break;
    case"administracion":v=isAdm()?adminView():(go("inicio"),"");break;
    case"configuracion":v=configView();break;
    case"conocenos":v=conocenosView();break;
    case"ayuda":v=ayudaView();break;
    default:v=(go("inicio"),"");
  }
  const act=["informe","certificado","evaluacion"].includes(r)
    ?(r==="evaluacion"?(h[1]==="nueva"?"evaluacion":"evaluaciones"):"historial")
    :r;
  $("app").innerHTML=shell(v,act);
  window.scrollTo(0,y);
}
window.addEventListener("hashchange",()=>{
  const run=()=>{render();window.scrollTo(0,0)};
  if(window.FX)FX.transition(run);else run();
});
document.addEventListener("click",e=>{
  const d=$("notdd");
  if(d&&d.innerHTML&&!e.target.closest(".dd")&&!e.target.closest("[aria-label='Notificaciones']"))d.innerHTML="";
});
load();render();

/* Inicializa la capa de persistencia (modo local | api | auto). */
if(window.Persistencia){
  Persistencia.iniciar().then(st=>{
    if(st&&st.apiActiva)console.info("[Persistencia] API activa:",APP_CONFIG.API_URL);
    render();
  });
}
/* Revisa el estado de conexión periódicamente (sin re-renderizar para no
   interrumpir formularios). El indicador se actualiza al navegar. */
if(window.Persistencia&&APP_CONFIG.MODO!=="local"){
  setInterval(()=>{Persistencia.iniciar()},60000);
}