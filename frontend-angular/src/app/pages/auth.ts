import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Rol } from '../core/models';
import { ThemeToggle } from '../shared/theme-toggle';

const DEMO: [string, string, string][] = [
  ['Evaluador', 'evaluador@ica.demo', '1234'], ['Docente', 'docente@ica.demo', 'docente123'],
  ['Admin', 'admin@ica.demo', 'admin123'], ['Consultor', 'consultor@ica.demo', 'consultor123'],
];

@Component({
  selector: 'app-login', imports: [FormsModule, RouterLink, ThemeToggle],
  template: `
    <main class="auth-page auth-page-login">
      <section class="auth-hero" aria-label="Presentación de Bienestar Acuático">
        <div class="auth-hero-brand">
          <img class="logo" src="Im/Logo.jpg" alt="Logotipo del ICA, referencia metodológica" />
          <span>PLATAFORMA ACADÉMICA <b>·</b> AQUATIC PERFORMANCE</span>
        </div>
        <div class="auth-hero-copy">
          <span class="auth-kicker"><i aria-hidden="true"></i> CIENCIA · ACUICULTURA · BIENESTAR</span>
          <h1>El bienestar de los peces, <em>con evidencia.</em></h1>
          <p>Registra, evalúa y consulta indicadores de bienestar animal en peces de cultivo con información clara y trazable, basada en la metodología del ICA.</p>
          <div class="chips"><span class="tag">23 indicadores*</span><span class="tag">5 libertades</span><span class="tag">Metodología v2.0</span></div>
          <p class="auth-photo-caption">Observación responsable. Datos claros. Mejora continua.</p>
        </div>
        <div class="auth-hero-footer"><span>BIENESTAR ACUÁTICO</span><span>PROTOTIPO ACADÉMICO INDEPENDIENTE</span></div>
      </section>
      <section class="auth-form" aria-labelledby="login-title">
        <app-theme-toggle />
        <div class="auth-card rise">
          <div class="auth-form-heading"><span class="auth-form-kicker">TU ESPACIO DE TRABAJO</span><h2 id="login-title">Bienvenido de nuevo.</h2><p class="lead">Inicia sesión con tus credenciales para continuar.</p></div>
          <form (ngSubmit)="entrar()">
            <div class="field"><label for="lu">Correo electrónico</label>
              <input class="input" id="lu" name="email" type="email" autocomplete="username" placeholder="correo@ejemplo.com" [(ngModel)]="email" required /></div>
            <div class="field"><label for="lp">Contraseña</label>
              <div class="input-wrap">
                <input class="input" id="lp" name="pass" [type]="ver() ? 'text' : 'password'" autocomplete="current-password" placeholder="Escribe tu contraseña" [(ngModel)]="pass" required />
                <button type="button" class="toggle" (click)="ver.set(!ver())" [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ ver() ? 'Ocultar' : 'Mostrar' }}</button>
              </div></div>
            @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
            <button class="btn p auth-submit" type="submit" [disabled]="cargando()">{{ cargando() ? 'Validando acceso…' : 'Iniciar sesión' }} <span aria-hidden="true">↗</span></button>
          </form>
          <details class="demo-access"><summary>Accesos de demostración (opcional)</summary><p>Selecciona un rol para rellenar los campos. El inicio de sesión solo se realiza cuando pulsas el botón.</p>
            <div class="demo-users">@for (d of demo; track d[0]) { <button class="btn s ghost" type="button" (click)="llenar(d[1], d[2])">{{ d[0] }}</button> }</div>
          </details>
          <p class="auth-switch">¿Todavía no tienes cuenta? <a routerLink="/registro">Crear cuenta</a></p>
          <a routerLink="/" class="back-link small auth-back">← Volver al inicio público</a>
          <p class="demo-note">*La cantidad de indicadores depende del tipo de productor contemplado en la metodología. La plataforma es un prototipo académico y no es un sistema oficial del ICA.</p>
        </div>
      </section>
    </main>`,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  demo = DEMO;
  email = ''; pass = '';
  ver = signal(false); error = signal(''); cargando = signal(false);
  llenar(e: string, p: string) { this.email = e; this.pass = p; }
  async entrar() {
    this.error.set('');
    if (!this.email || !this.pass) return this.error.set('Completa correo y contraseña.');
    this.cargando.set(true);
    try { await this.auth.login(this.email.trim(), this.pass); this.router.navigateByUrl('/app/inicio'); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo iniciar sesión'); }
    finally { this.cargando.set(false); }
  }
}

@Component({
  selector: 'app-registro', imports: [FormsModule, RouterLink, ThemeToggle],
  template: `
    <main class="auth-page auth-page-register">
      <section class="auth-hero" aria-label="Presentación de Bienestar Acuático">
        <div class="auth-hero-brand"><img class="logo" src="Im/Logo.jpg" alt="Logotipo del ICA, referencia metodológica" /><span>PLATAFORMA ACADÉMICA <b>·</b> AQUATIC PERFORMANCE</span></div>
        <div class="auth-hero-copy"><span class="auth-kicker"><i aria-hidden="true"></i> UN ESPACIO PARA EVALUAR Y MEJORAR</span><h1>Observa. Registra. <em>Comprende.</em></h1><p>Crea una cuenta para organizar predios, documentar evaluaciones y consultar sus resultados dentro del prototipo académico.</p><div class="chips"><span class="tag">Registros</span><span class="tag">Evidencias</span><span class="tag">Resultados</span></div></div>
        <div class="auth-hero-footer"><span>BIENESTAR ACUÁTICO</span><span>PROTOTIPO ACADÉMICO INDEPENDIENTE</span></div>
      </section>
      <section class="auth-form" aria-labelledby="register-title">
        <app-theme-toggle />
        <div class="auth-card rise">
          <div class="auth-form-heading"><span class="auth-form-kicker">EMPIEZA AQUÍ</span><h2 id="register-title">Crear cuenta</h2><p class="lead">Completa tus datos para solicitar acceso a la plataforma.</p></div>
          <form (ngSubmit)="crear()">
            <div class="field"><label for="reg-name">Nombre completo</label><input class="input" id="reg-name" name="n" autocomplete="name" [(ngModel)]="nombre" required /></div>
            <div class="field"><label for="reg-email">Correo electrónico</label><input class="input" id="reg-email" name="e" type="email" autocomplete="email" [(ngModel)]="email" required /></div>
            <div class="field"><label for="reg-password">Contraseña (mín. 4 caracteres)</label><input class="input" id="reg-password" name="p" type="password" autocomplete="new-password" [(ngModel)]="pass" minlength="4" required /></div>
            <div class="field"><label for="reg-role">Rol</label><select class="input" id="reg-role" name="r" [(ngModel)]="rol"><option value="evaluador">Estudiante evaluador</option><option value="docente">Docente</option><option value="consultor">Consultor externo</option></select></div>
            @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
            <button class="btn p auth-submit" type="submit" [disabled]="cargando()">{{ cargando() ? 'Creando cuenta…' : 'Crear cuenta' }} <span aria-hidden="true">↗</span></button>
          </form>
          <p class="auth-switch">¿Ya tienes cuenta? <a routerLink="/login">Iniciar sesión</a></p>
          <a routerLink="/" class="back-link small auth-back">← Volver al inicio público</a>
        </div>
      </section>
    </main>`,
})
export class Registro {
  private auth = inject(AuthService);
  private router = inject(Router);
  nombre = ''; email = ''; pass = ''; rol: Rol = 'evaluador';
  error = signal(''); cargando = signal(false);
  async crear() {
    this.error.set(''); this.cargando.set(true);
    try { await this.auth.registrar(this.nombre.trim(), this.email.trim(), this.pass, this.rol); this.router.navigateByUrl(this.auth.logueado() ? '/app/inicio' : '/login'); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo registrar'); }
    finally { this.cargando.set(false); }
  }
}
