// store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { User } from '@/types/auth.types';
import {
  RegisterPayload,
  LoginPayload,
  SendOtpPayload,
  VerifyOtpPayload,
  GoogleAuthPayload,
  AppleAuthPayload,
} from '@/types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  // Lighter-weight than setAuth — used by the api-client interceptor after a
  // silent token refresh, where we only get back new tokens, not a fresh
  // user object. Leaves `user` and `isAuthenticated` untouched.
  setTokens: (data: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
  clearError: () => void;

  register: (payload: RegisterPayload) => Promise<boolean>;
  login: (payload: LoginPayload) => Promise<boolean>;
  sendOtp: (payload: SendOtpPayload) => Promise<boolean>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<boolean>;
  googleSignIn: (payload: GoogleAuthPayload) => Promise<boolean>;
  appleSignIn: (payload: AppleAuthPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      clearError: () => set({ error: null }),

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(payload);
          set({ isLoading: false });
          toast.success('Account created. Please verify your OTP.');
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Registration failed.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(payload);
          get().setAuth(res);
          set({ isLoading: false });
          toast.success('Welcome back!');
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Login failed.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      sendOtp: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.sendOtp(payload);
          set({ isLoading: false });
          toast.success(res.message ?? 'OTP sent.');
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Could not send OTP.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      verifyOtp: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.verifyOtp(payload);
          get().setAuth(res);
          set({ isLoading: false });
          toast.success('OTP verified.');
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Invalid OTP.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      googleSignIn: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.googleSignIn(payload);
          get().setAuth(res);
          set({ isLoading: false });
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Google sign-in failed.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      appleSignIn: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.appleSignIn(payload);
          get().setAuth(res);
          set({ isLoading: false });
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Apple sign-in failed.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        set({ isLoading: true });
        try {
          if (refreshToken) await authService.logout(refreshToken);
        } catch {
          // proceed with local logout even if the server call fails
        } finally {
          get().clearAuth();
          set({ isLoading: false });
        }
      },

      fetchMe: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.me();
          set({ user, isLoading: false });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          get().clearAuth();
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'foodies-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);