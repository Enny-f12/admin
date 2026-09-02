import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { User, Branch, isCodeSentResponse } from '@/types/auth.types';
import {
  RegisterPayload,
  LoginPayload,
  SendOtpPayload,
  VerifyOtpPayload,
  GoogleAuthPayload,
  AppleAuthPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from '@/types/auth.types';

// 'code_sent' means: credentials were correct, a code was just emailed,
// show the code field. 'success' means fully logged in. 'error' means
// check `error` for the message (wrong credentials OR wrong/expired code
// — indistinguishable on purpose, see backend doc).
type LoginResult = 'success' | 'code_sent' | 'error';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  branches: Branch[] | null;
  branchesLoading: boolean;
  branchesError: boolean;

  loginBranchId: string | null;

  // ── 2FA state ──
  // Set once /auth/login has confirmed credentials and emailed a code.
  // Not persisted (see partialize below) — a page refresh mid-flow
  // should just restart login, not silently resume a stale prompt.
  twoFactorCodeSent: boolean;
  twoFactorMaskedDestination: string | null;

  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  setTokens: (data: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
  clearError: () => void;

  register: (payload: RegisterPayload) => Promise<boolean>;
  // Call this WITHOUT twoFactorCode first (→ 'code_sent'), then again
  // WITH twoFactorCode to finish (→ 'success'). Calling it again without
  // a code while twoFactorCodeSent is true is how "resend" works too.
  login: (payload: LoginPayload) => Promise<LoginResult>;
  // Lets the UI back out of the "enter your code" step, e.g. a
  // "use a different account" link.
  cancelTwoFactor: () => void;
  sendOtp: (payload: SendOtpPayload) => Promise<boolean>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<boolean>;
  googleSignIn: (payload: GoogleAuthPayload) => Promise<boolean>;
  appleSignIn: (payload: AppleAuthPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;

  fetchBranches: () => Promise<void>;

  forgotPassword: (payload: ForgotPasswordPayload) => Promise<boolean>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<boolean>;
  changePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
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

      branches: null,
      branchesLoading: false,
      branchesError: false,

      loginBranchId: null,

      twoFactorCodeSent: false,
      twoFactorMaskedDestination: null,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          loginBranchId: null,
          twoFactorCodeSent: false,
          twoFactorMaskedDestination: null,
        }),

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

          if (isCodeSentResponse(res)) {
            set({
              isLoading: false,
              twoFactorCodeSent: true,
              twoFactorMaskedDestination: res.maskedDestination ?? null,
            });
            toast.success(res.message ?? 'Code sent — check your email.');
            return 'code_sent';
          }

          get().setAuth(res);
          set({
            isLoading: false,
            loginBranchId: payload.branchId ?? null,
            twoFactorCodeSent: false,
            twoFactorMaskedDestination: null,
          });
          toast.success('Welcome back!');
          return 'success';
        } catch (error) {
          const message = extractErrorMessage(error, 'Login failed.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return 'error';
        }
      },

      cancelTwoFactor: () =>
        set({
          twoFactorCodeSent: false,
          twoFactorMaskedDestination: null,
          error: null,
        }),

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

      fetchBranches: async () => {
        set({ branchesLoading: true, branchesError: false });
        try {
          const branches = await authService.getBranches();
          set({ branches, branchesLoading: false });
        } catch {
          set({ branchesLoading: false, branchesError: true });
        }
      },

      forgotPassword: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.forgotPassword(payload);
          set({ isLoading: false });
          toast.success(res.message ?? 'Reset code sent.');
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Could not send reset code.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      resetPassword: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.resetPassword(payload);
          set({ isLoading: false });
          toast.success(res.message ?? 'Password reset.');
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Could not reset password.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
        }
      },

      changePassword: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.changePassword(payload);
          set({ isLoading: false });
          toast.success(res.message ?? 'Password updated.');
          return true;
        } catch (error) {
          const message = extractErrorMessage(error, 'Could not update password.');
          set({ isLoading: false, error: message });
          toast.error(message);
          return false;
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
        loginBranchId: state.loginBranchId,
        // twoFactorCodeSent / twoFactorMaskedDestination intentionally
        // NOT persisted — see the comment above.
      }),
    },
  ),
);
