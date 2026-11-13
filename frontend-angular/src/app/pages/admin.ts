import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';
import { Auditoria, Rol, Usuario } from '../core/models';
import { PageHead, fd } from '../shared/widgets';

@Component({
  selector: 'app-admin', imports: [FormsModule, PageHead],
  template: `
    <app-head titulo="Administración" sub="Usuarios, roles y auditoría">
      @if (tab() === 'u') { <button class="btn p" (click)="nuevo()">+ Nuevo usuario</button> }
    </app-head>
    <div class="tabs"><button [class.on]="tab() === 'u'" (click)="tab.set('u')">Usuarios</button><button [class.on]="tab() === 'a'" (click)="tab.set('a'); cargarAud()">Auditoría</button></div>
    @if (tab() === 'u') {
      @if (form(); as f) {
        <div class="card rise" style="margin-bottom:16px"><h3>{{ f.id ? 'Editar usuario' : 'Nuevo usuario' }}</h3><div class="fg">
          <div class="field"><label>Nombre</label><input class="input" [(ngModel)]="f.nombre" /></div>
          <div class="field"><label>Correo</label><input class="input" type="email" [(ngModel)]="f.email" [disabled]="!!f.id" /></div>
          <div class="field"><label>Contraseña {{ f.id ? '(vacío = sin cambio)' : '' }}</label><input class="input" type="password" [(ngModel)]="f.password" /></div>
          <div class="field"><label>Rol</label><select class="input" [(ngModel)]="f.rol"><option value="admin">Administrador</option><option value="docente">Docente</option><option value="evaluador">Evaluador</option><option value="consultor">Consultor</option></select></div>
        </div>@if (error()) { <div class="err">{{ error() }}</div> }<div class="sp"></div>
        <div class="row"><button class="btn" (click)="form.set(null)">Cancelar</button><button class="btn p" (click)="guardar()">Guardar</button></div></div>
      }
      <div class="tw rise"><table><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr>
        @for (u of usuarios(); track u.id) { <tr><td><b>{{ u.nombre }}</b></td><td>{{ u.email }}</td><td>{{ u.rol_nombre || u.rol }}</td>
          <td>@if (u.activo) { <span class="bd b-ok">Activo</span> } @else { <span class="bd b-na">Inactivo</span> }</td>
          <td class="row"><button class="btn s" (click)="editar(u)">Editar</button>
            @if (u.id !== auth.usuario()?.id) { <button class="btn s" (click)="alternar(u)">{{ u.activo ? 'Desactivar' : 'Activar' }}</button> }</td></tr> }</table></div>
    } @else {
      <div class="tw rise"><table><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr>
        @for (a of aud(); track a.id) { <tr><td class="small">{{ fd(a.fecha_hora) }} {{ a.fecha_hora.slice(11, 16) }}</td><td>{{ a.usuario }}</td><td>{{ a.accion }}</td></tr> }</table></div>
    }`,
})
export class Admin implements OnInit {
  private api = inject(ApiService); private ui = inject(UiService); auth = inject(AuthService); fd = fd;
  tab = signal<'u' | 'a'>('u'); usuarios = signal<Usuario[]>([]); aud = signal<Auditoria[]>([]); error = signal('');
  form = signal<{ id?: number; nombre: string; email: string; password: string; rol: Rol } | null>(null);
  async ngOnInit() { await this.cargar(); }
  async cargar() { this.usuarios.set(await this.api.get('/usuarios')); }
  async cargarAud() { this.aud.set(await this.api.get('/auditoria', { limite: 100 })); }
  nuevo() { this.error.set(''); this.form.set({ nombre: '', email: '', password: '', rol: 'evaluador' }); }
  editar(u: Usuario) { this.error.set(''); this.form.set({ id: u.id, nombre: u.nombre, email: u.email, password: '', rol: u.rol }); }
  async guardar() {
    const f = this.form(); if (!f) return;
    try {
      const cuerpo: Record<string, unknown> = { nombre: f.nombre, email: f.email, rol: f.rol };
      if (f.password) cuerpo['password'] = f.password;
      if (f.id) await this.api.put('/usuarios/' + f.id, cuerpo); else await this.api.post('/usuarios', cuerpo);
      this.form.set(null); this.ui.toast('Usuario guardado'); await this.cargar();
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'Error'); }
  }
  async alternar(u: Usuario) { try { await this.api.patch(`/usuarios/${u.id}/activo`); await this.cargar(); } catch (e) { this.ui.error(e); } }
}
