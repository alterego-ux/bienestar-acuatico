/* =====================================================================
   Utilidades de contraseña (bcrypt)
   ===================================================================== */
import bcrypt from "bcryptjs";

const RONDAS = 10;

export async function hashear(clave) {
  return bcrypt.hash(clave, RONDAS);
}

export async function comparar(clave, hash) {
  if (!hash) return false;
  try {
    return await bcrypt.compare(clave, hash);
  } catch (_) {
    return false;
  }
}

export default { hashear, comparar };
