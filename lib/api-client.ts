// lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Separate, uninterceptored client used only for the refresh call itself —
// avoids a circular import back into apiClient and prevents the refresh
// request from re-triggering this same response interceptor.
const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function redirectToLogin() {
  const alreadyOnLoginPage =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/login');
  if (!alreadyOnLoginPage && typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

// Requests that hit a 401 while a refresh is already in flight queue up here
// and wait for that single refresh to resolve, instead of each firing off
// its own competing refresh call.
let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (status !== 401 || isAuthEndpoint || originalRequest?._retry) {
      // Wrong-password-on-login, a request that's already been retried
      // once, or a failure on the refresh call itself — no more retries,
      // just clear auth and bounce to login.
      if (status === 401) {
        useAuthStore.getState().clearAuth();
        if (!originalRequest?.url?.includes('/auth/login')) {
          redirectToLogin();
        }
      }
      return Promise.reject(error);
    }

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // A refresh is already in flight for another request — queue behind
      // it and retry with whatever token that refresh resolves to.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshClient.post('/auth/refresh', { refreshToken });
      useAuthStore.getState().setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      flushQueue(null, data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);