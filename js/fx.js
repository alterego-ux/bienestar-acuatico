/* =====================================================================
   BIENESTAR ACUÁTICO · Efectos visuales
   Precarga · cursor · fondos que cambian · transiciones · scroll · revelado
   ===================================================================== */
(function(){
"use strict";

const $  = (s,r)=> (r||document).querySelector(s);
const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));
const reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const fine   = !!(window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches);
const rnd = (a,b)=> a + Math.random()*(b-a);
const FX = window.FX = { pending:null, _stages:[], _route:null, _busy:false };

/* ------------------------------------------------------------------
   ESCENAS SUBMARINAS (CSS + SVG) — siempre se ven, con o sin fotos
------------------------------------------------------------------ */
function buildScene(kind){
  const el = document.createElement("div");
  el.className = "sc sc-" + kind;
  let h = '<div class="sc-rays"><i></i><i></i><i></i><i></i></div><div class="sc-caustic"></div>';
  const n = kind==="abyss" ? 16 : (kind==="pond"||kind==="jungle" ? 9 : 11);
  let fish = "";
  for(let i=0;i<n;i++){
    const s=rnd(.5,2.1), y=rnd(8,86), d=rnd(28,62)/(s*.55+.45), dl=-rnd(0,60), o=rnd(.10,.42);
    fish += `<svg class="f${i%5===0?" r":""}" viewBox="0 0 120 50" style="--y:${y.toFixed(1)}%;--s:${s.toFixed(2)};--d:${d.toFixed(1)}s;--dl:${dl.toFixed(1)}s;--o:${o.toFixed(2)};--b:${(2.2-s).toFixed(1)}px"><use href="#fish"/></svg>`;
  }
  h += `<div class="sc-school">${fish}</div>`;
  let b = "";
  for(let i=0;i<22;i++){
    const sz=rnd(3,12);
    b += `<span style="left:${rnd(0,100).toFixed(1)}%;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;animation-duration:${rnd(9,22).toFixed(1)}s;animation-delay:${(-rnd(0,20)).toFixed(1)}s"></span>`;
  }
  h += `<div class="sc-bubbles">${b}</div>`;
  if(kind==="pond"||kind==="jungle") h += '<div class="sc-ripples"><i></i><i></i><i></i></div>';
  el.innerHTML = h;
  return el;
}

function loadFirst(srcs){
  return new Promise(res=>{
    let i=0;
    const next=()=>{
      if(i>=srcs.length) return res(null);
      const u=srcs[i++], im=new Image();
      im.onload=()=>res(u); im.onerror=next; im.src=u;
    };
    next();
  });
}

