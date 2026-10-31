import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CatalogoService } from '../core/catalogo.service';
import { UiService } from '../core/ui.service';
import { Departamento, Especie, InventarioItem, Predio } from '../core/models';
import { PageHead } from '../shared/widgets';

@Component({
  selector: 'app-predios', imports: [FormsModule, RouterLink, PageHead],
  template: `
    <app-head titulo="Predios" sub="Un espacio central para organizar fincas, especies, inventario y evaluaciones">
      @if (auth.puedeEscribir()) { <a class="btn accent" routerLink="/app/predios/nuevo">＋ Registrar predio</a> }
    </app-head>
    <section class="predios-toolbar rise">
      <div class="predios-search"><span aria-hidden="true">⌕</span><input class="input" aria-label="Buscar predios" placeholder="Buscar predio, código, responsable o ubicación…" [ngModel]="q()" (ngModelChange)="q.set($event)" /></div>
      <div class="predios-count"><b>{{ filtrados().length }}</b><span>{{ filtrados().length === 1 ? 'predio visible' : 'predios visibles' }}</span></div>
    </section>
    @if (cargando()) {
      <div class="predio-grid"><div class="skeleton" style="height:230px"></div><div class="skeleton" style="height:230px"></div><div class="skeleton" style="height:230px"></div></div>
    } @else {
      <div class="predio-grid rise">
        @for (p of filtrados(); track p.id) {
          <article class="predio-card">
            <div class="predio-card-top"><span class="predio-code">{{ p.cod }}</span>@if (p.act) { <span class="bd b-ok">Activo</span> } @else { <span class="bd b-na">Inactivo</span> }</div>
            <div class="predio-mark" aria-hidden="true">⌂</div>
            <h3>{{ p.n }}</h3>
            <p class="predio-location"><span aria-hidden="true">⌖</span> {{ p.mun }}, {{ p.dep }}<small>{{ p.ver || 'Vereda no registrada' }}</small></p>
            <div class="predio-divider"></div>
            <div class="predio-facts"><div><span>Responsable</span><b>{{ p.resp }}</b></div><div><span>Especies</span><b>{{ (p.inv || []).length }}</b></div><div><span>Lotes registrados</span><b>{{ lotesTotal(p) }}</b></div></div>
            <div class="predio-species">@if (p.inv?.length) { @for (item of p.inv; track item.espId || item.esp) { <span>{{ item.esp }}</span> } } @else { <span>Sin especies</span> }</div>
            <div class="predio-contact"><span aria-hidden="true">☎</span><div>@if (p.telefono) { <a [href]="'tel:' + p.telefono">{{ p.telefono }}</a> } @else { <span>Teléfono no registrado</span> }<small>{{ p.mail }}</small></div></div>
            <a class="predio-open" [routerLink]="['/app/predios', p.id]">Ver ficha del predio <span aria-hidden="true">↗</span></a>
          </article>
        } @empty {
          <div class="predio-empty"><span>⌕</span><h3>No encontramos predios</h3><p>Prueba con otro término de búsqueda o registra un predio nuevo.</p>@if (auth.puedeEscribir()) { <a class="btn p" routerLink="/app/predios/nuevo">Registrar un predio</a> }</div>
        }
      </div>
    }`,
})
export class Predios implements OnInit {
  auth = inject(AuthService); private api = inject(ApiService);
  q = signal(''); lista = signal<Predio[]>([]); cargando = signal(true);
  filtrados = computed(() => {
    const q = this.q().toLowerCase();
    return this.lista().filter((p) => !q || (p.n + p.cod + p.resp + p.mun + p.dep + (p.telefono || '') + p.mail).toLowerCase().includes(q));
  });
  nombresEsp = (p: Predio) => (p.inv || []).map((i) => i.esp).filter(Boolean).join(', ');
  lotesTotal = (p: Predio) => (p.inv || []).reduce((s, i) => s + (Number(i.lotes) || 0), 0);
  async ngOnInit() { this.lista.set(await this.api.get<Predio[]>('/predios')); this.cargando.set(false); }
}

type Form = Omit<Predio, 'id' | 'lat' | 'lng'> & { id?: number; lat: string; lng: string };

