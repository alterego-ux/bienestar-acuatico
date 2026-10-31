import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';
import { PageHead } from '../shared/widgets';
import { AYUDA, LIBERTADES_L, PDF_URL } from '../core/contenido';

@Component({
  selector: 'app-config', imports: [FormsModule, PageHead],
  template: `
    <app-head titulo="Configuración" sub="Tu cuenta" />
    <div class="cards g2 rise">
      <div class="card"><h3>Mi perfil</h3><div class="sp-sm"></div>
        <div class="small"><span class="muted">Nombre:</span> {{ auth.usuario()?.nombre }}</div><div class="small"><span class="muted">Correo:</span> {{ auth.usuario()?.email }}</div>
        <div class="small"><span class="muted">Rol:</span> {{ auth.usuario()?.rolNombre || auth.rol() }}</div></div>
      <div class="card"><h3>Cambiar contraseña</h3>
        <div class="field"><label>Actual</label><input class="input" type="password" [(ngModel)]="actual" /></div>
        <div class="field"><label>Nueva (mín. 4)</label><input class="input" type="password" [(ngModel)]="nueva" /></div>
        @if (error()) { <div class="err">{{ error() }}</div> }
        <button class="btn p" (click)="cambiar()">Actualizar contraseña</button></div>
    </div>`,
})
export class Config {
  auth = inject(AuthService); private ui = inject(UiService); actual = ''; nueva = ''; error = signal('');
  async cambiar() {
    this.error.set('');
    try { await this.auth.cambiarClave(this.actual, this.nueva); this.actual = ''; this.nueva = ''; this.ui.toast('Contraseña actualizada'); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'Error'); }
  }
}

@Component({
  selector: 'app-ayuda', imports: [PageHead],
  template: `
    <app-head titulo="Ayuda" sub="Preguntas frecuentes y guía de calificación"><a class="btn p s" [href]="pdf" target="_blank" rel="noopener">Metodología ICA (PDF) ↗</a></app-head>
    <div class="faq rise">@for (a of faq; track a[0]) { <details><summary>{{ a[0] }}</summary><p class="muted">{{ a[1] }}</p></details> }</div>
    <div class="sp"></div>
    <div class="card"><h3>Escala de puntos por indicador</h3>
      <div class="cards g4">
        <div><b style="color:var(--ok);font-size:1.4rem">100</b><div class="small muted">Cumple totalmente</div></div>
        <div><b style="color:var(--info);font-size:1.4rem">55</b><div class="small muted">Cumple en gran parte</div></div>
        <div><b style="color:var(--warn);font-size:1.4rem">20</b><div class="small muted">Cumple parcialmente</div></div>
        <div><b style="color:var(--danger);font-size:1.4rem">0</b><div class="small muted">No cumple</div></div>
      </div></div>
    <div class="sp"></div>
    <div class="card"><h3>Flujo de una evaluación</h3>
      <ol class="small" style="padding-left:20px">
        <li>Registra el predio con sus especies y el número de lotes de cada una.</li><li>Abre el predio y pulsa «Nueva evaluación»: elige la especie; el sistema calcula los lotes a muestrear.</li>
        <li>Diligencia los indicadores (recursos, animal y gestión) con observaciones y evidencias.</li><li>Revisa el resumen y finaliza la evaluación.</li>
        <li>Consulta la clasificación, las recomendaciones (criterios con 0 puntos) y el informe.</li><li>El docente valida y cierra.</li>
      </ol></div>`,
})
export class Ayuda { faq = AYUDA; pdf = PDF_URL; }

@Component({
  selector: 'app-conocenos', imports: [PageHead],
  template: `
    <app-head titulo="Conócenos" sub="Acerca de la plataforma" />
    <div class="cards g2 rise">
      <div class="card"><h3>¿Qué es Bienestar Acuático?</h3>
        <p class="small muted">Aplicación web para evaluar el bienestar animal en predios de producción de peces para consumo humano. Apoya la evaluación académica de bienestar animal: registra predios, organiza indicadores, calcula puntajes y genera recomendaciones e informes. No es una herramienta oficial del ICA.</p></div>
      <div class="card"><h3>Metodología</h3>
        <p class="small muted">Basada en la metodología del ICA (v2.0, 2024) elaborada con FEDEACUA, Universidad Antonio Nariño, Universidad Nacional y AGROSAVIA.</p></div>
    </div><div class="sp"></div>
    <div class="card"><h3>Cinco libertades del bienestar animal</h3>
      <div class="tag-row">@for (l of libs; track l) { <span class="tag">{{ l }}</span> }</div></div><div class="sp"></div>
    <div class="cards g3">
      <div class="card"><h3>3 tipos de medida</h3><p class="small muted">Recursos (entorno), animal (estado de los peces) y gestión (procedimientos del productor).</p></div>
      <div class="card"><h3>Arquitectura</h3><p class="small muted">Frontend Angular 22 (componentes standalone y signals), API Node.js + Express y base de datos PostgreSQL / Supabase.</p></div>
      <div class="card"><h3>Este prototipo</h3><p class="small muted">Prototipo académico. Los datos se guardan en la base de datos del proyecto.</p></div>
    </div>`,
})
export class Conocenos { libs = LIBERTADES_L; }
