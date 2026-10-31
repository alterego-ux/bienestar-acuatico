import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CatalogoService } from '../core/catalogo.service';
import { UiService } from '../core/ui.service';
import { EvaluacionDetalle, Indicador, MEDIDAS, TipoMedida } from '../core/models';
import { BadgeCls, PageHead, Ring, fd, pc } from '../shared/widgets';

const LBL: Record<string, string> = { ok: 'Completado', pe: 'Pendiente', na: 'No aplica' };

@Component({
  selector: 'app-ind-lista', imports: [RouterLink, PageHead, Ring],
  template: `
    @if (d(); as d) {
      <app-head titulo="Indicadores" [sub]="d.evaluacion.predio_nombre + ' · ' + d.evaluacion.esp + ' · ' + d.evaluacion.reg" crumb="Evaluaciones" crumbLink="/app/evaluaciones" />
      <div class="card rise" style="margin-bottom:16px"><div class="row">
        <div style="flex:1;min-width:200px">
          <div class="small muted">Avance general</div>
          <div class="bar" style="margin:8px 0"><i [style.width.%]="avance()"></i></div>
          <div class="small">{{ d.calculo.done + d.calculo.na }} de {{ d.calculo.count }} indicadores</div>
        </div>
        <app-ring [valor]="avance()" [size]="72" color="#1f3a5f" [label]="pc(avance())" [sw]="8" />
      </div></div>
      <div class="tabs">
        @for (k of tipos; track k) {
          <button [class.on]="tab() === k" (click)="tab.set(k)">{{ k }} · {{ M[k].n }} ({{ hechos(k) }}/{{ itemsDe(k).length }})</button>
        }
      </div>
      <div class="card" style="padding:0">
        <div class="small muted" style="padding:14px 16px;border-bottom:1px solid var(--line)">{{ M[tab()].full }} · peso {{ d.calculo.pesos[tab()] }}%</div>
        @for (x of itemsDe(tab()); track x.indicador.codigo) {
          <div class="li" [routerLink]="['/app/evaluacion', d.evaluacion.id, 'indicador', x.indicador.codigo]">
            <div style="flex:1"><b>{{ x.indicador.codigo }}</b> · {{ x.indicador.nombre }}
              <div class="tiny muted">{{ x.estado === 'ok' ? x.respuesta.puntaje + ' puntos' : '' }}</div></div>
            <span class="bd" [class]="'bd b-' + x.estado">{{ lbl[x.estado] }}</span><span class="muted">›</span>
          </div>
        }
      </div>
      <div class="sp"></div>
      <div class="row"><a class="btn" routerLink="/app/evaluaciones">Guardar y salir</a>
        <a class="btn p right" [routerLink]="['/app/evaluacion', d.evaluacion.id, 'resumen']">Siguiente: resumen</a></div>
    } @else { <div class="skeleton" style="height:300px"></div> }`,
})
export class IndLista implements OnInit {
  private api = inject(ApiService); private route = inject(ActivatedRoute);
  M = MEDIDAS; lbl = LBL; pc = pc; tipos: TipoMedida[] = ['MBR', 'MBA', 'MBG'];
  d = signal<EvaluacionDetalle | null>(null); tab = signal<TipoMedida>('MBR');
  avance = computed(() => { const c = this.d()?.calculo; return c ? ((c.done + c.na) / c.count) * 100 : 0; });
  itemsDe = (k: TipoMedida) => (this.d()?.calculo.items ?? []).filter((x) => x.indicador.tipo_medida === k);
  hechos = (k: TipoMedida) => this.itemsDe(k).filter((x) => x.estado !== 'pe').length;
  async ngOnInit() { this.d.set(await this.api.get<EvaluacionDetalle>('/evaluaciones/' + this.route.snapshot.paramMap.get('id'))); }
}