/* ------------------------------------------------------------------
   STAGE: fondos que cambian (hero grande o versión mini)
------------------------------------------------------------------ */
function mkStage(host){
  const isHero = host.dataset.stage === "hero";
  const loc = (typeof FONDOS_LOCALES!=="undefined" ? FONDOS_LOCALES : []);
  const std = (typeof FONDOS!=="undefined" ? FONDOS : []);
  const base = loc.map(x=>Object.assign({scene:"deep"},x)).concat(std);
  const items = (isHero ? base : base.slice(0,3)).map(x=>Object.assign({},x,{src: x.src ? [].concat(x.src) : []}));
  if(!items.length) return;

  host.innerHTML = "";
  const slides = items.map(it=>{
    const s=document.createElement("div"); s.className="slide";
    const m=document.createElement("div"); m.className="media";
    m.appendChild(buildScene(it.scene||"abyss"));
    s.appendChild(m); host.appendChild(s);
    if(it.src.length){
      loadFirst(it.src).then(u=>{
        if(!u || !host.isConnected) return;
        const p=document.createElement("div"); p.className="photo";
        p.style.backgroundImage=`url("${u}")`;
        m.appendChild(p);
        requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add("in")));
      });
    }
    return s;
  });

  const DUR = isHero ? 6800 : 7600;
  const root = isHero ? host.closest("[data-hero]") : null;
  const dotsBox = root && $("[data-dots]",root);
  const cap = root ? {
    k:$("[data-cap-k]",root), t:$("[data-cap-t]",root), s:$("[data-cap-s]",root), d:$("[data-cap-d]",root), box:$(".h-cap",root)
  } : null;
  let cur=-1, timer=null, paused=false;

  if(dotsBox){
    dotsBox.style.setProperty("--dur",DUR+"ms");
    dotsBox.innerHTML = items.map((it,i)=>`<button type="button" class="dot" aria-label="Escena ${i+1}: ${it.t||""}" data-i="${i}"><u></u></button>`).join("");
    dotsBox.addEventListener("click",e=>{
      const b=e.target.closest(".dot"); if(b) go(+b.dataset.i,true);
    });
  }

  function schedule(){
    clearTimeout(timer);
    if(reduce || paused) return;
    timer=setTimeout(()=>go(cur+1),DUR);
  }
  function go(n){
    n=(n+slides.length)%slides.length;
    if(n===cur) return;
    slides.forEach((s,i)=>{
      s.classList.toggle("on",i===n);
      s.classList.toggle("was",i===cur);
    });
    cur=n;
    if(dotsBox){
      $$(".dot",dotsBox).forEach((d,i)=>{
        d.classList.remove("on","past");
        if(i<n) d.classList.add("past");
      });
      const d=$$(".dot",dotsBox)[n]; void d.offsetWidth; d.classList.add("on");
    }
    if(cap){
      const it=items[n];
      cap.box && (cap.box.classList.remove("chg"), void cap.box.offsetWidth, cap.box.classList.add("chg"));
      cap.k && (cap.k.textContent=String(n+1).padStart(2,"0"));
      cap.t && (cap.t.textContent=it.t||"");
      cap.s && (cap.s.textContent=it.sub||"");
      cap.d && (cap.d.textContent=it.dato||"");
    }
    schedule();
  }
  go(0);

  const api = {
    next(){go(cur+1)}, prev(){go(cur-1)},
    pause(){paused=true;clearTimeout(timer)}, resume(){paused=false;schedule()},
    destroy(){clearTimeout(timer)}, hero:isHero, root:root
  };
  FX._stages.push(api);

  if(root){
    let x0=null;
    root.addEventListener("pointerdown",e=>{ if(!e.target.closest("a,button")) x0=e.clientX; });
    root.addEventListener("pointerup",e=>{
      if(x0===null) return;
      const dx=e.clientX-x0; x0=null;
      if(Math.abs(dx)>60) dx<0 ? api.next() : api.prev();
    });
    root.addEventListener("mousemove",e=>{
      if(!fine||reduce) return;
      const r=root.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
      const t=$(".h-title",root), st=host;
      if(t) t.style.translate=`${(px*-26).toFixed(1)}px ${(py*-14).toFixed(1)}px`;
      st.style.setProperty("--px",(px*18).toFixed(1)+"px");
      st.style.setProperty("--py",(py*12).toFixed(1)+"px");
    });
  }
}

FX.hydrate = function(root){
  root = root || document;
  $$("[data-scene]",root).forEach(h=>{ if(!h.firstChild) h.appendChild(buildScene(h.dataset.scene)); });
  $$("[data-stage]",root).forEach(h=>{ if(h.dataset.on) return; h.dataset.on="1"; mkStage(h); });
  $$("[data-hero]",root).forEach(heroPlankton);
};

/* ------------------------------------------------------------------
   PLANCTON BIOLUMINISCENTE (Fase 12) — capa de partículas del hero
   Se añade una sola vez por hero y se apaga con prefers-reduced-motion.
------------------------------------------------------------------ */
function heroPlankton(host){
  if(reduce) return;
  if(!host || host.querySelector(".fx-plankton")) return;
  const colores=["#22e0d6","#7dff9c","#ff3df0","#4aa3ff"];
  const N = (window.innerWidth||0) < 700 ? 14 : 30;
  let h="";
  for(let i=0;i<N;i++){
    const s=rnd(2,7), x=rnd(0,100), d=rnd(10,24), dl=-rnd(0,26), o=rnd(.20,.70),
          c=colores[(Math.random()*colores.length)|0];
    h+=`<i style="--x:${x.toFixed(1)}%;--s:${s.toFixed(1)}px;--d:${d.toFixed(1)}s;--dl:${dl.toFixed(1)}s;--o:${o.toFixed(2)};--c:${c}"></i>`;
  }
  const box=document.createElement("div");
  box.className="fx-plankton";
  box.setAttribute("aria-hidden","true");
  box.innerHTML=h;
  host.appendChild(box);
}

document.addEventListener("visibilitychange",()=>{
  FX._stages.forEach(s=> document.hidden ? s.pause() : s.resume());
});
document.addEventListener("keydown",e=>{
  if(/input|textarea|select/i.test((e.target.tagName||""))) return;
  const h=FX._stages.find(s=>s.hero && s.root && s.root.isConnected);
  if(!h) return;
  const r=h.root.getBoundingClientRect();
  if(r.bottom<80||r.top>innerHeight*.6) return;
  if(e.key==="ArrowRight") h.next();
  if(e.key==="ArrowLeft")  h.prev();
});

