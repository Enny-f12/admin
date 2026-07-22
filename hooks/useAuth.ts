// hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import {
  RegisterPayload,
  LoginPayload,
  SendOtpPayload,
  VerifyOtpPayload,
} from '@/types/auth.types';

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => authService.sendOtp(payload),
  });
}

export function useVerifyOtp() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload),
    onSuccess: (data) => {
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useMutation({
    mutationFn: () => authService.logout(refreshToken!),
    onSuccess: () => clearAuth(),
  });
}