@Component({
  selector: 'app-ind-detalle', imports: [FormsModule, RouterLink, PageHead],
  template: `
    @if (ind(); as i) {
      <app-head [titulo]="'Indicador ' + i.codigo + ' · ' + i.n" [sub]="M[i.t].full + ' · ' + i.lib" crumb="Indicadores" [crumbLink]="'/app/evaluacion/' + id + '/indicadores'" />
      <div class="tabs">@for (t of tabs; track t[0]) { <button [class.on]="tab() === t[0]" (click)="tab.set(t[0])">{{ t[1] }}</button> }</div>
      <div class="card rise">
        @if (tab() === 'p') {
          <p><b>{{ i.q }}</b></p>
          <p class="tiny muted">Método: {{ i.met }}</p>
          @for (n of i.niveles; track n.puntaje) {
            <label class="opt" [class.sel]="score() === n.puntaje">
              <input type="radio" name="sc" [checked]="score() === n.puntaje" [disabled]="!edit()" (change)="score.set(n.puntaje)" />
              <b>{{ n.puntaje }}</b><span>{{ n.descripcion }}</span></label>
          }
          @if (i.na) {
            <label class="opt" [class.sel]="score() === 'NA'">
              <input type="radio" name="sc" [checked]="score() === 'NA'" [disabled]="!edit()" (change)="score.set('NA')" />
              <b>N/A</b><span>{{ i.na }}</span></label>
          }
          <div class="field" style="margin-top:14px"><label>Observaciones adicionales</label>
            <textarea class="input" placeholder="Escribe aquí…" [(ngModel)]="obs" [disabled]="!edit()"></textarea></div>
        }
        @if (tab() === 'e') {
          <p class="muted small">Adjunta fotografías, documentos o videos cortos como evidencia (se guardan en el servidor).</p>
          @if (!respuestaId()) { <div class="alert i">Guarda primero el indicador para poder adjuntar evidencias.</div> }
          @else if (edit()) {
            <label class="card up-box evidence-drop" (dragover)="prevenirDrop($event)" (drop)="soltar($event)">
              <span class="evidence-upload-mark" aria-hidden="true">↑</span><b>Arrastra una evidencia aquí</b><span>o selecciona una fotografía, PDF o video corto</span><small>Máximo 15 MB por archivo · se guarda en el servidor</small>
              <input class="evidence-file-input" type="file" accept="image/*,.pdf,video/*" aria-label="Seleccionar evidencia" (change)="subir($event)" />
            </label>
          }
          <div class="sp"></div>
          <div class="evidence-gallery">
            @for (f of evid(); track f.id) {
              <article class="evidence-item">
                @if (f.url && esImagen(f)) { <a class="evidence-preview" [href]="f.url" target="_blank" rel="noopener" [attr.aria-label]="'Abrir fotografía ' + f.name"><img [src]="f.url" [alt]="'Evidencia fotográfica: ' + f.name" loading="lazy" /><span>Ver fotografía ↗</span></a> }
                @else if (f.url && esVideo(f)) { <video class="evidence-video" [src]="f.url" controls preload="metadata">Tu navegador no puede reproducir este video.</video> }
                @else if (f.url) { <a class="evidence-file-card" [href]="f.url" target="_blank" rel="noopener"><span class="evidence-file-mark" aria-hidden="true">▤</span><b>{{ f.name }}</b><small>{{ f.type || 'Archivo adjunto' }}</small><span>Abrir archivo ↗</span></a> }
                @else { <div class="evidence-file-card"><span class="evidence-file-mark" aria-hidden="true">◌</span><b>{{ f.name }}</b><small>Vista previa no disponible</small></div> }
                <div class="evidence-caption"><b [title]="f.name">{{ f.name }}</b><span>{{ formatoTamano(f.size) }}</span></div>
              </article>
            } @empty { <div class="evidence-empty"><span aria-hidden="true">▧</span><b>Sin evidencias adjuntas</b><small>Las fotografías que cargues aparecerán aquí para poder revisarlas.</small></div> }
          </div>
        }
        @if (error()) { <div class="err">{{ error() }}</div> }
        <div class="sp"></div>
        <div class="row"><a class="btn" [routerLink]="['/app/evaluacion', id, 'indicadores']">Cancelar</a>
          @if (edit()) { <button class="btn p right" (click)="guardar()" [disabled]="guardando()">Guardar indicador</button> }</div>
      </div>
    } @else { <div class="skeleton" style="height:300px"></div> }`,
})
export class IndDetalle implements OnInit, OnDestroy {
  private api = inject(ApiService); private cat = inject(CatalogoService); private route = inject(ActivatedRoute);
  private router = inject(Router); private ui = inject(UiService); private auth = inject(AuthService);
  M = MEDIDAS; tabs: [string, string][] = [['p', 'Preguntas'], ['e', 'Evidencias']];
  id = 0; codigo = '';
  ind = signal<Indicador | null>(null); tab = signal('p'); score = signal<number | 'NA' | null>(null);
  obs = ''; edit = signal(false); error = signal(''); guardando = signal(false);
  respuestaId = signal<number | null>(null);
  evid = signal<{ id: number; name: string; type?: string; size?: number; url?: string }[]>([]);
  private urlsTemporales = new Set<string>();

