/* =====================================================================
   Esquemas de validación (Zod)
   ===================================================================== */
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export const registroSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto."),
  email: z.string().email("Correo inválido."),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres."),
  rol: z.enum(["evaluador", "docente", "consultor", "admin"]).optional(),
});

export const cambiarClaveSchema = z.object({
  actual: z.string().min(1, "Indica la contraseña actual."),
  nueva: z.string().min(4, "La nueva contraseña debe tener al menos 4 caracteres."),
});

export const predioSchema = z.object({
  cod: z.string().min(1),
  n: z.string().min(1),
  resp: z.string().min(1),
  mail: z.string().email("Correo del responsable inválido."),
  telefono: z.string().trim().max(40, "El teléfono no puede superar 40 caracteres.").optional().nullable(),
  tipo: z.string().optional(),
  tipoId: z.number().int().positive().optional(),
  sis: z.array(z.string()).optional(),
  sisIds: z.array(z.number().int().positive()).optional(),
  dep: z.string().optional(),
  depId: z.number().int().positive().optional(),
  mun: z.string().optional(),
  munId: z.number().int().positive().optional(),
  ver: z.string().optional(),
  dir: z.string().optional(),
  lat: z.union([z.string(), z.number()]).nullable().optional(),
  lng: z.union([z.string(), z.number()]).nullable().optional(),
  act: z.boolean().optional(),
  inv: z.array(z.any()).optional(),
}).passthrough();

export const evaluacionSchema = z.object({
  predioId: z.number().int().positive().optional(),
  pid: z.number().int().positive().optional(),
  especieId: z.number().int().positive().optional(),
  fecha: z.string().min(8),
  // `ev`, `reg` y `lotes` se aceptan por compatibilidad, pero el servidor los deriva:
  // evaluador = usuario autenticado · modalidad = tipo de productor del predio · lotes = inventario.
  ev: z.string().optional(),
  reg: z.enum(["PMG", "AREL"]).optional(),
  esp: z.string().optional(),
  lotes: z.union([z.number(), z.string()]).optional(),
  sel: z.array(z.string()).optional(),
  peces: z.any().optional(),
}).passthrough();

export const respuestaSchema = z.object({
  score: z.union([z.number(), z.string(), z.null()]).optional(),
  puntaje: z.union([z.number(), z.null()]).optional(),
  no_aplica: z.boolean().optional(),
  obs: z.string().optional(),
  calc: z.record(z.any()).optional(),
}).passthrough();

export const estadoSchema = z.object({
  estado: z.enum(["borrador", "en_proceso", "finalizada", "validada", "cerrada"]),
});

export const planItemSchema = z.object({
  accion: z.string().optional(),
  responsable: z.string().optional(),
  prioridad: z.enum(["Alta", "Media", "Baja"]).optional(),
  plazo: z.string().nullable().optional(),
  completado: z.boolean().optional(),
}).passthrough();

export const chatbotSchema = z.object({
  message: z.string().trim().min(1, "Escribe un mensaje.").max(2000, "El mensaje es demasiado largo."),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(2000),
  })).max(8).optional().default([]),
  evaluacionId: z.number().int().positive().optional(),
});

export const usuarioSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(4).optional(),
  rol: z.enum(["admin", "docente", "evaluador", "consultor"]).optional(),
  activo: z.boolean().optional(),
}).passthrough();

export default {
  loginSchema, registroSchema, cambiarClaveSchema, predioSchema, evaluacionSchema,
  respuestaSchema, estadoSchema, planItemSchema, usuarioSchema, chatbotSchema,
};
