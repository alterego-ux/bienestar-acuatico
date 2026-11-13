/* Pruebas de lógica del prototipo. Requiere Node.js; no instala dependencias. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
const data = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
vm.runInContext(data, ctx, { filename: 'data.js' });

function extractDeclaration(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.ok(start >= 0, `No se encontró ${startNeedle}`);
  const end = endNeedle ? source.indexOf(endNeedle, start) : source.indexOf('\n', start);
  assert.ok(end > start, `No se encontró el final de ${startNeedle}`);
  return source.slice(start, end);
}

vm.runInContext(extractDeclaration(app, 'const clsOf=', null), ctx);
vm.runInContext(extractDeclaration(storage, 'const indFor=', null), ctx);
vm.runInContext('let S={pesos:JSON.parse(JSON.stringify(PESOS_BASE))};', ctx);
const calcSource = extractDeclaration(app, 'function calc(e){', 'function scoreText(c){');
vm.runInContext(calcSource, ctx, { filename: 'calc() from app.js' });
vm.runInContext(extractDeclaration(app, 'function depthRange(reg,isJaula){', 'function calc(e){'), ctx);

function inCtx(code) { return vm.runInContext(code, ctx); }
function makeEval(reg, score = 100) {
  const ids = inCtx(`indFor(${JSON.stringify(reg)}).map(i=>i.id)`);
  return { reg, resp: Object.fromEntries(ids.map(id => [id, { score }])) };
}

assert.equal(inCtx('IND.length'), 23, 'PMG debe enumerar 23 indicadores definidos');
assert.equal(inCtx('IND.filter(i=>i.arel).length'), 15, 'AREL debe enumerar 15 indicadores aplicables');
assert.equal(inCtx('Object.values(PESOS_BASE.PMG).reduce((a,b)=>a+b,0)'), 100, 'Pesos PMG suman 100%');
assert.equal(inCtx('Object.values(PESOS_BASE.AREL).reduce((a,b)=>a+b,0)'), 100, 'Pesos AREL suman 100%');

let c = inCtx(`calc(${JSON.stringify(makeEval('PMG'))})`);
assert.equal(c.total, 100, 'PMG con todos los indicadores a 100 debe dar 100%');
assert.equal(c.isFinal, true, 'PMG completamente puntuado debe ser calculable');
assert.equal(c.pend, 0);

c = inCtx(`calc(${JSON.stringify(makeEval('AREL'))})`);
assert.equal(c.total, 100, 'AREL con todos los indicadores a 100 debe dar 100%');
assert.equal(c.isFinal, true);

const idsPMG = inCtx('indFor("PMG").map(i=>({id:i.id,t:i.t}))');
const mixedPMG = makeEval('PMG');
mixedPMG.resp = Object.fromEntries(idsPMG.map(i => [i.id, { score: i.t === 'MBR' ? 100 : i.t === 'MBA' ? 55 : 0 }]));
c = inCtx(`calc(${JSON.stringify(mixedPMG)})`);
assert.ok(Math.abs(c.total - 54.25) < 1e-9, `PMG ponderado esperado 54.25, recibido ${c.total}`);

const idsAREL = inCtx('indFor("AREL").map(i=>({id:i.id,t:i.t}))');
const mixedAREL = makeEval('AREL');
mixedAREL.resp = Object.fromEntries(idsAREL.map(i => [i.id, { score: i.t === 'MBR' ? 100 : i.t === 'MBA' ? 55 : 0 }]));
c = inCtx(`calc(${JSON.stringify(mixedAREL)})`);
assert.ok(Math.abs(c.total - 62) < 1e-9, `AREL ponderado esperado 62, recibido ${c.total}`);

const incomplete = makeEval('PMG');
delete incomplete.resp[idsPMG[0].id];
c = inCtx(`calc(${JSON.stringify(incomplete)})`);
assert.equal(c.pend, 1, 'Un indicador pendiente debe computarse como pendiente');
assert.equal(c.isFinal, false, 'Evaluación incompleta no debe ser definitiva');

const invalid = makeEval('PMG');
invalid.resp[idsPMG[0].id] = { score: 999 };
c = inCtx(`calc(${JSON.stringify(invalid)})`);
assert.equal(c.pend, 1, 'Una puntuación no permitida debe tratarse como pendiente');
assert.equal(c.isFinal, false);

const noGroupData = makeEval('PMG');
for (const i of idsPMG.filter(i => i.t === 'MBR')) noGroupData.resp[i.id] = { score: 'NA' };
c = inCtx(`calc(${JSON.stringify(noGroupData)})`);
assert.ok(Array.from(c.gruposSinDato).includes('MBR'), 'Un grupo sin puntuación aplicable debe detectarse');
assert.equal(c.isFinal, false, 'Un grupo vacío no debe generar puntaje definitivo');

for (const [n, expected] of [[49.999,'Bajo'],[50,'Medio'],[74.999,'Medio'],[75,'Alto'],[89.999,'Alto'],[90,'Excelente']]) {
  assert.equal(inCtx(`clsOf(${n})`), expected, `Clasificación en límite ${n}`);
}
assert.deepEqual(Array.from(inCtx('depthRange("PMG",true)')), [2,5], 'PMG en jaula usa rango 2–5 m');
assert.deepEqual(Array.from(inCtx('depthRange("PMG",false)')), [0.6,1.5], 'PMG en otro sistema usa rango 0,6–1,5 m');
assert.deepEqual(Array.from(inCtx('depthRange("AREL",true)')), [0.6,1.5], 'AREL no hereda la excepción de jaulas de PMG');

console.log('OK: pruebas de conteo, pesos, fórmulas, pendientes, escalas, umbrales y profundidad completadas.');
