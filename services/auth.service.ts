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

  // NOT YET BUILT ON THE BACKEND — see the doc comment on
  // ForgotPasswordPayload/ResetPasswordPayload/ChangePasswordPayload in
  // types/auth.types.ts. Flag all three routes to the backend dev before
  // relying on this for real.
  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', payload).then((r) => r.data),

  // Public/code-based flow only — from the /forgot-password page, after
  // forgotPassword() above. Does NOT cover the authenticated "change
  // password" case; use changePassword() for that.
  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<ResetPasswordResponse>('/auth/reset-password', payload).then((r) => r.data),

  // Authenticated flow — from the profile page's "change password" form.
  // apiClient already attaches the access token; currentPassword is sent
  // to confirm it's really the account owner.
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post<ChangePasswordResponse>('/auth/change-password', payload).then((r) => r.data),
};