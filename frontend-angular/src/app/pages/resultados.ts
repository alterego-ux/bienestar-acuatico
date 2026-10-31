import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';
import { COLOR_CLS, EvaluacionDetalle, MEDIDAS, RecomendacionInforme, TipoMedida } from '../core/models';
import { BadgeCls, BadgeEstado, BarRow, Bars, PageHead, Ring, fd, pc } from '../shared/widgets';

const LIB: [string, string][] = [['Hambre', 'Hambre'], ['Molestias', 'Molestias'], ['Dolor', 'Dolor'], ['Temor', 'Temor'], ['Comportamiento natural', 'Comport.']];

@Component({
  selector: 'app-resumen', imports: [RouterLink, PageHead, Ring, BadgeCls],
  template: `
    @if (d(); as d) {
      <app-head titulo="Resumen de la evaluación" [sub]="d.evaluacion.predio_nombre + ' · ' + d.evaluacion.esp" crumb="Indicadores" [crumbLink]="'/app/evaluacion/' + d.evaluacion.id + '/indicadores'" />
      <div class="cards g2 rise">
        <div class="card" style="text-align:center"><h3>Avance</h3>
          <app-ring [valor]="av()" [size]="150" color="#1f3a5f" [label]="pc(av())" [sw]="14" />
          <div class="small muted" style="margin-top:8px">{{ d.calculo.done + d.calculo.na }} de {{ d.calculo.count }} indicadores</div></div>
        <div class="card"><h3>Estado del cálculo</h3>
          @if (d.calculo.pend) { <div class="alert w">Faltan <b>{{ d.calculo.pend }}</b> indicador(es) por calificar.</div> }
          @else { <div class="alert g">Todos los indicadores están completos. Puedes finalizar.</div> }
          @if (d.calculo.isFinal) { <p>Puntaje provisional: <b>{{ pc(d.calculo.total) }}</b> <app-badge [valor]="d.calculo.cls" /></p> }
        </div>
      </div>
      <div class="sp"></div>
      <div class="row"><a class="btn" [routerLink]="['/app/evaluacion', d.evaluacion.id, 'indicadores']">Volver a indicadores</a>
        <button class="btn p right" (click)="finalizar()" [disabled]="d.calculo.pend > 0 || cargando()">Finalizar evaluación</button></div>
    } @else { <div class="skeleton" style="height:260px"></div> }`,
})
export class Resumen implements OnInit {
  private api = inject(ApiService); private route = inject(ActivatedRoute); private router = inject(Router); private ui = inject(UiService); pc = pc;
  d = signal<EvaluacionDetalle | null>(null); cargando = signal(false);
  av = computed(() => { const c = this.d()?.calculo; return c ? ((c.done + c.na) / c.count) * 100 : 0; });
  async ngOnInit() { this.d.set(await this.api.get('/evaluaciones/' + this.route.snapshot.paramMap.get('id'))); }
  async finalizar() {
    this.cargando.set(true);
    try { const id = this.d()!.evaluacion.id; await this.api.post(`/evaluaciones/${id}/finalizar`); this.ui.toast('Evaluación finalizada'); this.router.navigate(['/app/evaluacion', id, 'resultados']); }
    catch (e) { this.ui.error(e); } finally { this.cargando.set(false); }
  }
}

