// services/auth.service.ts
import { apiClient } from '@/lib/api-client';
import {
  AuthResponse,
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  SendOtpPayload,
  VerifyOtpPayload,
  GoogleAuthPayload,
  AppleAuthPayload,
} from '@/types/auth.types';

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  sendOtp: (payload: SendOtpPayload) =>
    apiClient.post<{ message: string }>('/auth/send-otp', payload).then((r) => r.data),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiClient.post<AuthResponse>('/auth/verify-otp', payload).then((r) => r.data),

  googleSignIn: (payload: GoogleAuthPayload) =>
    apiClient.get<AuthResponse>('/auth/google', { data: payload }).then((r) => r.data),

  appleSignIn: (payload: AppleAuthPayload) =>
    apiClient.get<AuthResponse>('/auth/apple', { data: payload }).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<{ success: boolean }>('/auth/logout', { refreshToken }).then((r) => r.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data),
};