@Component({
  selector: 'app-predio-form', imports: [FormsModule, RouterLink, PageHead],
  template: `
    <app-head [titulo]="id ? 'Editar predio' : 'Registrar predio'" sub="Completa los datos del predio y los lotes de cada especie" crumb="Predios" crumbLink="/app/predios" />
    @if (listo()) {
    <div class="card rise"><div class="fg">
      <div class="field"><label>Código del predio *</label><input class="input" [(ngModel)]="f.cod" [disabled]="ro" /></div>
      <div class="field"><label>Nombre del predio *</label><input class="input" [(ngModel)]="f.n" [disabled]="ro" /></div>
      <div class="field"><label>Responsable *</label><input class="input" [(ngModel)]="f.resp" [disabled]="ro" /></div>
      <div class="field"><label>Correo del responsable *</label><input class="input" type="email" [(ngModel)]="f.mail" [disabled]="ro" /></div>
      <div class="field"><label>Teléfono de contacto</label><input class="input" type="tel" autocomplete="tel" inputmode="tel" placeholder="Ej. +57 300 123 4567" [(ngModel)]="f.telefono" [disabled]="ro" maxlength="40" /><small class="muted tiny">Opcional. Admite prefijos internacionales.</small></div>
      <div class="field full"><label>Tipo de predio / productor *</label>
        <select class="input" [(ngModel)]="f.tipo" [disabled]="ro"><option value="">Seleccionar</option>@for (t of tipos(); track t) { <option [value]="t">{{ t }}</option> }</select></div>
      <div class="field full"><label>Sistema productivo *</label>
        <div>@for (s of sistemas(); track s) { <label class="chk"><input type="checkbox" [checked]="f.sis.includes(s)" (change)="toggleSis(s)" [disabled]="ro" />{{ s }}</label> }</div></div>
      <div class="field"><label>Departamento *</label>
        <select class="input" [ngModel]="f.dep" (ngModelChange)="cambiaDep($event)" [disabled]="ro"><option value="">Seleccionar</option>@for (d of deptos(); track d.id) { <option [value]="d.nombre">{{ d.nombre }}</option> }</select></div>
      <div class="field"><label>Municipio *</label>
        <select class="input" [(ngModel)]="f.mun" [disabled]="ro"><option value="">Seleccionar</option>@for (m of municipios(); track m) { <option [value]="m">{{ m }}</option> }</select></div>
      <div class="field"><label>Vereda</label><input class="input" [(ngModel)]="f.ver" [disabled]="ro" /></div>
      <div class="field"><label>Dirección</label><input class="input" [(ngModel)]="f.dir" [disabled]="ro" /></div>
      <div class="field"><label>Latitud (opcional)</label><input class="input" [(ngModel)]="f.lat" [disabled]="ro" /></div>
      <div class="field"><label>Longitud (opcional)</label><input class="input" [(ngModel)]="f.lng" [disabled]="ro" /></div>
    </div>
    <div class="sp"></div><h3>Especies y lotes sembrados *</h3>
    <p class="small muted">Los lotes se crean aquí, al registrar el predio. Cada especie se evalúa por separado y, al evaluar, el sistema calcula cuántos lotes se muestrean (menos de 4: todos · 4 a 9: 3 · más de 9: 4).</p>
    @for (r of f.inv; track $index) {
      <div class="row" style="margin-bottom:8px;align-items:flex-end">
        <div class="field" style="flex:1;min-width:150px;margin:0"><label>Especie</label>
          <select class="input" [(ngModel)]="r.esp" [disabled]="ro"><option value="">Seleccionar</option>@for (e of especies(); track e) { <option [value]="e">{{ e }}</option> }</select></div>
        <div class="field" style="width:130px;margin:0"><label>Nº de lotes *</label><input class="input" type="number" min="1" step="1" [(ngModel)]="r.lotes" [disabled]="ro" /></div>
        <div class="field" style="width:120px;margin:0"><label>Cantidad de peces</label><input class="input" type="number" min="0" [(ngModel)]="r.cant" [disabled]="ro" /></div>
        <div class="field" style="width:130px;margin:0"><label>Peso prom. (g)</label><input class="input" type="number" min="0" [(ngModel)]="r.peso" [disabled]="ro" /></div>
        @if (!ro) { <button class="btn s d" (click)="quitar($index)">Quitar</button> }
      </div>
    }
    @if (!ro) { <button class="btn s" (click)="agregar()">+ Agregar especie</button> }
    <div class="sp"></div>
    <label class="chk" style="max-width:240px"><input type="checkbox" [(ngModel)]="f.act" [disabled]="ro" />Predio activo</label>
    @if (error()) { <div class="err">{{ error() }}</div> }
    <div class="sp"></div>
    <div class="row"><a class="btn" [routerLink]="id ? ['/app/predios', id] : ['/app/predios']">Volver</a>
      @if (!ro) { <button class="btn p" (click)="guardar()" [disabled]="guardando()">Guardar predio</button> }
      @if (id && !ro) { <button class="btn d right" (click)="eliminar()">Eliminar</button> }
    </div></div>
    } @else { <div class="skeleton" style="height:320px"></div> }`,
})
export class PredioForm implements OnInit {
  private api = inject(ApiService); private cat = inject(CatalogoService); private router = inject(Router);
  private route = inject(ActivatedRoute); private ui = inject(UiService); auth = inject(AuthService);
  id: number | null = null; ro = !this.auth.puedeEscribir();
  f: Form = this.vacio();
  listo = signal(false); error = signal(''); guardando = signal(false);
  tipos = signal<string[]>([]); sistemas = signal<string[]>([]); deptos = signal<Departamento[]>([]); especies = signal<string[]>([]);
  dep = signal('');
  municipios = computed(() => this.deptos().find((d) => d.nombre === this.dep())?.municipios ?? []);

