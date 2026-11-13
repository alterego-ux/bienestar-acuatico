import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS } from '../core/models';

/** Fecha ISO → dd/mm/aaaa */
export const fd = (s?: string | null) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '—');
export const pc = (n: number) => Math.round(n) + '%';

@Component({
  selector: 'app-badge', template: `<span class="bd" [class]="'bd b-' + valor()">{{ valor() }}</span>`,
})
export class BadgeCls { valor = input.required<string | null>(); }

@Component({
  selector: 'app-estado', template: `<span class="bd b-st">{{ txt() }}</span>`,
})
export class BadgeEstado { valor = input.required<string>(); txt = computed(() => ESTADOS[this.valor()] || this.valor()); }

@Component({
  selector: 'app-ring',
  template: `
    <span class="ring" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
        <circle class="ring-track" [attr.cx]="m()" [attr.cy]="m()" [attr.r]="r()" fill="none" [attr.stroke-width]="sw()" />
        <circle class="ring-arc" [attr.cx]="m()" [attr.cy]="m()" [attr.r]="r()" fill="none" [attr.stroke]="color()" [attr.stroke-width]="sw()"
          stroke-linecap="butt" [attr.stroke-dasharray]="c()" [attr.stroke-dashoffset]="off()" [attr.transform]="'rotate(-90 ' + m() + ' ' + m() + ')'" />
      </svg>
      <b>{{ label() }}</b>
    </span>`,
})
export class Ring {
  valor = input(0); size = input(100); color = input('#2e7d5b'); label = input<string>(''); sw = input(10);
  m = computed(() => this.size() / 2);
  r = computed(() => (this.size() - this.sw()) / 2);
  c = computed(() => 2 * Math.PI * this.r());
  off = computed(() => this.c() * (1 - Math.min(100, Math.max(0, this.valor())) / 100));
}

export interface BarRow { l: string; v: number; t?: string | number; c?: string; }
@Component({
  selector: 'app-bars',
  template: `
    @for (r of rows(); track r.l) {
      <div class="rl">
        <span class="small muted">{{ r.l }}</span>
        <div class="bar"><i [style.width.%]="min(r.v)" [style.background]="r.c || 'var(--primary)'"></i></div>
        <b class="small">{{ r.t ?? round(r.v) }}</b>
      </div>
    }`,
})
export class Bars {
  rows = input.required<BarRow[]>();
  min = (v: number) => Math.min(100, v);
  round = Math.round;
}

@Component({
  selector: 'app-head', imports: [RouterLink],
  template: `
    <div class="ph rise">
      <div>
        @if (crumb()) { <div class="crumb"><a [routerLink]="crumbLink()">{{ crumb() }}</a> / {{ titulo() }}</div> }
        <h1>{{ titulo() }}</h1>
        @if (sub()) { <div class="muted" style="margin-top:4px">{{ sub() }}</div> }
      </div>
      <div class="right"><ng-content /></div>
    </div>`,
})
export class PageHead { titulo = input.required<string>(); sub = input<string>(''); crumb = input<string>(''); crumbLink = input<string>('/app/inicio'); }
