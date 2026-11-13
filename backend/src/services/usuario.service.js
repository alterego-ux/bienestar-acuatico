/* =====================================================================
   Servicio · usuarios (administración)
   ===================================================================== */
import usuarioRepo from "../repositories/usuario.repo.js";
import auditoriaRepo from "../repositories/auditoria.repo.js";
import { hashear } from "../utils/password.js";
import { noEncontrado, conflicto, validacion } from "../utils/errores.js";

export async function listar({ activo } = {}) {
  return usuarioRepo.listar({ activo });
}

export async function crear(datos, actor) {
  const { nombre, email, password, rol = "evaluador", activo = true } = datos;
  if (!nombre || !/^\S+@\S+\.\S+$/.test(email || "")) throw validacion("Nombre y correo válido son obligatorios.");
  if (!password || password.length < 4) throw validacion("La contraseña debe tener al menos 4 caracteres.");
  if (await usuarioRepo.porEmail(email)) throw conflicto("Correo ya en uso.");
  const rolId = await usuarioRepo.idRolPorCodigo(rol);
  if (!rolId) throw validacion("Rol no válido.");
  const usuario = await usuarioRepo.crear({ nombre, email, hash: await hashear(password), rolId, activo });
  await auditoriaRepo.registrar({ usuarioId: actor.id, accion: `Usuario creado: ${nombre}`, entidad: "usuario", entidadId: usuario.id });
  return usuario;
}

export async function actualizar(id, datos, actor) {
  const u = await usuarioRepo.porId(id);
  if (!u) throw noEncontrado("Usuario");
  const campos = {};
  if (datos.nombre) campos.nombre = datos.nombre;
  if (datos.email) {
    const otro = await usuarioRepo.porEmail(datos.email);
    if (otro && otro.id !== Number(id)) throw conflicto("Correo ya en uso.");
    campos.email = datos.email;
  }
  if (datos.rol) {
    const rolId = await usuarioRepo.idRolPorCodigo(datos.rol);
    if (!rolId) throw validacion("Rol no válido.");
    campos.rolId = rolId;
  }
  if (datos.activo !== undefined) campos.activo = datos.activo;
  if (datos.password) {
    if (datos.password.length < 4) throw validacion("Contraseña mín. 4 caracteres.");
    campos.hash = await hashear(datos.password);
  }
  const actualizado = await usuarioRepo.actualizar(id, campos);
  await auditoriaRepo.registrar({ usuarioId: actor.id, accion: `Usuario editado: ${actualizado.nombre}`, entidad: "usuario", entidadId: id });
  return actualizado;
}

export async function alternarActivo(id, actor) {
  const u = await usuarioRepo.porId(id);
  if (!u) throw noEncontrado("Usuario");
  if (u.id === actor.id) throw validacion("No puedes inactivar tu propio usuario.");
  const actualizado = await usuarioRepo.actualizar(id, { activo: !u.activo });
  await auditoriaRepo.registrar({ usuarioId: actor.id, accion: `Usuario ${u.activo ? "inactivado" : "activado"}: ${u.nombre}`, entidad: "usuario", entidadId: id });
  return actualizado;
}

export async function roles() {
  return usuarioRepo.listarRoles();
}

export default { listar, crear, actualizar, alternarActivo, roles };
