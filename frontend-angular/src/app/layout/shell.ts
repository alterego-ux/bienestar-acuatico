import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { Evaluacion } from '../core/models';
import { ThemeToggle } from '../shared/theme-toggle';

interface NavItem { ruta: string; ic: string; t: string; w?: boolean; a?: boolean; }
const NAV: NavItem[] = [
  { ruta: 'inicio', ic: '▣', t: 'Inicio' },
  { ruta: 'predios', ic: '⌂', t: 'Predios y evaluaciones' },
  { ruta: 'evaluaciones', ic: '✎', t: 'Evaluaciones en curso', w: true },
  { ruta: 'tablero', ic: '▤', t: 'Tablero' },
  { ruta: 'especies', ic: '◈', t: 'Tipos de especies' },
  { ruta: 'administracion', ic: '⚙', t: 'Administración', a: true },
  { ruta: 'configuracion', ic: '☰', t: 'Configuración' },
  { ruta: 'conocenos', ic: 'ⓘ', t: 'Conócenos' },
  { ruta: 'ayuda', ic: '?', t: 'Ayuda' },
];

@Component({
  selector: 'app-shell', imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggle],
  template: `
    <div class="shell">
      @if (abierto()) { <button type="button" class="mobile-scrim" aria-label="Cerrar navegación" (click)="abierto.set(false)"></button> }
      <aside id="app-navigation" class="side" [class.open]="abierto()">
        <div class="side-brand"><img src="Im/Logo.jpg" alt="ICA" /><span>Bienestar Acuático</span></div>
        <div class="sec">Navegación</div>
        <nav class="nav">
          @for (n of nav(); track n.ruta) {
            <a [routerLink]="['/app', n.ruta]" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: n.ruta === 'inicio' }" (click)="abierto.set(false)">
              <span class="ic">{{ n.ic }}</span>{{ n.t }}
            </a>
          }
        </nav>
        <div class="side-user">
          <div class="avatar">{{ inicial() }}</div>
          <div style="min-width:0">
            <div class="u-name">{{ auth.usuario()?.nombre }}</div>
            <div class="tiny muted">{{ auth.usuario()?.rolNombre || auth.rol() }}</div>
          </div>
        </div>
      </aside>
      <div class="main">
        <div class="topbar">
          <button class="burger" (click)="abierto.set(!abierto())" [attr.aria-expanded]="abierto()" aria-controls="app-navigation" aria-label="Abrir o cerrar menú">☰</button>
          <span class="muted small">ICA v2.0 · Peces de cultivo</span>
          <span class="right"></span>
          <app-theme-toggle />
          <button class="btn s" (click)="verNotifs()" aria-label="Notificaciones">Pendientes @if (notifs().length) { <b style="color:var(--warn)">({{ notifs().length }})</b> }</button>
          <button class="btn s" (click)="auth.logout()">Salir</button>
        </div>
        @if (ddAbierto()) {
          <div style="position:relative">
            <div class="dd">
              <div style="padding:14px 16px;border-bottom:1px solid var(--line);font-weight:600">Notificaciones</div>
              @for (n of notifs(); track n.t) { <div class="li" (click)="ir(n.h)">{{ n.t }}</div> }
              @empty { <div class="li static muted">No tienes pendientes</div> }
            </div>
          </div>
        }
        <div class="page"><router-outlet /></div>
      </div>
    </div>`,
})
export class Shell {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  abierto = signal(false);
  ddAbierto = signal(false);
  notifs = signal<{ t: string; h: string }[]>([]);
  nav = computed(() => NAV.filter((n) => !(n.w && !this.auth.puedeEscribir()) && !(n.a && !this.auth.esAdmin())));
  inicial = computed(() => (this.auth.usuario()?.nombre?.[0] || '?').toUpperCase());

  constructor() { this.cargarNotifs(); }
  async cargarNotifs() {
    try {
      const l = await this.api.get<Evaluacion[]>('/evaluaciones');
      const out: { t: string; h: string }[] = [];
      for (const e of l) {
        if (e.est === 'en_proceso' || e.est === 'borrador') out.push({ t: `Evaluación pendiente: ${e.predio_nombre}`, h: `evaluacion/${e.id}/indicadores` });
        if (e.est === 'finalizada' && this.auth.puedeValidar()) out.push({ t: `Por validar: ${e.predio_nombre}`, h: `evaluacion/${e.id}/resultados` });
        if (e.est === 'validada' && this.auth.puedeValidar()) out.push({ t: `Por cerrar: ${e.predio_nombre}`, h: `evaluacion/${e.id}/resultados` });
      }
      this.notifs.set(out);
    } catch { /* sin notificaciones */ }
  }
  verNotifs() { this.ddAbierto.update((v) => !v); }
  ir(h: string) { this.ddAbierto.set(false); this.router.navigate(['/app', ...h.split('/')]); }
}
