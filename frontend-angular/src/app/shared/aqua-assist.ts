import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Component({
  selector: 'app-aqua-assist',
  imports: [FormsModule],
  template: `
    @if (auth.logueado()) {
      <button class="aa-launcher" type="button" (click)="abierto.update(v => !v)" [attr.aria-expanded]="abierto()" aria-label="Abrir asistente AquaAssist">
        @if (abierto()) { <span aria-hidden="true">×</span> } @else { <span class="aa-launch-icon" aria-hidden="true">✳</span><span class="aa-launch-label">AquaAssist</span> }
      </button>
      @if (abierto()) {
        <section class="aa-panel" role="dialog" aria-label="Chat con AquaAssist" aria-modal="false">
          <header class="aa-head"><div class="aa-brand-mark">✳</div><div class="aa-head-copy"><b>AquaAssist</b><span><i></i> Asistente de Bienestar Acuático</span></div><button type="button" class="aa-icon-btn" (click)="limpiar()" title="Limpiar conversación" aria-label="Limpiar conversación">↻</button><button type="button" class="aa-icon-btn" (click)="abierto.set(false)" aria-label="Cerrar asistente">×</button></header>
          <div class="aa-disclaimer">Asistente IA · Las recomendaciones requieren revisión del evaluador.</div>
          <div #conversacion class="aa-messages" aria-live="polite">
            @if (!mensajes().length) {
              <div class="aa-welcome"><span class="aa-welcome-symbol">≈</span><h3>Hola, {{ saludo() }}.</h3><p>¿En qué te ayudo hoy? Puedo orientarte con el flujo de evaluación y las funciones de la plataforma.</p>
                <div class="aa-suggestions"><button type="button" (click)="sugerir('¿Cómo registro un predio correctamente?')">Registrar un predio <span>↗</span></button><button type="button" (click)="sugerir('¿Cómo adjunto fotografías como evidencia?')">Adjuntar evidencias <span>↗</span></button><button type="button" (click)="sugerir('¿Cómo interpreto el resultado de una evaluación?')">Entender resultados <span>↗</span></button></div>
              </div>
            }
            @for (m of mensajes(); track $index) { <div class="aa-message" [class.user]="m.role === 'user'"><span class="aa-message-role">{{ m.role === 'user' ? 'Tú' : 'AquaAssist' }}</span><div class="aa-bubble">{{ m.content }}</div></div> }
            @if (cargando()) { <div class="aa-message"><span class="aa-message-role">AquaAssist</span><div class="aa-bubble aa-typing"><i></i><i></i><i></i><span>Preparando respuesta…</span></div></div> }
            @if (error()) { <div class="aa-error">{{ error() }} <button type="button" (click)="reenviar()">Reintentar</button></div> }
          </div>
          <form class="aa-composer" (submit)="$event.preventDefault(); enviar()"><textarea name="mensaje" [(ngModel)]="texto" rows="1" maxlength="2000" placeholder="Escribe tu pregunta…" aria-label="Mensaje para AquaAssist" (keydown)="tecla($event)" [disabled]="cargando()"></textarea><button type="submit" aria-label="Enviar mensaje" [disabled]="cargando() || !texto.trim()">↑</button></form>
          <div class="aa-foot">No compartas contraseñas ni datos personales sensibles.</div>
        </section>
      }
    }
  `,
})
export class AquaAssist {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  abierto = signal(false);
  cargando = signal(false);
  error = signal('');
  mensajes = signal<ChatMessage[]>([]);
  saludo = computed(() => this.auth.usuario()?.nombre?.trim().split(/\s+/)[0] || 'bienvenido');
  texto = '';
  ultimo = '';
  @ViewChild('conversacion') private conversacion?: ElementRef<HTMLDivElement>;

  async enviar() {
    const contenido = this.texto.trim();
    if (!contenido || this.cargando()) return;
    this.ultimo = contenido;
    const prev = this.mensajes().slice(-8);
    this.mensajes.update((m) => [...m, { role: 'user', content: contenido }]);
    this.texto = '';
    this.error.set('');
    this.cargando.set(true);
    try {
      const match = this.router.url.match(/^\/app\/evaluacion\/(\d+)(?:\/|$)/);
      const evaluacionId = match ? Number(match[1]) : undefined;
      const r = await this.api.post<{ answer: string }>('/chatbot/message', { message: contenido, history: prev, ...(evaluacionId ? { evaluacionId } : {}) });
      this.mensajes.update((m) => [...m, { role: 'assistant', content: r.answer }]);
      this.scrollFinal();
    } catch (e) {
      this.mensajes.update((m) => m.slice(0, -1));
      this.texto = contenido;
      this.error.set(e instanceof Error ? e.message : 'No se pudo enviar el mensaje.');
    } finally { this.cargando.set(false); }
  }
  sugerir(s: string) { this.texto = s; this.enviar(); }
  tecla(ev: KeyboardEvent) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); this.enviar(); } }
  reenviar() { this.error.set(''); this.enviar(); }
  limpiar() { this.mensajes.set([]); this.error.set(''); this.texto = ''; this.ultimo = ''; }
  private scrollFinal() { queueMicrotask(() => { const e = this.conversacion?.nativeElement; if (e) e.scrollTop = e.scrollHeight; }); }
}
