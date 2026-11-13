/* ============ Persistencia local ============ */
const KEY="bienestar_acuatico_v2";
let S=null;

const uid=p=>p+Math.random().toString(36).slice(2,8);
const today=()=>new Date().toISOString().slice(0,10);
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const nowStr=()=>new Date().toLocaleString("es-CO");

function seed(){
  const users=[
    {id:"u1",n:"Administrador ICA",e:"admin@ica.demo",p:"admin123",r:"admin",a:true},
    {id:"u2",n:"Paola Valencia",e:"docente@ica.demo",p:"docente123",r:"docente",a:true},
    {id:"u3",n:"Olegario López",e:"evaluador@ica.demo",p:"1234",r:"evaluador",a:true},
    {id:"u4",n:"Consultor Externo",e:"consultor@ica.demo",p:"consultor123",r:"consultor",a:true},
    {id:"u5",n:"Juan Pérez",e:"juan.perez@ejemplo.com",p:"1234",r:"evaluador",a:true},
    {id:"u6",n:"Ana Gómez",e:"ana.gomez@ejemplo.com",p:"1234",r:"evaluador",a:true},
    {id:"u7",n:"Oscar Reyes",e:"oscar.reyes@ejemplo.com",p:"1234",r:"evaluador",a:false}
  ];
  const predios=[
    {id:"p1",cod:"PRD-0001",n:"Finca El Paraíso",resp:"Carlos Rodríguez",mail:"paraiso@ejemplo.com",tipo:TIPOS_PRODUCTOR[2],sis:["Estanque"],dep:"Cundinamarca",mun:"Silvania",ver:"La Esperanza",dir:"Km 3 vía Fusagasugá",lat:"4.4036",lng:"-74.3961",inv:[{esp:"Tilapia",cant:12000,peso:320,lotes:6}],act:true},
    {id:"p2",cod:"PRD-0002",n:"Piscícola La Esperanza",resp:"María Torres",mail:"laesperanza@ejemplo.com",tipo:TIPOS_PRODUCTOR[3],sis:["Jaulas flotantes","Estanque"],dep:"Meta",mun:"Granada",ver:"El Triunfo",dir:"Finca La Esperanza",lat:"",lng:"",inv:[{esp:"Cachama",cant:30000,peso:450,lotes:10}],act:true},
    {id:"p3",cod:"PRD-0003",n:"Truchas San José",resp:"Luis Martínez",mail:"sanjose@ejemplo.com",tipo:TIPOS_PRODUCTOR[1],sis:["Tanques en geomembrana"],dep:"Boyacá",mun:"Garagoa",ver:"San José",dir:"Vereda San José",lat:"",lng:"",inv:[{esp:"Trucha",cant:2500,peso:180,lotes:3}],act:true}
  ];
  const A=[100,100,55,55,100,null,20,100,null,20,55,100,100,100,55,100,55,100,100,100,100,100,100];
  const B=[100,20,55,55,55,null,100,55,null,55,100,100,100,100,100,55,100,100,100,55,55,55,100];
  const C=[55,100,100,100,100,null,100,55,null,100,55,100,100,100,100,55,100,100,100,100,100,100,100];
  const D=[100,100,55,100,100,null,100,100,null,100,100,55,null,100,100,100,100,100,100,100,100,100,100];
  const AR=[100,55,100,100,100,100,100,55,100,55,100,55,55,55,20];
  const mk=(id,p,f,ev,reg,esp,arr,est,lot)=>({id,pid:p,fecha:f,ev,reg,esp,lotes:lot,sel:[],peces:{esp,cant:0,peso:0,lote:"Lote 1"},resp:genResp(arr,reg),est,recs:[],plan:[],cr:f,up:f});
  const evals=[mk("e1","p1","2026-05-25","Juan Pérez","PMG","Tilapia",A,"cerrada",6),mk("e2","p1","2026-06-16","Ana Gómez","PMG","Tilapia",B,"validada",6),mk("e3","p1","2026-08-30","Oscar Reyes","PMG","Tilapia",C,"cerrada",6),mk("e4","p2","2026-09-10","Juan Pérez","PMG","Cachama",D,"finalizada",10)];
  evals.forEach(e=>{e.sel=["Lote 1","Lote 2","Lote 3"]});
  const e5=mk("e5","p3","2026-10-02","Olegario López","AREL","Trucha",AR,"en_proceso",3);
  ["AN01","AN02","AN03","AN04","AN06","GE02","GE05","RE08","RE07"].forEach(k=>{delete e5.resp[k]});
  e5.sel=["Lote 1","Lote 2","Lote 3"];evals.push(e5);
  return{v:2,users,predios,evals,esp:JSON.parse(JSON.stringify(ESPECIES_BASE)),pesos:JSON.parse(JSON.stringify(PESOS_BASE)),audit:[{t:nowStr(),u:"Sistema",a:"Datos de demostración cargados"}],sess:null};
}
function genResp(arr,reg){
  const o={};const l=indFor(reg);
  l.forEach((i,k)=>{const v=arr[k];o[i.id]={score:v===null?"NA":v,obs:"",evid:[]}});
  return o;
}
const indFor=reg=>reg==="AREL"?IND.filter(i=>i.arel):IND;

function load(){
  try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
  if(!S||S.v!==2)S=seed();
  if(!S.esp)S.esp=JSON.parse(JSON.stringify(ESPECIES_BASE));
  if(!S.pesos)S.pesos=JSON.parse(JSON.stringify(PESOS_BASE));
  if(!S.audit)S.audit=[];
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(S))}
  catch(e){console.error(e);alert("No se pudo guardar en el almacenamiento local. Verifica el espacio disponible.")}
}
function exportBackup(){
  const data=JSON.stringify(S,null,2);
  const blob=new Blob([data],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="bienestar_acuatico_backup_"+today()+".json";
  document.body.appendChild(a);a.click();a.remove();
}
function importBackup(file,cb){
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d.users||!d.predios||!d.evals)throw new Error("Estructura inválida");
      localStorage.setItem(KEY,JSON.stringify({...d,v:2}));
      load();cb(true);
    }catch(e){cb(false,e.message)}
  };
  r.readAsText(file);
}
function resetAll(){
  localStorage.removeItem(KEY);load();
}

/* ---------- IndexedDB para evidencias ---------- */
const IDB_NAME="bienestar_evidencias",IDB_STORE="files";
function idbOpen(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open(IDB_NAME,1);
    r.onupgradeneeded=()=>{r.result.createObjectStore(IDB_STORE)};
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  });
}
async function idbPut(key,file){
  const db=await idbOpen();
  return new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,"readwrite");
    tx.objectStore(IDB_STORE).put({name:file.name,type:file.type,blob:file},key);
    tx.oncomplete=()=>res(key);tx.onerror=()=>rej(tx.error);
  });
}
async function idbGet(key){
  const db=await idbOpen();
  return new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,"readonly");
    const r=tx.objectStore(IDB_STORE).get(key);
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
  });
}
async function idbDel(key){
  const db=await idbOpen();
  return new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,"readwrite");
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);
  });
}