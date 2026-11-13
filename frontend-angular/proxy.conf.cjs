// Proxy de desarrollo: /api → API propia del proyecto nuevo (puerto 4100 por defecto).
const API = `http://localhost:${process.env.API_PORT || 4100}`;
module.exports = {
  '/api': { target: API, secure: false, changeOrigin: true },
};
