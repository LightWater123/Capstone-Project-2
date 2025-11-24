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

// Add 401 response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to verify the session
        const verifyResponse = await api.get('/api/verifyUser');
        
        if (verifyResponse.data?.user) {
          // Session is still valid, retry the original request
          return api(originalRequest);
        }
      } catch (verifyError) {
        // Session verification failed, redirect to login
        // Use window.location for navigation outside of React components
        window.location.href = '/login';
        return Promise.reject(verifyError);
      }
    }
    
    // If it's not a 401 error or refresh failed, reject the error
    return Promise.reject(error);
  }
);

export const getCsrfToken = () => api.get('/sanctum/csrf-cookie');

export default api;