  async ngOnInit() {
    this.id = +this.route.snapshot.paramMap.get('id')!; this.codigo = this.route.snapshot.paramMap.get('codigo')!;
    const d = await this.api.get<EvaluacionDetalle>('/evaluaciones/' + this.id);
    const cat = await this.cat.indicadores(d.evaluacion.reg);
    const i = cat.find((x) => x.codigo === this.codigo);
    const r = d.evaluacion.resp?.[this.codigo];
    if (r) {
      this.respuestaId.set(r.id); this.obs = r.obs || '';
      this.score.set(r.no_aplica ? 'NA' : r.puntaje !== null ? Number(r.puntaje) : null);
      this.cargarEvid();
    }
    this.edit.set(this.auth.puedeEscribir() && ['en_proceso', 'borrador'].includes(d.evaluacion.est));
    this.ind.set(i ?? null);
  }
  async cargarEvid() {
    const id = this.respuestaId(); if (!id) return;
    const archivos = await this.api.get<{ id: number; name: string; type?: string; size?: number }[]>('/evidencias/' + id);
    this.liberarUrls();
    const conVista = await Promise.all(archivos.map(async (f) => {
      try {
        const blob = await this.api.blob('/evidencias/archivo/' + f.id);
        const tipo = String(f.type || '').toLowerCase();
        const tipoPrevisualizable = /^image\/(jpeg|jpg|png|gif|webp|avif|bmp|tiff)$/.test(tipo) || tipo === 'application/pdf' || /^video\/(mp4|webm|ogg|quicktime)$/.test(tipo);
        const contenido = tipoPrevisualizable ? blob : new Blob([blob], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(contenido); this.urlsTemporales.add(url);
        return { ...f, url };
      } catch { return { ...f, url: '' }; }
    }));
    this.evid.set(conVista);
  }
  esImagen(f: { type?: string }) { return /^image\/(jpeg|jpg|png|gif|webp|avif|bmp|tiff)$/i.test(f.type || ''); }
  esVideo(f: { type?: string }) { return /^video\/(mp4|webm|ogg|quicktime)$/i.test(f.type || ''); }
  formatoTamano(bytes?: number) {
    if (!Number.isFinite(bytes) || !bytes) return 'Tamaño no disponible';
    return bytes >= 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }
  prevenirDrop(event: DragEvent) { event.preventDefault(); }
  soltar(event: DragEvent) { event.preventDefault(); const f = event.dataTransfer?.files?.[0]; if (f) void this.subirArchivo(f); }
  subir(event: Event) {
    const input = event.target as HTMLInputElement; const f = input.files?.[0]; input.value = '';
    if (f) void this.subirArchivo(f);
  }
  private async subirArchivo(f: File) {
    this.error.set('');
    if (!/^(image\/|application\/pdf|video\/)/i.test(f.type)) return this.error.set('El archivo debe ser una imagen, un PDF o un video.');
    if (f.size > 15 * 1024 * 1024) return this.error.set('El archivo supera el límite de 15 MB.');
    if (!this.respuestaId()) return this.error.set('Guarda primero el indicador antes de adjuntar evidencia.');
    const fd = new FormData(); fd.append('respuesta_id', String(this.respuestaId())); fd.append('archivo', f);
    try { await this.api.post('/evidencias', fd); this.ui.toast('Evidencia subida'); await this.cargarEvid(); }
    catch (e) { this.ui.error(e); this.error.set(e instanceof Error ? e.message : 'No se pudo guardar la evidencia.'); }
  }
  ngOnDestroy() { this.liberarUrls(); }
  private liberarUrls() { for (const url of this.urlsTemporales) URL.revokeObjectURL(url); this.urlsTemporales.clear(); }
  async guardar() {
    this.error.set('');
    if (this.score() === null) return this.error.set('Selecciona un resultado.');
    this.guardando.set(true);
    try {
      await this.api.put(`/evaluaciones/${this.id}/respuestas/${this.codigo}`, { score: this.score(), obs: this.obs, calc: {} });
      this.ui.toast('Indicador guardado'); this.router.navigate(['/app/evaluacion', this.id, 'indicadores']);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'Error al guardar'); } finally { this.guardando.set(false); }
  }
}
