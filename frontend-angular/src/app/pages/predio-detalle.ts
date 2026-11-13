import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Evaluacion, Predio } from '../core/models';
import { BadgeCls, BadgeEstado, PageHead, fd, pc } from '../shared/widgets';

/** Ficha del predio: datos, especies/lotes, acción «Nueva evaluación» e historial SOLO de esta finca. */
@Component({
  selector: 'app-predio-detalle', imports: [RouterLink, PageHead, BadgeCls, BadgeEstado],
  template: `
    @if (p(); as p) {
      <app-head [titulo]="p.n" [sub]="p.cod + ' · ' + p.mun + ', ' + p.dep" crumb="Predios" crumbLink="/app/predios">
        @if (auth.puedeEscribir()) {
          <a class="btn" [routerLink]="['/app/predios', p.id, 'editar']">Editar predio</a>
          @if (p.act && p.inv.length) { <a class="btn p" [routerLink]="['/app/predios', p.id, 'evaluar']">Nueva evaluación</a> }
        }
      </app-head>
      @if (!p.act) { <div class="alert w" style="margin-bottom:16px">Este predio está inactivo: actívalo desde «Editar predio» para poder evaluarlo.</div> }

      <div class="cards g2 rise">
        <div class="card"><h3>Información del predio</h3>
          <div class="kvs">
            <div class="kv"><span>Responsable</span><b>{{ p.resp }}</b></div>
            <div class="kv"><span>Correo</span><b>{{ p.mail }}</b></div>
            <div class="kv"><span>Teléfono de contacto</span><b>{{ p.telefono || 'No registrado' }}</b></div>
            <div class="kv"><span>Tipo de productor</span><b>{{ p.tipo }}</b></div>
            <div class="kv"><span>Modalidad de evaluación</span><b>{{ p.modalidad === 'AREL' ? 'Subsistencia / AREL' : 'Pequeños, medianos y grandes' }}</b></div>
            <div class="kv"><span>Sistemas productivos</span><b>{{ (p.sis || []).join(', ') || '—' }}</b></div>
            <div class="kv"><span>Ubicación</span><b>{{ p.mun }}, {{ p.dep }}{{ p.ver ? ' · ' + p.ver : '' }}</b></div>
          </div></div>
        <div class="card"><h3>Especies y lotes</h3>
          <p class="small muted">Cada especie se evalúa por separado.</p>
          @for (i of p.inv; track i.esp) {
            <div class="li static"><div style="flex:1"><b>{{ i.esp }}</b><div class="tiny muted">{{ i.cant }} peces · {{ i.peso }} g promedio</div></div>
              <span class="bd">{{ i.lotes }} lote(s)</span></div>
          } @empty { <p class="muted small">Sin especies registradas.</p> }
        </div>
      </div>

      <div class="sp"></div>
      <div class="row" style="margin-bottom:10px"><h2 style="margin:0">Historial de evaluaciones de este predio</h2>
        @if (especiesHist().length > 1) {
          <select class="input right" style="max-width:200px" [value]="filtro()" (change)="filtro.set($any($event.target).value)">
            <option value="">Todas las especies</option>@for (e of especiesHist(); track e) { <option [value]="e">{{ e }}</option> }
          </select>
        }
      </div>
      <div class="tw rise"><table>
        <tr><th>Fecha</th><th>Especie</th><th>Evaluador</th><th>Puntaje</th><th>Clasificación</th><th>Estado</th></tr>
        @for (e of visibles(); track e.id) {
          <tr class="click" [routerLink]="['/app/evaluacion', e.id, enCurso(e) ? 'indicadores' : 'resultados']">
            <td>{{ fd(e.fecha) }}</td><td>{{ e.esp }}</td><td>{{ e.ev }}</td>
            <td><b>{{ e.puntaje_global !== null ? pc(+e.puntaje_global!) : '—' }}</b></td>
            <td>@if (e.clasificacion) { <app-badge [valor]="e.clasificacion" /> }</td><td><app-estado [valor]="e.est" /></td>
          </tr>
        } @empty { <tr><td colspan="6" class="muted">Este predio aún no tiene evaluaciones.</td></tr> }
      </table></div>
    } @else { <div class="skeleton" style="height:260px"></div> }`,
})
export class PredioDetalle implements OnInit {
  auth = inject(AuthService); private api = inject(ApiService); private route = inject(ActivatedRoute);
  fd = fd; pc = pc;
  p = signal<Predio | null>(null); hist = signal<Evaluacion[]>([]); filtro = signal('');
  especiesHist = computed(() => [...new Set(this.hist().map((e) => e.esp || ''))].filter(Boolean));
  visibles = computed(() => this.hist().filter((e) => !this.filtro() || e.esp === this.filtro()));
  enCurso = (e: Evaluacion) => e.est === 'en_proceso' || e.est === 'borrador';
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const [p, h] = await Promise.all([this.api.get<Predio>('/predios/' + id), this.api.get<Evaluacion[]>('/evaluaciones', { predio: id })]);
    this.p.set(p); this.hist.set(h);
  }
}
