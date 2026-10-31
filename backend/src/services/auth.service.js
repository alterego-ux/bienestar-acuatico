/* =====================================================================
   Servicio · autenticación
   ===================================================================== */
import usuarioRepo from "../repositories/usuario.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { hashear, comparar } from "../utils/password.js";
import { firmarToken } from "../utils/jwt.js";
import { noAutorizado, conflicto, validacion, noEncontrado } from "../utils/errores.js";

const LIMPIO = (u) => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
  rolNombre: u.rol_nombre,
  activo: u.activo,
});

export async function login({ email, password }) {
  const usuario = await usuarioRepo.porEmail(email);
  if (!usuario) throw noAutorizado("Credenciales incorrectas.");
  const ok = await comparar(password, usuario.password_hash);
  if (!ok) throw noAutorizado("Credenciales incorrectas.");
  if (!usuario.activo) throw noAutorizado("Tu usuario está inactivo. Contacta al administrador.");
  const token = firmarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: "Inicio de sesión", entidad: "usuario", entidadId: usuario.id });
  return { token, usuario: LIMPIO(usuario) };
}

export async function registrar({ nombre, email, password, rol = "evaluador" }) {
  if (!nombre || !email || !password) throw validacion("Nombre, correo y contraseña son obligatorios.");
  if (password.length < 4) throw validacion("La contraseña debe tener al menos 4 caracteres.");
  const existente = await usuarioRepo.porEmail(email);
  if (existente) throw conflicto("Ya existe una cuenta con ese correo.");
  const rolId = await usuarioRepo.idRolPorCodigo(rol);
  if (!rolId) throw validacion("Rol no válido.");
  const hash = await hashear(password);
  const usuario = await usuarioRepo.crear({ nombre, email, hash, rolId, activo: true });
  await auditoriaRepo.registrar({ usuarioId: usuario.id, accion: `Registro de usuario: ${email}`, entidad: "usuario", entidadId: usuario.id });
  return LIMPIO(usuario);
}

export async function me(usuarioId) {
  const u = await usuarioRepo.porId(usuarioId);
  if (!u) throw noEncontrado("Usuario");
  return LIMPIO(u);
}

export async function cambiarClave(usuarioId, { actual, nueva }) {
  const uConHash = await usuarioRepo.porEmail((await usuarioRepo.porId(usuarioId)).email);
  if (!uConHash) throw noEncontrado("Usuario");
  const ok = await comparar(actual, uConHash.password_hash);
  if (!ok) throw validacion("La contraseña actual es incorrecta.");
  if (!nueva || nueva.length < 4) throw validacion("La nueva contraseña debe tener al menos 4 caracteres.");
  await usuarioRepo.cambiarClave(usuarioId, await hashear(nueva));
  await auditoriaRepo.registrar({ usuarioId, accion: "Contraseña cambiada", entidad: "usuario", entidadId: usuarioId });
  return { ok: true };
}

export default { login, registrar, me, cambiarClave };
