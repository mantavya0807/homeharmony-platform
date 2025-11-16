/**
 * API Configuration
 * Centralized API URL management for consistent API calls across the app
 */

/**
 * Get the API base URL based on environment
 * In production, since both frontend and backend are deployed on the same Vercel instance,
 * we use relative URLs to avoid CORS issues
 */
export const getApiUrl = (): string => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api';
  }
  
  // In production, use relative URL (same domain)
  // This works because Vercel routes /api/* to the backend
  // Custom domain or Vercel URL - doesn't matter, it's all relative
  return '/api';
};

/**
 * Get the full app URL (for redirects, webhooks, etc.)
 */
export const getAppUrl = (): string => {
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  
  // In development
  if (import.meta.env.DEV) {
    return 'http://localhost:5173';
  }
  
  // In production, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return '';
};