  private vacio(): Form { return { cod: '', n: '', resp: '', mail: '', telefono: '', tipo: '', sis: [], dep: '', mun: '', ver: '', dir: '', lat: '', lng: '', act: true, inv: [{ esp: '', cant: '', peso: '', lotes: '' }] }; }
  async ngOnInit() {
    const [tp, sis, dep, esp] = await Promise.all([this.cat.tiposProductor(), this.cat.sistemas(), this.cat.departamentos(), this.cat.especies()]);
    this.tipos.set(tp.map((t) => t.nombre || t.n || '')); this.sistemas.set(sis.map((s) => s.nombre || s.n || ''));
    this.deptos.set(dep); this.especies.set(esp.filter((e: Especie) => e.act).map((e: Especie) => e.n));
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p;
      const d = await this.api.get<Predio>('/predios/' + p);
      this.f = { ...this.vacio(), ...d, lat: d.lat ?? '', lng: d.lng ?? '', inv: d.inv?.length ? d.inv.map((i) => ({ ...i })) : [{ esp: '', cant: '', peso: '', lotes: '' }] } as Form;
      this.dep.set(d.dep || '');
    } else {
      this.f.cod = 'PRD-' + String(Date.now()).slice(-5);
    }
    this.listo.set(true);
  }
  cambiaDep(v: string) { this.f.dep = v; this.f.mun = ''; this.dep.set(v); }
  toggleSis(s: string) { const i = this.f.sis.indexOf(s); if (i >= 0) this.f.sis.splice(i, 1); else this.f.sis.push(s); }
  agregar() { this.f.inv.push({ esp: '', cant: '', peso: '', lotes: '' } as InventarioItem); }
  quitar(i: number) { this.f.inv.splice(i, 1); if (!this.f.inv.length) this.agregar(); }
  async guardar() {
    const f = this.f; this.error.set('');
    if (!f.cod || !f.n || !f.resp || !f.mail) return this.error.set('Completa código, nombre, responsable y correo.');
    if (!f.tipo || !f.sis.length || !f.dep || !f.mun) return this.error.set('Selecciona tipo, sistema, departamento y municipio.');
    const filas = f.inv.filter((r) => r.esp);
    if (!filas.length) return this.error.set('Registra al menos una especie con su número de lotes.');
    if (filas.some((r) => !(Number(r.lotes) >= 1) || !Number.isInteger(Number(r.lotes)))) return this.error.set('Indica el número de lotes (entero ≥ 1) de cada especie.');
    if (new Set(filas.map((r) => r.esp)).size !== filas.length) return this.error.set('Una misma especie no puede repetirse en el predio.');
    const cuerpo = {
      cod: f.cod, n: f.n, resp: f.resp, mail: f.mail, telefono: f.telefono?.trim() || null, tipo: f.tipo, sis: f.sis, dep: f.dep, mun: f.mun, ver: f.ver, dir: f.dir,
      lat: f.lat === '' ? null : f.lat, lng: f.lng === '' ? null : f.lng, act: f.act,
      inv: f.inv.filter((r) => r.esp).map((r) => ({ esp: r.esp, cant: Number(r.cant) || 0, peso: Number(r.peso) || 0, lotes: Number(r.lotes) || 0 })),
    };
    this.guardando.set(true);
    try {
      const g = this.id ? await this.api.put<Predio>('/predios/' + this.id, cuerpo) : await this.api.post<Predio>('/predios', cuerpo);
      this.ui.toast('Predio guardado'); this.router.navigate(['/app/predios', g.id]);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'Error al guardar'); } finally { this.guardando.set(false); }
  }
  eliminar() {
    this.ui.confirmar('Se eliminará el predio y sus evaluaciones asociadas.', async () => {
      try { await this.api.delete('/predios/' + this.id); this.ui.toast('Predio eliminado'); this.router.navigateByUrl('/app/predios'); } catch (e) { this.ui.error(e); }
    });
  }
}
