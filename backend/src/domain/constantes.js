/* =====================================================================
   Dominio · constantes compartidas
   ===================================================================== */

export const MEDIDAS = {
  MBR: { n: "Recursos", full: "Medidas basadas en los recursos", c: "#4aa3ff" },
  MBA: { n: "Animal", full: "Medidas basadas en el animal", c: "#2dd4a0" },
  MBG: { n: "Gestión", full: "Medidas basadas en la gestión", c: "#9b7bff" },
};

export const ESTADOS = {
  borrador: "Borrador",
  en_proceso: "En proceso",
  finalizada: "Finalizada",
  validada: "Validada",
  cerrada: "Cerrada",
};

export const ROLES = {
  admin: { n: "Administrador" },
  docente: { n: "Docente" },
  evaluador: { n: "Estudiante evaluador" },
  consultor: { n: "Consultor externo" },
};

export const TIPOS_MEDIDA = ["MBR", "MBA", "MBG"];

export default { MEDIDAS, ESTADOS, ROLES, TIPOS_MEDIDA };