@Component({
  selector: 'app-resultado', imports: [FormsModule, RouterLink, PageHead, Ring, Bars, BadgeCls, BadgeEstado],
  template: `
    @if (d(); as d) {
      <app-head titulo="Resultados" [sub]="d.evaluacion.predio_nombre + ' · ' + d.evaluacion.esp + ' · ' + fd(d.evaluacion.fecha) + ' · Evaluador: ' + d.evaluacion.ev" crumb="Predio" [crumbLink]="'/app/predios/' + d.evaluacion.predio_id">
        <a class="btn" [routerLink]="['/app/informe', d.evaluacion.id]">Informe</a>
        <a class="btn" [routerLink]="['/app/predios', d.evaluacion.predio_id]">Volver al predio</a>
        @if (enCurso() && auth.puedeEscribir()) { <a class="btn p" [routerLink]="['/app/evaluacion', d.evaluacion.id, 'indicadores']">Continuar</a> }
        @if (d.evaluacion.est === 'finalizada' && auth.puedeValidar()) { <button class="btn p" (click)="estado('validada')">Validar</button> }
        @if (d.evaluacion.est === 'validada' && auth.puedeValidar()) { <button class="btn p" (click)="estado('cerrada')">Cerrar</button> }
      </app-head>
      <div style="margin-bottom:12px"><app-estado [valor]="d.evaluacion.est" /></div>
      @if (d.calculo.isFinal) {
        <div class="alert" [style.border-color]="color(d.calculo.cls)" style="margin-bottom:16px;padding:16px 18px">
          <span class="small muted">Clasificación obtenida</span>
          <div style="font-size:1.6rem;font-weight:600;color:var(--c-{{ d.calculo.cls }})">{{ d.calculo.cls }} · {{ pc(d.calculo.total) }}</div>
          <div class="small">{{ descripcion(d.calculo.cls) }}</div>
        </div>
      }
      @if (!d.calculo.isFinal) { <div class="alert w" style="margin-bottom:16px">{{ d.calculo.pend ? 'Hay ' + d.calculo.pend + ' indicador(es) pendiente(s); el resultado no es definitivo.' : 'No hay resultado global calculable.' }}</div> }
      <div class="cards rise" style="grid-template-columns:minmax(280px,1fr) 2fr">
        <div class="card" style="text-align:center"><h3>{{ d.calculo.isFinal ? 'Puntaje global' : 'Resultado provisional' }}</h3>
          <app-ring [valor]="d.calculo.isFinal ? d.calculo.total : 0" [size]="180" [color]="color(d.calculo.cls)" [label]="d.calculo.isFinal ? pc(d.calculo.total) : '—'" [sw]="16" />
          <div style="margin-top:12px;font-size:1.1rem"><app-badge [valor]="d.calculo.cls" /></div>
          <div class="small muted" style="margin-top:6px">{{ d.calculo.done + d.calculo.na }} evaluados de {{ d.calculo.count }}</div></div>
        <div class="card"><h3>Por tipo de medida</h3>
          <div class="row" style="justify-content:space-around;margin:10px 0">
            @for (k of tipos; track k) {
              <div style="text-align:center"><app-ring [valor]="d.calculo.avg[k] ?? 0" [size]="100" [color]="M[k].c" [label]="d.calculo.avg[k] === null ? '—' : '' + round(d.calculo.avg[k]!)" [sw]="10" />
                <div style="margin-top:8px"><b>{{ M[k].n }}</b></div><div class="small muted">peso {{ d.calculo.pesos[k] }}%</div></div>
            }
          </div>
          <h3 style="margin-top:14px">Cumplimiento por libertad</h3>
          <app-bars [rows]="libertades()" />
        </div>
      </div>
      <div class="sp"></div>
      <div class="card"><h3>Diagnóstico</h3>
        <div><b style="color:var(--ok)">Fortalezas ({{ fort().length }})</b><div class="small muted" style="margin-top:6px">@for (x of fort(); track x.indicador.codigo) { <div>✔ {{ x.indicador.nombre }}</div> } @empty { — }</div></div><div class="sp"></div>
        @if (crit().length) { <div class="alert r"><b>Criterios con 0 puntos ({{ crit().length }}):</b>@for (x of crit(); track x.indicador.codigo) { <div>• {{ x.indicador.codigo }} · {{ x.indicador.nombre }}</div> }</div> }
        @else { <div class="alert g">Ningún criterio fue calificado con 0 puntos.</div> }
      </div>
      <div class="sp"></div>
      <div class="card ia-recomendaciones">
        <div class="ia-recomendaciones-head"><div><span class="eyebrow">AQUA INTELLIGENCE</span><h3>Recomendaciones de mejora</h3><p class="small muted">Combina los hallazgos de esta evaluación con propuestas de mejora asistidas por Gemini.</p></div>
          @if (auth.puedeEscribir() && d.calculo.isFinal) { <button class="btn p" type="button" (click)="generarIA()" [disabled]="iaCargando() || !crit().length"><span aria-hidden="true">✳</span> {{ iaCargando() ? 'Analizando…' : 'Generar con IA' }}</button> }
        </div>
        <div class="alert i small">Las sugerencias de IA son un apoyo a la decisión. El evaluador debe revisarlas y aprobarlas; no modifican los puntajes calculados por el sistema.</div><div class="sp"></div>
        @if (iaCargando()) { <div class="ia-loading" role="status"><span class="aa-typing"><i></i><i></i><i></i></span> Analizando los hallazgos registrados…</div> }
        @if (iaError()) { <div class="alert w" role="alert">{{ iaError() }}</div> }
        @if (iaRespuesta()) { <section class="ia-answer"><div class="ia-answer-title"><span>✳</span><b>Propuesta generada por AquaAssist</b><span class="bd b-Medio">Revisión humana</span></div><p>{{ iaRespuesta() }}</p></section> }
        <div class="ia-base-title">RECOMENDACIONES REGISTRADAS</div>
        @for (r of recs(); track r.codigo) { <div class="ia-rec-item"><div class="row"><b>{{ r.codigo }} · {{ r.nombre }}</b><span class="bd b-Bajo">0 pts</span></div>
          <p class="small muted" style="margin:6px 0 0">{{ r.texto }}</p></div> } @empty { <p class="muted small">No hay criterios con 0 puntos, por lo tanto no se requieren recomendaciones críticas.</p> }
      </div>
      <div class="sp"></div>
      <div class="card"><div class="row"><h3>Plan de mejora</h3>
        @if (wr() && recs().length && !plan().length) { <button class="btn s right" (click)="hacerPlan()">Crear plan de mejora</button> }</div>
        @if (plan().length) { <div class="tw"><table><tr><th>Acción</th><th>Responsable</th><th>Prioridad</th><th>Plazo</th><th>Hecho</th></tr>
          @for (a of plan(); track a.id) { <tr>
            <td><textarea class="input" style="min-height:60px" [disabled]="!wr()" [(ngModel)]="a.a" (blur)="guardarItem(a.id, { accion: a.a })"></textarea></td>
            <td><input class="input" [disabled]="!wr()" [(ngModel)]="a.r" (blur)="guardarItem(a.id, { responsable: a.r })" /></td>
            <td><select class="input" [disabled]="!wr()" [(ngModel)]="a.p" (change)="guardarItem(a.id, { prioridad: a.p })"><option>Alta</option><option>Media</option><option>Baja</option></select></td>
            <td><input class="input" type="date" [disabled]="!wr()" [ngModel]="(a.d || '').slice(0, 10)" (ngModelChange)="a.d = $event; guardarItem(a.id, { plazo: $event })" /></td>
            <td><input type="checkbox" [disabled]="!wr()" [(ngModel)]="a.completado" (change)="guardarItem(a.id, { completado: a.completado })" /></td></tr> }
        </table></div> } @else { <p class="muted small">Sin acciones.</p> }
      </div>
    } @else { <div class="skeleton" style="height:340px"></div> }`,
})
export class Resultado implements OnInit {
  private api = inject(ApiService); private route = inject(ActivatedRoute); private ui = inject(UiService); auth = inject(AuthService);
  fd = fd; pc = pc; M = MEDIDAS; round = Math.round; tipos: TipoMedida[] = ['MBA', 'MBR', 'MBG'];
  d = signal<EvaluacionDetalle | null>(null);
  iaRespuesta = signal(''); iaError = signal(''); iaCargando = signal(false);
  color = (c: string) => COLOR_CLS[c] || '#6b8794';
  enCurso = () => ['en_proceso', 'borrador'].includes(this.d()?.evaluacion.est ?? '');
  wr = () => this.auth.puedeEscribir() && !['validada', 'cerrada'].includes(this.d()?.evaluacion.est ?? '');
  plan = () => this.d()?.evaluacion.plan ?? [];
  /** Recomendaciones: solo criterios con 0 puntos, tomadas del cálculo vigente (siempre actualizadas). */
  recs = computed<RecomendacionInforme[]>(() => (this.d()?.calculo.items ?? [])
    .filter((x) => x.estado === 'ok' && x.respuesta.puntaje === 0)
    .map((x) => ({ codigo: x.indicador.codigo, nombre: x.indicador.nombre, puntaje: 0, texto: x.indicador.recomendacion })));
  descripcion = (c: string) => ({ Excelente: 'Bienestar óptimo, con indicadores de bienestar positivo.', Alto: 'Buen bienestar, pero susceptible de ser mejorado.', Medio: 'Las afectaciones pueden deteriorar la condición de los animales si no se resuelven rápido.', Bajo: 'Hay deficiencias que requieren acciones a corto y mediano plazo.' } as Record<string, string>)[c] || '';
  ok = () => (this.d()?.calculo.items ?? []).filter((x) => x.estado === 'ok');
  crit = () => this.ok().filter((x) => x.respuesta.puntaje === 0);
  fort = () => this.ok().filter((x) => x.respuesta.puntaje === 100);
  libertades = computed<BarRow[]>(() => LIB.map(([clave, l]) => {
    const s = this.ok().filter((x) => x.indicador.libertad.toLowerCase().includes(clave.toLowerCase())).map((x) => Number(x.respuesta.puntaje));
    const v = s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
    return { l, v: v ?? 0, t: v === null ? '—' : Math.round(v) };
  }));
  id = () => +this.route.snapshot.paramMap.get('id')!;
  async ngOnInit() { await this.cargar(); }
  async cargar() { this.d.set(await this.api.get('/evaluaciones/' + this.id())); }
  async generarIA() {
    const evaluacionId = this.d()?.evaluacion.id;
    if (!evaluacionId || this.iaCargando() || !this.crit().length) return;
    this.iaError.set(''); this.iaRespuesta.set(''); this.iaCargando.set(true);
    try {
      const respuesta = await this.api.post<{ answer: string }>(`/chatbot/recomendaciones/${evaluacionId}`);
      this.iaRespuesta.set(respuesta.answer);
    } catch (e) {
      this.iaError.set(e instanceof Error ? e.message : 'No fue posible generar recomendaciones. Comprueba la configuración de Gemini.');
    } finally { this.iaCargando.set(false); }
  }
  async estado(e: string) { try { await this.api.patch(`/evaluaciones/${this.id()}/estado`, { estado: e }); this.ui.toast('Estado actualizado'); await this.cargar(); } catch (x) { this.ui.error(x); } }
  async hacerPlan() { try { await this.api.post(`/evaluaciones/${this.id()}/plan`); await this.cargar(); this.ui.toast('Plan creado'); } catch (x) { this.ui.error(x); } }
  async guardarItem(item: number, cambios: object) { try { await this.api.patch(`/evaluaciones/${this.id()}/plan/${item}`, cambios); } catch (x) { this.ui.error(x); } }
}
