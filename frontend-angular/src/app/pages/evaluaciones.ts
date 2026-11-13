import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';
import { Evaluacion, InventarioItem, PlanMuestreo, Predio } from '../core/models';
import { BadgeEstado, PageHead, fd } from '../shared/widgets';

@Component({
  selector: 'app-evaluaciones', imports: [RouterLink, PageHead, BadgeEstado],
  template: `
    <app-head titulo="Evaluaciones en curso" sub="Continúa donde quedaste. Para iniciar una nueva, abre el predio desde «Predios y evaluaciones»." />
    @if (lista().length) {
      <div class="tw rise"><table>
        <tr><th>Fecha</th><th>Predio</th><th>Evaluador</th><th>Especie</th><th>Tipo</th><th>Estado</th></tr>
        @for (e of lista(); track e.id) {
          <tr class="click" [routerLink]="['/app/evaluacion', e.id, 'indicadores']">
            <td>{{ fd(e.fecha) }}</td><td><b>{{ e.predio_nombre }}</b></td><td>{{ e.ev }}</td><td>{{ e.esp }}</td><td>{{ e.reg }}</td><td><app-estado [valor]="e.est" /></td>
          </tr>
        }
      </table></div>
    } @else { <div class="card muted">Sin evaluaciones en curso.</div> }`,
})
export class Evaluaciones implements OnInit {
  auth = inject(AuthService); private api = inject(ApiService); fd = fd;
  lista = signal<Evaluacion[]>([]);
  async ngOnInit() { const l = await this.api.get<Evaluacion[]>('/evaluaciones'); this.lista.set(l.filter((e) => e.est === 'en_proceso' || e.est === 'borrador')); }
}

@Component({
  selector: 'app-wizard', imports: [FormsModule, RouterLink, PageHead],
  template: `
    @if (predio(); as p) {
    <app-head titulo="Nueva evaluación" [sub]="p.n + ' · ' + p.cod" crumb="Predio" [crumbLink]="'/app/predios/' + p.id" />
    <div class="steps">@for (s of pasos; track s) { <div [class.on]="paso() === $index + 1" [class.done]="paso() > $index + 1">{{ $index + 1 }}. {{ s }}</div> }</div>
    <div class="card rise">
      @switch (paso()) {
        @case (1) {
          <h3>¿Qué especie vas a evaluar?</h3>
          <p class="small muted">Si el predio tiene varias especies, cada una se evalúa por separado.</p>
          <div class="cards g3">
            @for (i of p.inv; track i.esp) {
              <label class="opt" [class.sel]="espId === i.espId" style="margin:0">
                <input type="radio" name="esp" [checked]="espId === i.espId" (change)="elegirEspecie(i)" />
                <span><b style="display:block">{{ i.esp }}</b><span class="tiny muted">{{ i.lotes }} lote(s) sembrados · {{ i.cant }} peces</span></span>
              </label>
            }
          </div>
          <div class="sp"></div>
          <div class="fg">
            <div class="field"><label>Fecha de evaluación *</label><input class="input" type="date" [(ngModel)]="fecha" /></div>
            <div class="field"><label>Evaluador (usuario en sesión)</label><input class="input" [value]="evaluador" disabled /></div>
            <div class="field"><label>Modalidad (según el tipo de productor)</label><input class="input" [value]="p.modalidad === 'AREL' ? 'Subsistencia / AREL · 15 indicadores · 40/40/20' : 'Pequeños, medianos y grandes · 23 indicadores · 35/35/30'" disabled /></div>
          </div>
        }
        @case (2) {
          @if (plan(); as m) {
            @if (m.extrapolada) { <div class="alert w" style="margin-bottom:12px"><b>Verificación metodológica:</b> la metodología ICA solo define la muestra AREL para menos de 4 lotes. Se aplica provisionalmente la misma tabla del ICA; confírmalo con tu docente.</div> }
            <div class="alert i"><b>{{ m.especie }} · {{ m.lotes }} lote(s) sembrados:</b> {{ m.regla }} Debes evaluar <b>{{ m.requeridos }}</b>{{ m.todos ? ' (todos)' : '' }}.</div>
            <div class="sp"></div>
            <div class="row" style="margin-bottom:8px"><span class="small muted">Seleccionados: {{ sel().length }} de {{ m.requeridos }}</span>
              @if (!m.todos) { <button class="btn s right" (click)="sortear()">Sugerir al azar</button> }</div>
            <div class="cards g4">
              @for (n of m.nombresLotes; track n) { <label class="chk"><input type="checkbox" [checked]="sel().includes(n)" [disabled]="m.todos" (change)="toggle(n)" />{{ n }}</label> }
            </div>
          } @else { <div class="skeleton" style="height:120px"></div> }
        }
        @case (3) {
          <div class="fg">
            <div class="field"><label>Especie</label><input class="input" [value]="espNombre" disabled /></div>
            <div class="field"><label>Ejemplares a revisar por lote</label><input class="input" [value]="15" disabled />
              <small class="muted">La metodología indica 15 ejemplares por lote.</small></div>
            <div class="field"><label>Peso promedio (g) *</label><input class="input" type="number" min="1" [(ngModel)]="peso" /></div>
            <div class="field"><label>Lote de referencia *</label><select class="input" [(ngModel)]="lote">@for (x of sel(); track x) { <option [value]="x">{{ x }}</option> }</select></div>
          </div>
        }
      }
      @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }
      <div class="sp"></div>
      <div class="row">
        @if (paso() === 1) { <a class="btn" [routerLink]="['/app/predios', p.id]">Cancelar</a> } @else { <button class="btn" (click)="atras()">Volver</button> }
        <button class="btn p right" (click)="siguiente()" [disabled]="guardando()">{{ paso() === 3 ? 'Iniciar evaluación' : 'Continuar' }}</button>
      </div>
    </div>
    } @else { <div class="skeleton" style="height:260px"></div> }`,
})
export class EvalWizard implements OnInit {
  private api = inject(ApiService); private auth = inject(AuthService); private route = inject(ActivatedRoute);
  private router = inject(Router); private ui = inject(UiService);
  pasos = ['Especie y datos', 'Lotes a muestrear', 'Información de peces'];
  paso = signal(1); error = signal(''); guardando = signal(false);
  predio = signal<Predio | null>(null); plan = signal<PlanMuestreo | null>(null); sel = signal<string[]>([]);
  evaluador = this.auth.usuario()?.nombre || '';
  fecha = new Date().toISOString().slice(0, 10);
  espId = 0; espNombre = ''; peso: number | string = ''; lote = '';

