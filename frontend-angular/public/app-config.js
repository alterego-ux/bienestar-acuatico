/* Configuración en tiempo de ejecución.
 * Docker usa /api y Nginx la redirige al contenedor backend.
 * Para Firebase Hosting, cambia apiUrl por la URL pública del backend + /api.
 */
window.__BIENESTAR_CONFIG__ = window.__BIENESTAR_CONFIG__ || {};
window.__BIENESTAR_CONFIG__.apiUrl = window.__BIENESTAR_CONFIG__.apiUrl || '/api';
