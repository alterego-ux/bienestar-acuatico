import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { CatalogoService } from '../core/catalogo.service';
import { COLOR_CLS, Especie, Evaluacion, MEDIDAS, RecomendacionInforme, Resumen, TipoMedida } from '../core/models';
import { BadgeCls, BarRow, Bars, PageHead, Ring, fd, pc } from '../shared/widgets';

@Component({
  selector: 'app-tablero', imports: [PageHead, Ring, Bars],
  template: `
    <app-head titulo="Tablero" sub="Indicadores agregados de las evaluaciones finalizadas (todos los predios)" />
    @if (r(); as r) {
      <div class="cards g4 rise">
        <div class="card kpi"><b>{{ r.totales.evaluaciones }}</b><span>Evaluaciones</span></div>
        <div class="card kpi"><b>{{ r.totales.predios }}</b><span>Predios</span></div>
        <div class="card kpi"><b>{{ r.totales.promedio === null ? '—' : pc(r.totales.promedio) }}</b><span>Puntaje promedio</span></div>
        <div class="card kpi"><b>{{ r.totales.completadas }}</b><span>Completadas</span></div>
      </div>
      <div class="sp"></div>
      <div class="cards g2">
        <div class="card"><h3>Promedio por tipo de medida</h3>
          <div class="row" style="justify-content:space-around;margin:12px 0">
            @for (k of tipos; track k) { <div style="text-align:center"><app-ring [valor]="r.porMedida[k] ?? 0" [size]="110" [color]="M[k].c" [label]="r.porMedida[k] === null ? '—' : '' + round(r.porMedida[k]!)" [sw]="11" /><div style="margin-top:6px"><b>{{ M[k].n }}</b></div></div> }
          </div></div>
        <div class="card"><h3>Distribución por clasificación</h3><app-bars [rows]="dist()" /></div>
      </div>
      <div class="sp"></div>
      <div class="card"><h3>Evolución de puntajes</h3>
        @if (r.serie.length > 1) {
          <svg viewBox="0 0 600 200" class="chart" preserveAspectRatio="none">
            <path class="ar" [attr.d]="area()" /><path class="ln" [attr.d]="linea()" fill="none" stroke-width="2.5" />
            @for (p of puntos(); track $index) { <circle class="pt" [attr.cx]="p[0]" [attr.cy]="p[1]" r="4.5" stroke-width="2" /> }
          </svg>
          <div class="row small muted" style="justify-content:space-between">@for (s of r.serie; track s.id) { <span>{{ s.predio }}</span> }</div>
        } @else { <p class="muted small">Se necesitan al menos 2 evaluaciones finalizadas.</p> }
      </div>
      <div class="sp"></div>
      <div class="card"><h3>Indicadores con más hallazgos</h3>
        <div class="tw"><table><tr><th>Indicador</th><th>Evaluaciones</th><th>Promedio</th><th>Bajos</th></tr>
          @for (h of r.hallazgos; track h.codigo) { <tr><td><b>{{ h.codigo }}</b> · {{ h.nombre }}</td><td>{{ h.n }}</td><td>{{ round(h.promedio) }}</td><td>{{ h.bajos }}</td></tr> }</table></div></div>
    } @else { <div class="skeleton" style="height:300px"></div> }`,
})
export class Tablero implements OnInit {
  private api = inject(ApiService); M = MEDIDAS; pc = pc; round = Math.round; tipos: TipoMedida[] = ['MBR', 'MBA', 'MBG'];
  r = signal<Resumen | null>(null);
  dist = computed<BarRow[]>(() => { const d = this.r()?.distribucion ?? {}; const tot = Object.values(d).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(d).map(([k, v]) => ({ l: k, v: (v / tot) * 100, t: v, c: COLOR_CLS[k] })); });
  puntos = computed(() => { const s = this.r()?.serie ?? []; return s.map((x, i) => [s.length > 1 ? (i / (s.length - 1)) * 560 + 20 : 300, 180 - (Number(x.puntaje) / 100) * 160]); });
  linea = computed(() => this.puntos().map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' '));
  area = computed(() => { const p = this.puntos(); return p.length ? this.linea() + ` L${p[p.length - 1][0]} 200 L${p[0][0]} 200 Z` : ''; });
  async ngOnInit() { this.r.set(await this.api.get<Resumen>('/dashboard/resumen')); }
}

