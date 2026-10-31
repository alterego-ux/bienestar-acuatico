import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { LIBERTADES_L, PDF_URL } from '../core/contenido';
import { ThemeToggle } from '../shared/theme-toggle';

const STATS: [string, string][] = [
  ['23', 'indicadores para pequeños, medianos y grandes acuicultores'],
  ['15', 'indicadores para acuicultura de subsistencia y AREL'],
  ['05', 'libertades que orientan la evaluación'],
  ['04', 'categorías para clasificar el bienestar'],
];
const FUNCIONES: [string, string, string][] = [
  ['01', 'Gestión de predios', 'Organiza responsables, ubicación, sistemas productivos, especies e inventario animal.'],
  ['02', 'Evaluación por especie', 'Recorre listas de chequeo por etapas, guarda avances y adjunta evidencias.'],
  ['03', 'Resultados accionables', 'Consulta puntajes, hallazgos críticos, recomendaciones e historial del predio.'],
];

@Component({
  selector: 'app-landing', imports: [RouterLink, ThemeToggle],
  template: `
    <header class="l-nav">
      <a class="l-brand" routerLink="/" aria-label="Bienestar Acuático, inicio" (click)="cerrarMenu()">
        <img src="Im/Logo.jpg" alt="" /><span>Bienestar <b>Acuático</b><small>AQUATIC PERFORMANCE</small></span>
      </a>
      <button class="l-menu-toggle" type="button" (click)="alternarMenu()" [attr.aria-expanded]="menuAbierto()" aria-controls="landing-navigation" [attr.aria-label]="menuAbierto() ? 'Cerrar menú' : 'Abrir menú'">
        <span aria-hidden="true">{{ menuAbierto() ? '×' : '☰' }}</span>
      </button>
      <nav class="l-links" id="landing-navigation" [class.open]="menuAbierto()" aria-label="Navegación principal">
        <a href="#metodologia" (click)="cerrarMenu()">Metodología</a>
        <a href="#funciones" (click)="cerrarMenu()">Plataforma</a>
        <a href="#galeria" (click)="cerrarMenu()">Galería</a>
        <a href="#libertades" (click)="cerrarMenu()">Bienestar animal</a>
        <div class="l-mobile-account">
          @if (auth.logueado()) { <a class="l-mobile-link" routerLink="/app/inicio" (click)="cerrarMenu()">Ir a la plataforma ↗</a> }
          @else { <a class="l-mobile-link" routerLink="/login" (click)="cerrarMenu()">Iniciar sesión</a><a class="l-mobile-link is-primary" routerLink="/registro" (click)="cerrarMenu()">Crear cuenta ↗</a> }
        </div>
      </nav>
      <div class="l-cta">
        <app-theme-toggle />
        @if (auth.logueado()) { <a class="btn p" routerLink="/app/inicio">Ir a la plataforma <span aria-hidden="true">↗</span></a> }
        @else { <a class="btn ghost l-login-link" routerLink="/login">Ingresar</a><a class="btn accent l-create-link" routerLink="/registro">Crear cuenta <span aria-hidden="true">↗</span></a> }
      </div>
    </header>

    <main>
      <section class="l-hero" aria-labelledby="landing-title">
        <div class="l-hero-orbit" aria-hidden="true"></div>
        <div class="l-hero-content rise">
          <div class="l-eyebrow"><span class="l-dot"></span> CIENCIA APLICADA <span class="l-eyebrow-divider">/</span> ACUICULTURA <span class="l-eyebrow-divider">/</span> BIENESTAR</div>
          <div class="l-hero-overline">AQUATIC PERFORMANCE <span>·</span> PLATAFORMA ACADÉMICA</div>
          <h1 id="landing-title">Bienestar que se observa.<br /><em>Decisiones que mejoran.</em></h1>
          <p>Evalúa el bienestar de los peces de cultivo con indicadores claros, evidencias organizadas y seguimiento por predio. Ciencia útil, datos con contexto y una visión más completa de cada sistema productivo.</p>
          <div class="l-actions">
            <a class="btn accent l-primary-action" [routerLink]="auth.logueado() ? '/app/inicio' : '/login'">Explorar la plataforma <span aria-hidden="true">↗</span></a>
            <a class="btn l-outline" [href]="pdf" target="_blank" rel="noopener">Ver metodología ICA <span aria-hidden="true">↗</span></a>
          </div>
          <div class="l-proof"><span class="l-proof-check" aria-hidden="true">✓</span><span>Evaluaciones estructuradas</span><i></i><span>Evidencias e historial por predio</span></div>
          <div class="l-hero-mini-stats" aria-label="Características principales">
            <div><b>01</b><span>Observa</span></div><div><b>02</b><span>Registra</span></div><div><b>03</b><span>Mejora</span></div>
          </div>
        </div>
        <div class="l-hero-visual" aria-label="Fotografía de peces de cultivo">
          <div class="l-photo-frame">
            <div class="l-photo-topline"><span><i></i> ENFOQUE ACUÍCOLA</span><span>01 — 03</span></div>
            <div class="l-main-photo"><img src="Im/peces/cardumen-ica.jpg" alt="Cardumen de peces de cultivo visto en el agua" fetchpriority="high" /></div>
            <div class="l-photo-caption"><span>DEL ESTANQUE AL DATO</span><b>Una mirada completa al bienestar.</b></div>
          </div>
          <div class="l-floating-card l-float-top"><span class="l-mini-icon" aria-hidden="true">◎</span><div><b>Evaluación trazable</b><small>Del campo al resultado</small></div></div>
          <div class="l-floating-card l-float-bottom"><span class="l-fish-mark" aria-hidden="true">≈</span><div><b>5 libertades</b><small>Una visión integral</small></div></div>
          <div class="l-index">OBSERVACIÓN <b> / EVIDENCIA / SEGUIMIENTO</b></div>
        </div>
        <a class="l-scroll-cue" href="#metodologia" aria-label="Desplazarse a la metodología"><span></span> DESCUBRE LA PLATAFORMA</a>
      </section>

      <section class="l-metrics" id="metodologia"><div class="l-in l-metrics-inner">
        <div class="l-section-label">01 / METODOLOGÍA ICA V2.0 <span class="l-label-line"></span><span class="l-label-note">Referente de evaluación</span></div>
        <div class="l-metric-grid">@for (s of stats; track s[0]) { <article class="l-metric"><b>{{ s[0] }}</b><span>{{ s[1] }}</span></article> }</div>
      </div></section>

      <section class="l-sec l-features" id="funciones"><div class="l-in">
        <div class="l-section-label">02 / HERRAMIENTAS CONECTADAS <span class="l-label-line"></span><span class="l-label-note">Un flujo sencillo y trazable</span></div>
        <div class="l-section-heading"><div><h2>De la observación a una <em>mejor decisión.</em></h2><p>Todo lo esencial para documentar y comprender cada evaluación, sin perder de vista el contexto del predio.</p></div><a class="l-text-link" [routerLink]="auth.logueado() ? '/app/inicio' : '/login'">Conocer el sistema <span aria-hidden="true">↗</span></a></div>
        <div class="l-feature-grid">@for (f of funciones; track f[0]) { <article class="l-feature"><span class="l-feature-num">{{ f[0] }}</span><div class="l-feature-arrow" aria-hidden="true">↗</div><div class="l-feature-symbol" aria-hidden="true">{{ f[0] === '01' ? '⌁' : f[0] === '02' ? '◉' : '↗' }}</div><h3>{{ f[1] }}</h3><p>{{ f[2] }}</p><span class="l-feature-rule"></span></article> }</div>
      </div></section>

      <section class="l-gallery" id="galeria" aria-labelledby="gallery-title"><div class="l-gallery-grid">
        <div class="l-gallery-copy"><div class="l-section-label">03 / EL CULTIVO EN CONTEXTO <span class="l-label-line"></span></div><h2 id="gallery-title">Primero observar.<br /><em>Después interpretar.</em></h2><p>El estado de los peces, la calidad del agua y las condiciones del sistema aportan contexto a la evaluación. Cada fotografía es ilustrativa: los hallazgos reales deben documentarse en el predio.</p><a class="l-text-link" [routerLink]="auth.logueado() ? '/app/predios' : '/login'">Gestionar predios <span aria-hidden="true">↗</span></a></div>
        <figure class="l-gallery-photo l-gallery-large"><img src="Im/Peces.JPG" alt="Peces de cultivo observados de cerca" loading="lazy" /><figcaption><b>01</b><span>Observación de peces</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://upload.wikimedia.org/wikipedia/commons/6/63/Tilapia_farm_california.jpg" alt="Tilapias en un estanque de cultivo en California" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/peces/cardumen-ica.jpg')" /><figcaption><b>02</b><span>Estanque de tilapia</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Nile_Tilapia.jpg/1280px-Nile_Tilapia.jpg" alt="Tilapias del Nilo en una instalación acuícola" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/Peces.JPG')" /><figcaption><b>03</b><span>Especies de cultivo</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://www.fws.gov/sites/default/files/styles/max_1300x1300/public/2021-08/tilapia-commercial-farm-credit-usfws.jpg?itok=51DOE8Xc" alt="Cardumen de tilapias en una granja comercial" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/peces/cardumen-ica.jpg')" /><figcaption><b>04</b><span>Producción acuícola</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://upload.wikimedia.org/wikipedia/commons/3/32/Tilapia_farm.jpg" alt="Sistema de cultivo de peces sobre un cuerpo de agua" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/sistemas/estanque-ica.jpg')" /><figcaption><b>05</b><span>Sistemas de producción</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Back-yard_summer_tilapia_pond.jpg" alt="Estanque pequeño de cultivo de tilapia" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/sistemas/estanque-ica.jpg')" /><figcaption><b>06</b><span>Entorno de cultivo</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Rainbow_Trout_(Oncorhynchus_mykiss).jpg" alt="Trucha arcoíris en el agua" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/Peces.JPG')" /><figcaption><b>07</b><span>Trucha arcoíris</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Fish_farm_water_aeration_system_in_operation_-_01.JPG" alt="Sistema de aireación para un estanque acuícola" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/sistemas/estanque-ica.jpg')" /><figcaption><b>08</b><span>Oxigenación del agua</span></figcaption></figure>
        <figure class="l-gallery-photo"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Fish_Farming_Pond.jpg" alt="Vista de un estanque para producción piscícola" loading="lazy" referrerpolicy="no-referrer" (error)="imagenAlterna($event, 'Im/sistemas/estanque-ica.jpg')" /><figcaption><b>09</b><span>Ambiente de producción</span></figcaption></figure>
      </div><div class="l-gallery-note"><span aria-hidden="true">ⓘ</span> Fotografías ilustrativas de fuentes identificadas. No representan evidencias de una evaluación específica.</div></section>

      <section class="l-sec l-liberties" id="libertades"><div class="l-in"><div class="l-section-label">04 / PRINCIPIOS DE BIENESTAR <span class="l-label-line"></span></div><div class="l-liberty-layout"><div><h2>Ver al animal.<br /><em>Entender su entorno.</em></h2><p class="l-lib-intro">La metodología relaciona medidas basadas en los recursos, en el animal y en la gestión con las cinco libertades del bienestar animal.</p><div class="tag-row l-lib-tags">@for (l of libs; track l) { <span class="tag">{{ l }}</span> }</div></div><div class="l-liberty-visual"><img src="Im/sistemas/estanque-ica.jpg" alt="Estanque piscícola, entorno relevante para evaluar el bienestar" loading="lazy" /><div class="l-liberty-photo-label"><span>CONTEXTO + OBSERVACIÓN</span><b>El entorno también cuenta.</b></div></div></div></div></section>

      <section class="l-bottom-cta"><div><div class="l-section-label">EMPIEZA AQUÍ <span class="l-label-line"></span></div><h2>Observa con intención.<br /><em>Evalúa con criterio.</em></h2><p>Centraliza la información y mantén cada evaluación conectada con su predio.</p></div><a class="btn accent" [routerLink]="auth.logueado() ? '/app/inicio' : '/login'">Entrar a Bienestar Acuático <span aria-hidden="true">↗</span></a></section>
    </main>
    <footer class="l-foot"><a class="l-brand" routerLink="/" (click)="cerrarMenu()"><img src="Im/Logo.jpg" alt=""/><span>Bienestar <b>Acuático</b><small>AQUATIC PERFORMANCE</small></span></a><p>Prototipo académico independiente basado en una metodología pública. No es un sistema oficial ni una certificación del ICA.</p><span>© Bienestar Acuático · Aquatic Performance</span></footer>`,
})
export class Landing {
  auth = inject(AuthService);
  stats = STATS;
  funciones = FUNCIONES;
  libs = LIBERTADES_L;
  pdf = PDF_URL;
  menuAbierto = signal(false);

  alternarMenu() { this.menuAbierto.update((abierto) => !abierto); }
  cerrarMenu() { this.menuAbierto.set(false); }

  /** Recurre a una imagen local cuando una fotografía remota no está disponible. */
  imagenAlterna(event: Event, fallback: string) {
    const image = event.currentTarget as HTMLImageElement | null;
    if (!image || image.dataset['fallbackApplied'] === 'true') return;
    image.dataset['fallbackApplied'] = 'true';
    image.alt = 'Fotografía local ilustrativa del proyecto; la imagen externa no está disponible.';
    const caption = image.closest('figure')?.querySelector('figcaption span');
    if (caption) caption.textContent = 'Referencia local';
    image.src = fallback;
  }
}
