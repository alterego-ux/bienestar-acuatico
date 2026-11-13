import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { Evaluacion, Predio } from '../core/models';
import { PageHead, fd, pc } from '../shared/widgets';

@Component({
  selector: 'app-inicio', imports: [RouterLink, PageHead],
  template: `
    <app-head [titulo]="'Hola, ' + nombre()" sub="Panel de control" />
    <div class="banner rise">
      <h2>Bienestar animal en peces de cultivo</h2>
      <p>Abre un predio para consultar su información, su historial y evaluarlo con la metodología ICA v2.0. Los informes son simulaciones académicas, no documentos oficiales del ICA.</p>
    </div>
    <div class="cards g4">
      @for (t of tiles(); track t[1]) {
        <a class="card tile" [routerLink]="['/app', t[0]]"><div class="tile-ic">{{ t[2] }}</div><h3>{{ t[1] }}</h3><span class="muted small">{{ t[3] }}</span></a>
      }
    </div>
    <div class="sp"></div>
    <div class="cards g4">
      <div class="card kpi"><b>{{ activos() }}</b><span>Predios activos</span></div>
      <div class="card kpi"><b>{{ evals().length }}</b><span>Evaluaciones registradas</span></div>
      <div class="card kpi"><b>{{ enProceso().length }}</b><span>En proceso</span></div>
      <div class="card kpi"><b>{{ promedio() }}</b><span>Puntaje promedio válido</span></div>
    </div>
    <div class="sp"></div>
    <div class="cards g2">
      <div class="card" style="padding:0"><h3 style="padding:16px 20px 0">Evaluaciones en proceso</h3>
        @for (e of enProceso(); track e.id) {
          <div class="li" (click)="ir('evaluacion/' + e.id + '/indicadores')">
            <div style="flex:1"><b>{{ e.predio_nombre }}</b> · {{ e.esp }}<div class="tiny muted">{{ fd(e.fecha) }} · {{ e.ev }}</div></div>
            <span class="small muted">{{ e.reg }}</span></div>
        } @empty { <p class="muted small" style="padding:0 20px 16px">Sin evaluaciones pendientes.</p> }
      </div>
      <div class="card" style="padding:0"><h3 style="padding:16px 20px 0">Predios</h3>
        @for (p of predios().slice(0, 5); track p.id) {
          <div class="li" (click)="ir('predios/' + p.id)"><div style="flex:1"><b>{{ p.n }}</b><div class="tiny muted">{{ (p.inv || []).map(aNombre).join(', ') }}</div></div><span class="muted">›</span></div>
        } @empty { <p class="muted small" style="padding:0 20px 16px">Aún no hay predios.</p> }
      </div>
    </div>`,
})
export class Inicio implements OnInit {
  private auth = inject(AuthService); private api = inject(ApiService); private router = inject(Router);
  fd = fd; aNombre = (i: { esp: string }) => i.esp;
  evals = signal<Evaluacion[]>([]); predios = signal<Predio[]>([]);
  nombre = () => (this.auth.usuario()?.nombre || '').split(' ')[0];
  activos = () => this.predios().filter((p) => p.act).length;
  enProceso = () => this.evals().filter((e) => e.est === 'en_proceso' || e.est === 'borrador');
  hechas = () => this.evals().filter((e) => ['finalizada', 'validada', 'cerrada'].includes(e.est));
  promedio = () => { const v = this.hechas().filter((e) => e.puntaje_global !== null).map((e) => Number(e.puntaje_global)); return v.length ? pc(v.reduce((a, b) => a + b, 0) / v.length) : '—'; };
  tiles = () => [
    ['predios', 'Predios y evaluaciones', '⌂', 'Abre un predio para evaluarlo'],
    ['evaluaciones', 'Evaluaciones en curso', '✎', 'Continúa donde quedaste'],
    ['tablero', 'Tablero', '▤', 'Indicadores agregados'],
    this.auth.esAdmin() ? ['administracion', 'Administración', '⚙', 'Usuarios y auditoría'] : ['especies', 'Tipos de especies', '◈', 'Parámetros de referencia'],
  ];
  ir(r: string) { this.router.navigate(['/app', ...r.split('/')]); }
  async ngOnInit() {
    const [e, p] = await Promise.all([this.api.get<Evaluacion[]>('/evaluaciones'), this.api.get<Predio[]>('/predios')]);
    this.evals.set(e); this.predios.set(p);
  }
}