  async ngOnInit() {
    const p = await this.api.get<Predio>('/predios/' + this.route.snapshot.paramMap.get('id'));
    this.predio.set(p);
    if (p.inv.length === 1) this.elegirEspecie(p.inv[0]);
  }
  elegirEspecie(i: InventarioItem) { this.espId = i.espId!; this.espNombre = i.esp; this.peso = Number(i.peso) || ''; }
  toggle(n: string) {
    const r = this.plan()?.requeridos ?? 0; const cur = this.sel();
    if (cur.includes(n)) this.sel.set(cur.filter((x) => x !== n));
    else if (cur.length < r) this.sel.set([...cur, n]); else this.ui.toast('Ya seleccionaste ' + r + ' lote(s)', 'info');
  }
  sortear() {
    const m = this.plan(); if (!m) return;
    const mezcla = [...m.nombresLotes].sort(() => Math.random() - 0.5).slice(0, m.requeridos ?? 0);
    this.sel.set(m.nombresLotes.filter((n) => mezcla.includes(n)));
  }
  atras() { this.error.set(''); this.paso.update((p) => p - 1); }
  async siguiente() {
    this.error.set('');
    const p = this.predio()!;
    if (this.paso() === 1) {
      if (!this.espId) return this.error.set('Selecciona la especie que vas a evaluar.');
      if (!this.fecha) return this.error.set('Indica la fecha.');
      try {
        const m = await this.api.get<PlanMuestreo>(`/predios/${p.id}/muestreo`, { especie: this.espId });
        this.plan.set(m); this.sel.set(m.todos ? m.nombresLotes : []); this.paso.set(2);
      } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo calcular el muestreo'); }
      return;
    }
    if (this.paso() === 2) {
      const r = this.plan()?.requeridos;
      if (!r || this.sel().length !== r) return this.error.set('Debes seleccionar exactamente ' + r + ' lote(s).');
      this.lote = this.sel()[0]; this.paso.set(3); return;
    }
    if (!(+this.peso > 0)) return this.error.set('Indica un peso promedio mayor que cero.');
    this.guardando.set(true);
    try {
      const e = await this.api.post<Evaluacion>('/evaluaciones', {
        predioId: p.id, especieId: this.espId, fecha: this.fecha, sel: this.sel(),
        peces: { esp: this.espNombre, cant: 15, peso: +this.peso, lote: this.lote },
      });
      this.ui.toast('Evaluación creada'); this.router.navigate(['/app/evaluacion', e.id, 'indicadores']);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo crear'); } finally { this.guardando.set(false); }
  }
}
