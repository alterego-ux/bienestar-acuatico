/* =====================================================================
   Cliente servidor para Supabase Storage.
   La clave secreta solo se configura en Render / backend/.env; nunca en Angular.
   ===================================================================== */
import { createClient } from "@supabase/supabase-js";
import config from "./env.js";
import { ErrorApp } from "../utils/errores.js";

let cliente = null;

export function bucketEvidencias() {
  const { url, secretKey, bucket } = config.storage;
  if (!url || !secretKey) {
    throw new ErrorApp(
      "STORAGE_NO_CONFIGURADO",
      "El almacenamiento de evidencias no está configurado en el servidor.",
      503
    );
  }

  if (!cliente) {
    cliente = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return cliente.storage.from(bucket);
}

export default { bucketEvidencias };
