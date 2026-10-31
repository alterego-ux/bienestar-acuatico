import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `<button type="button" class="theme-toggle" (click)="t.alternar()" [attr.aria-label]="t.tema() === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'">
    {{ t.tema() === 'dark' ? '☀ Tema claro' : '☾ Tema oscuro' }}</button>`,
})
export class ThemeToggle { t = inject(ThemeService); }