/* ------------------------------------------------------------------
   REVELADO AL HACER SCROLL + CONTADORES
------------------------------------------------------------------ */
let io=null;
function countUp(el){
  if(el.dataset.done) return; el.dataset.done="1";
  const to=+el.dataset.count||0, suf=el.dataset.suf||"";
  if(reduce){ el.textContent=to+suf; return; }
  const t0=performance.now(), D=1400;
  (function tick(t){
    const p=Math.min(1,(t-t0)/D), e=1-Math.pow(1-p,3);
    el.textContent=Math.round(to*e)+suf;
    if(p<1) requestAnimationFrame(tick);
  })(t0);
}
function observe(){
  const els=$$("[data-r]:not(.in)");
  const reveal=el=>{
    el.classList.add("in");
    if(el.hasAttribute("data-count")) countUp(el);
    $$("[data-count]",el).forEach(countUp);
  };
  if(!("IntersectionObserver" in window) || reduce){ els.forEach(reveal); return; }
  if(!io){
    io=new IntersectionObserver(es=>{
      es.forEach(en=>{
        if(!en.isIntersecting) return;
        const el=en.target, d=(+el.dataset.d||0)*110;
        io.unobserve(el);
        setTimeout(()=>reveal(el),d);
      });
    },{threshold:.12,rootMargin:"0px 0px -5% 0px"});
  }
  els.forEach(e=>io.observe(e));
}

/* ------------------------------------------------------------------
   SCROLL: progreso, nav, parallax, scrollspy
------------------------------------------------------------------ */
let ticking=false;
function frame(){
  ticking=false;
  const y=window.scrollY, H=document.documentElement.scrollHeight-innerHeight;
  const prog=$("#prog"); if(prog) prog.style.transform=`scaleX(${H>0?Math.min(1,y/H):0})`;
  const tt=$("#toTop"); if(tt) tt.classList.toggle("show",y>700);
  const nav=$("#lnav"); if(nav) nav.classList.toggle("solid",y>40);

  if(!reduce){
    $$("[data-par]").forEach(el=>{
      const box=el.parentElement.getBoundingClientRect();
      if(box.bottom<-100||box.top>innerHeight+100) return;
      const k=parseFloat(el.dataset.par)||.08;
      el.style.transform=`translate3d(0,${(((box.top+box.height/2)-innerHeight/2)*-k).toFixed(1)}px,0) scale(1.14)`;
    });
    const hi=$(".l-hero .h-inner");
    if(hi && y<innerHeight*1.2){
      const p=Math.min(1,y/(innerHeight*.9));
      hi.style.transform=`translate3d(0,${(y*.22).toFixed(1)}px,0)`;
      hi.style.opacity=String(1-p*1.15);
      const st=$(".l-hero .stage"); if(st) st.style.transform=`translate3d(0,${(y*.12).toFixed(1)}px,0)`;
    }
  }
}
window.addEventListener("scroll",()=>{ if(!ticking){ticking=true;requestAnimationFrame(frame)} },{passive:true});
window.addEventListener("resize",()=>requestAnimationFrame(frame));

let spy=null;
function scrollSpy(){
  if(spy){spy.disconnect();spy=null}
  const secs=$$("main section[id]").filter(s=>$(`.l-links [data-scroll="${s.id}"]`));
  if(!secs.length||!("IntersectionObserver" in window)) return;
  spy=new IntersectionObserver(es=>{
    es.forEach(en=>{
      if(!en.isIntersecting) return;
      $$(".l-links a").forEach(a=>a.classList.toggle("on",a.dataset.scroll===en.target.id));
    });
  },{rootMargin:"-45% 0px -50% 0px"});
  secs.forEach(s=>spy.observe(s));
}

