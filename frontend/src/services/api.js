import axios from 'axios';
import { safeLocalStorage } from '../utils/browserCompatibility';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout for older browsers
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = safeLocalStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration and rate limiting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Use safe access for older browsers
    const status = error.response && error.response.status;
    
    if (status === 403 || status === 401) {
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
      // Use window.location for better browser compatibility
      if (window.location) {
        window.location.href = '/login';
      }
    }
    // Log rate limiting errors for debugging
    if (status === 429) {
      if (console && console.warn) {
        console.warn('Rate limit hit. If you are an admin, this should not happen.');
      }
      // Retry after a short delay for admin users
      try {
        const userStr = safeLocalStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.role === 'admin' && console && console.warn) {
            console.warn('Admin user hit rate limit - this is a bug');
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return Promise.reject(error);
  }
);

export default api;

