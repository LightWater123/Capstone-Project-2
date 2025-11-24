import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000', //
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest', // Required for Sanctum
    'Accept': 'application/json',         // Ensures JSON responses
  },
});

// Attach CSRF token manually (optional but safe)
api.interceptors.request.use(config => {
  const token = Cookies.get('XSRF-TOKEN');
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

export const getCsrfToken = () => api.get('/sanctum/csrf-cookie');

export default api;