/* ------------------------------------------------------------------
   NAVEGACIÓN INTERNA: scroll suave, menú móvil, volver arriba
------------------------------------------------------------------ */
function setMenu(open){
  const m=$("#lmenu"), b=$("[data-menu]");
  if(!m) return;
  m.classList.toggle("open",open);
  m.setAttribute("aria-hidden",open?"false":"true");
  if(b){ b.classList.toggle("on",open); b.setAttribute("aria-expanded",open?"true":"false"); }
  document.body.classList.toggle("menu-open",open);
}
function onLanding(){ const h=location.hash; return (h===""||h==="#"||h==="#/") && !!$("#inicio"); }
function scrollToId(id){
  if(id==="top"){
    if(onLanding()) window.scrollTo({top:0,behavior:reduce?"auto":"smooth"});
    else location.hash="#/";
    return;
  }
  const el=document.getElementById(id);
  if(el && onLanding()){
    el.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  }else{
    FX.pending=id; location.hash="#/";
  }
}
document.addEventListener("click",e=>{
  const sc=e.target.closest("[data-scroll]");
  if(sc){ e.preventDefault(); setMenu(false); scrollToId(sc.dataset.scroll); return; }
  if(e.target.closest("[data-menu]")){ setMenu(!document.body.classList.contains("menu-open")); return; }
  if(e.target.closest("#toTop")){ window.scrollTo({top:0,behavior:reduce?"auto":"smooth"}); return; }
  if(e.target.closest("#lmenu a")) setMenu(false);
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape") setMenu(false); });

/* ------------------------------------------------------------------
   TRANSICIÓN ENTRE PÁGINAS (cortina)
------------------------------------------------------------------ */
FX.transition = function(cb){
  const c=$("#curtain");
  if(!c || reduce || FX._busy){ cb(); return; }
  FX._busy=true;
  c.classList.remove("out"); c.classList.add("in");
  setTimeout(()=>{
    cb();
    c.classList.remove("in"); c.classList.add("out");
    setTimeout(()=>{ c.classList.remove("out"); FX._busy=false; },560);
  },430);
};

/* ------------------------------------------------------------------
   CURSOR, SPOTLIGHT Y BOTONES MAGNÉTICOS
------------------------------------------------------------------ */
(function cursor(){
  const ring=$("#cur"), dot=$("#curd");
  let x=-100,y=-100,cx=-100,cy=-100,magEl=null;
  document.addEventListener("mousemove",e=>{
    const s=e.target.closest && e.target.closest(".spot");
    if(s){
      const r=s.getBoundingClientRect();
      s.style.setProperty("--mx",(e.clientX-r.left)+"px");
      s.style.setProperty("--my",(e.clientY-r.top)+"px");
    }
    if(!fine||reduce) return;
    x=e.clientX; y=e.clientY;
    document.body.classList.add("has-cur");
    if(dot) dot.style.transform=`translate(${x}px,${y}px)`;
    const m=e.target.closest && e.target.closest(".mag");
    if(m){
      const r=m.getBoundingClientRect();
      m.style.translate=`${((e.clientX-r.left-r.width/2)*.2).toFixed(1)}px ${((e.clientY-r.top-r.height/2)*.3).toFixed(1)}px`;
      magEl=m;
    }else if(magEl){ magEl.style.translate=""; magEl=null; }
  });
  if(!fine||reduce||!ring) return;
  (function loop(){
    cx+=(x-cx)*.17; cy+=(y-cy)*.17;
    ring.style.transform=`translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover",e=>{
    const t=e.target.closest && e.target.closest("a,button,summary,.spot,.opt,.li,.sc-seg,[data-cursor],label");
    ring.classList.toggle("big",!!t);
  });
  document.addEventListener("mouseleave",()=>document.body.classList.remove("has-cur"));
})();

/* ------------------------------------------------------------------
   DESPUÉS DE CADA RENDER
------------------------------------------------------------------ */
FX.afterRender = function(){
  FX._stages.forEach(s=>s.destroy()); FX._stages=[];
  setMenu(false);
  FX.hydrate(document);
  observe();
  scrollSpy();

  const route=location.hash;
  if(route!==FX._route){
    FX._route=route;
    const pg=$(".page"); if(pg) pg.classList.add("enter");
  }
  if(FX.pending){
    const id=FX.pending; FX.pending=null;
    setTimeout(()=>{ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:"auto",block:"start"}); frame(); },80);
  }
  frame();
};

/* ------------------------------------------------------------------
   PRECARGA
------------------------------------------------------------------ */
(function preloader(){
  const L=$("#loader"), body=document.body;
  let seen=false; try{ seen = sessionStorage.getItem("ba_loaded")==="1"; }catch(e){}
  if(!L) return;
  if(seen || reduce){ L.remove(); return; }
  body.classList.add("pre");
  setTimeout(()=>body.classList.remove("pre"),4800);          // seguro: nunca deja la página oculta
  const num=$("#ldn"), bar=$("#ldb"), fish=$("#ldf");
  const t0=performance.now(), D=1500;
  (function tick(t){
    const p=Math.min(1,(t-t0)/D), e=1-Math.pow(1-p,3);
    num.textContent=Math.round(e*100);
    bar.style.transform=`scaleX(${e})`;
    fish.style.left=(e*100)+"%";
    if(p<1){ requestAnimationFrame(tick); return; }
    L.classList.add("done");
    body.classList.remove("pre");
    try{ sessionStorage.setItem("ba_loaded","1"); }catch(e){}
    setTimeout(()=>L.remove(),900);
  })(t0);
})();

})();