@Component({
  selector: 'app-especies', imports: [PageHead],
  template: `
    <app-head titulo="Tipos de especies" sub="Parámetros de referencia por especie" />
    <div class="cards g2 rise">
      @for (e of lista(); track e.id) {
        <div class="card glow"><div class="row"><h3>{{ e.n }}</h3>@if (e.act) { <span class="bd b-ok right">Activa</span> } @else { <span class="bd b-na right">Inactiva</span> }</div>
          <div class="tiny muted"><i>{{ e.nombre_cientifico }}</i> · {{ e.tipo_agua }}</div><div class="sp-sm"></div>
          <div class="kvs"><div class="kv"><span>Temperatura</span><b>{{ e.temp_min }}–{{ e.temp_max }} °C</b></div>
            <div class="kv"><span>Oxígeno mín.</span><b>{{ e.od_min }} mg/L</b></div><div class="kv"><span>pH mín.</span><b>{{ e.ph_min }}</b></div>
            <div class="kv"><span>Mortalidad</span><b>{{ e.mort }}</b></div></div></div>
      }
    </div>`,
})
export class Especies implements OnInit {
  private cat = inject(CatalogoService); lista = signal<Especie[]>([]);
  async ngOnInit() { this.lista.set(await this.cat.especies()); }
}

@Component({
  selector: 'app-informe', imports: [PageHead, Ring, BadgeCls],
  template: `
    @if (i(); as i) {
      <app-head titulo="Informe de evaluación" [sub]="i.evaluacion.predio_nombre" crumb="Resultados" [crumbLink]="'/app/evaluacion/' + i.evaluacion.id + '/resultados'">
        <button class="btn p" (click)="imprimir()">Imprimir / PDF</button></app-head>
      <div class="paper rise">
        <h2>Informe de bienestar acuático</h2>
        <p class="muted small">Prototipo académico basado en ICA v2.0 (2024). No es un documento oficial del ICA.</p>
        <div class="cards g2"><div class="small"><span class="muted">Predio:</span> {{ i.evaluacion.predio_nombre }} ({{ i.evaluacion.predio_codigo }})</div>
          <div class="small"><span class="muted">Fecha:</span> {{ fd(i.evaluacion.fecha) }}</div><div class="small"><span class="muted">Evaluador:</span> {{ i.evaluacion.ev }}</div>
          <div class="small"><span class="muted">Responsable del predio:</span> {{ i.evaluacion.predio_responsable }}</div>
          <div class="small"><span class="muted">Especie:</span> {{ i.evaluacion.esp }} · {{ i.evaluacion.reg }}</div></div>
        <div class="row" style="margin:18px 0"><app-ring [valor]="i.calculo.isFinal ? i.calculo.total : 0" [size]="120" [color]="i.calculo.isFinal ? '#1f3a5f' : '#7b8794'" [label]="i.calculo.isFinal ? pc(i.calculo.total) : '—'" [sw]="12" />
          <div><app-badge [valor]="i.calculo.cls" /><div class="small muted">{{ i.calculo.done + i.calculo.na }}/{{ i.calculo.count }} indicadores</div></div></div>
        @if (i.recomendaciones.length) {
          <h3>Recomendaciones de mejora (criterios con 0 puntos)</h3>
          @for (r of i.recomendaciones; track r.codigo) { <div style="margin-bottom:10px"><b>{{ r.codigo }} · {{ r.nombre }}</b><p class="small muted" style="margin:4px 0 0">{{ r.texto }}</p></div> }
          <div class="sp"></div>
        } @else { <p class="small muted">Ningún criterio fue calificado con 0 puntos: no hay recomendaciones críticas.</p> }
        <div class="tw"><table><tr><th>Código</th><th>Indicador</th><th>Estado</th><th>Puntaje</th><th>Observación</th></tr>
          @for (x of i.items; track x.codigo) { <tr><td>{{ x.codigo }}</td><td>{{ x.nombre }}</td><td>{{ x.estado }}</td><td>{{ x.puntaje ?? '—' }}</td><td class="small">{{ x.observacion }}</td></tr> }</table></div>
      </div>
    } @else { <div class="skeleton" style="height:300px"></div> }`,
})
export class Informe implements OnInit {
  private api = inject(ApiService); private route = inject(ActivatedRoute); fd = fd; pc = pc;
  i = signal<{ evaluacion: Evaluacion; calculo: { total: number; isFinal: boolean; cls: string; done: number; na: number; count: number }; items: { codigo: string; nombre: string; estado: string; puntaje: number | null; observacion: string }[]; recomendaciones: RecomendacionInforme[] } | null>(null);
  async ngOnInit() { this.i.set(await this.api.get('/reportes/' + this.route.snapshot.paramMap.get('id'))); }
  imprimir() { window.print(); }
}
