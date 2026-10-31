import { Component, inject } from '@angular/core';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-overlays',
  template: `
    <div class="toast-stack">
      @for (t of ui.toasts(); track t.id) { <div class="toast-ng" [class]="'toast-ng ' + t.tipo">{{ t.texto }}</div> }
    </div>
    @if (ui.confirmacion(); as c) {
      <div class="modal" (click)="ui.confirmacion.set(null)">
        <div class="mb" (click)="$event.stopPropagation()">
          <h3>¿Confirmas?</h3>
          <p class="muted">{{ c.mensaje }}</p>
          <div class="row" style="justify-content:flex-end">
            <button class="btn" (click)="ui.confirmacion.set(null)">Cancelar</button>
            <button class="btn p" (click)="aceptar(c.ok)">Sí, continuar</button>
          </div>
        </div>
      </div>
    }`,
})
export class Overlays {
  ui = inject(UiService);
  aceptar(fn: () => void) { this.ui.confirmacion.set(null); fn(); }
}
