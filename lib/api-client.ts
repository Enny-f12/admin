// lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const apiClient = axios.create({
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const alreadyOnLoginPage =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/login');

      useAuthStore.getState().clearAuth();

      // Don't redirect if the 401 came from the login attempt itself
      // (that's just "wrong password", not an expired session) or if
      // we're already on the login page.
      if (!isLoginRequest && !alreadyOnLoginPage && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);