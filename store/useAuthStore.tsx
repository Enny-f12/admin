// store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { User, Branch } from '@/types/auth.types';
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

  // NEW — the branchId (if any) the user picked on the login screen.
  // Only meaningful for roles that can pick a branch at all (i.e.
  // SUPER_ADMIN with no assignedBranchId) — the admin layout reads this
  // to default the branch switcher to whatever was chosen at login,
  // instead of "All Branches" or an arbitrary first branch. Persisted so
  // it survives a refresh; cleared on logout.
  loginBranchId: string | null;

  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
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

  fetchBranches: () => Promise<void>;

  // NEW — forgot/reset/change password. Same isLoading/error/toast shape
  // as the other auth actions above, for consistency. forgotPassword +
  // resetPassword back the public /forgot-password page (code-based).
  // changePassword is separate — it's the authenticated, current-password
  // based flow used by the profile page's "change password" form. All
  // three hit endpoints that don't exist on the backend yet (see
  // auth.service.ts / auth.types.ts for the proposed contracts).
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

      // CHANGED — now also captures whichever branchId was passed in the
      // login payload (if any) into loginBranchId, so the admin layout
      // can show that branch first instead of defaulting to "All
      // Branches" or the first branch in the list.
      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(payload);
          get().setAuth(res);
          set({ isLoading: false, loginBranchId: payload.branchId ?? null });
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

      // Public/code-based flow only — from the /forgot-password page,
      // after forgotPassword() above. See changePassword() below for the
      // authenticated profile-page flow.
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

      // Authenticated flow — profile page's "change password" form.
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
      }),
    },
  ),
);