import axios from 'axios';
import { safeLocalStorage } from '../utils/browserCompatibility';

// Auto-detect API URL based on current hostname
const getApiUrl = () => {
  // If REACT_APP_API_URL is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Otherwise, detect based on current location
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // If accessing from localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:6000/api';
    }
    
    // If accessing through Cloudflare or production domain, use same domain (API proxied through nginx)
    // Check if it's a production domain (not local IP)
    const isLocalIP = hostname.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^169\.254\./);
    const isProduction = !isLocalIP && !hostname.includes('.local') && hostname !== 'localhost';
    
    if (isProduction) {
      // Use same domain, API should be proxied through nginx at /api
      return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
    }
    
    // For local network IPs, try proxy first, then direct port
    // Try nginx proxy first (in case nginx is proxying)
    if (port === '3000' || port === '80' || !port) {
      return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
    }
    
    // Fallback to direct port 6000
    return `${protocol}//${hostname}:6000/api`;
  }
  
  // Fallback to localhost
  return 'http://localhost:6000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout for large file uploads (3 minutes)
  timeout: 180000,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = safeLocalStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Remove Content-Type header for FormData to let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
    const url = error.config && error.config.url;
    const currentPath = window.location && window.location.pathname;
    
    // Don't redirect on login/register errors - let the component handle them
    if (status === 403 || status === 401) {
      // Don't redirect if:
      // 1. On login/register pages
      // 2. On public pages (home, sections) - let them handle the error gracefully
      // 3. The request is for auth endpoints
      const isPublicPage = currentPath === '/' || currentPath === '/sections';
      const isAuthEndpoint = url && (url.includes('/auth/login') || url.includes('/auth/register'));
      
      if (!isAuthEndpoint && !isPublicPage) {
        // Only redirect on protected pages
        safeLocalStorage.removeItem('token');
        safeLocalStorage.removeItem('user');
        // Use window.location for better browser compatibility
        if (window.location && currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (console && console.error) {
        console.error('Request timeout - API may be unreachable. Check network connection and API URL:', API_URL);
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

