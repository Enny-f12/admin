import { apiClient } from '@/lib/api-client';
import {
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
  SendOtpPayload,
  VerifyOtpPayload,
  AuthResponse,
  GoogleAuthPayload,
  AppleAuthPayload,
  RefreshPayload,
  RefreshResponse,
  Branch,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
} from '@/types/auth.types';

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>('/auth/register', payload).then((r) => r.data),

  // Returns either a CodeSentResponse (no twoFactorCode was sent — a
  // code has just been emailed) or a full AuthResponse (twoFactorCode
  // was sent and everything checked out). See backend request doc v4.0.
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  sendOtp: (payload: SendOtpPayload) =>
    apiClient.post<{ message: string }>('/auth/send-otp', payload).then((r) => r.data),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiClient.post<AuthResponse>('/auth/verify-otp', payload).then((r) => r.data),

  googleSignIn: (payload: GoogleAuthPayload) =>
    apiClient.get<AuthResponse>('/auth/google', { data: payload }).then((r) => r.data),

  appleSignIn: (payload: AppleAuthPayload) =>
    apiClient.get<AuthResponse>('/auth/apple', { data: payload }).then((r) => r.data),

  refresh: (payload: RefreshPayload) =>
    apiClient.post<RefreshResponse>('/auth/refresh', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<{ success: boolean }>('/auth/logout', { refreshToken }).then((r) => r.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data),

  getBranches: () => apiClient.get<Branch[]>('/auth/branches').then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<ResetPasswordResponse>('/auth/reset-password', payload).then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post<ChangePasswordResponse>('/auth/change-password', payload).then((r) => r.data),
};
