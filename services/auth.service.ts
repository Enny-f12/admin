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
  RefreshPayload,
  RefreshResponse,
  Branch,
} from '@/types/auth.types';

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>('/auth/register', payload).then((r) => r.data),

  // branchId is optional per Swagger ("Login with email/password and
  // optional branchId") — omit it from the payload entirely when not
  // selected rather than sending an empty string, since the DTO expects
  // either a real UUID or the field absent.
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

  // NOT YET CONFIRMED — access tokens expire after 15 minutes with no way
  // to silently renew without this. See backend request doc, Auth #1.
  refresh: (payload: RefreshPayload) =>
    apiClient.post<RefreshResponse>('/auth/refresh', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<{ success: boolean }>('/auth/logout', { refreshToken }).then((r) => r.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data),

  getBranches: () => apiClient.get<Branch[]>('/auth/branches').then((r) => r.data),
};