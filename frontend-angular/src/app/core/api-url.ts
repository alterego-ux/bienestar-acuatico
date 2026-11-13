type BienestarRuntimeConfig = {
  apiUrl?: string;
};

type BienestarGlobal = typeof globalThis & {
  __BIENESTAR_CONFIG__?: BienestarRuntimeConfig;
};

const runtimeConfig = (globalThis as BienestarGlobal).__BIENESTAR_CONFIG__;
const configuredUrl = runtimeConfig?.apiUrl?.trim() || '/api';

/** URL base configurable sin recompilar Angular (Docker, Render o Firebase). */
export const API_URL = configuredUrl.replace(/\/+$/, '');
