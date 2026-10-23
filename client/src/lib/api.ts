import { ApiResponse } from '../types';

let currentAccessToken: string | null = localStorage.getItem('accessToken');

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiBase = import.meta.env.VITE_API_URL || '';
  const url = `${apiBase}${endpoint.startsWith('/api') ? endpoint : `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Needed for refresh token cookies
  });

  // Handle 401 Unauthorized - attempt silent token refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            onRefreshed(newToken);
            isRefreshing = false;

            // Retry original request
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers, credentials: 'include' });
          } else {
            setAccessToken(null);
            isRefreshing = false;
          }
        } else {
          setAccessToken(null);
          isRefreshing = false;
        }
      } catch {
        setAccessToken(null);
        isRefreshing = false;
      }
    } else {
      // Wait for ongoing refresh
      const retryOriginal = new Promise<Response>((resolve) => {
        addRefreshSubscriber(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          const res = await fetch(url, { ...options, headers, credentials: 'include' });
          resolve(res);
        });
      });
      response = await retryOriginal;
    }
  }

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: 'Failed to parse JSON response from server'
  }));

  if (!response.ok || !json.success) {
    throw new Error(json.error || json.message || 'An unexpected error occurred');
  }

  if (json.pagination) {
    return json as any;
  }

  return json.data !== undefined ? json.data : (json as any);
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),

  del: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    })
};

export default api;
