export interface UserPreferences {
  assignedBranchIds?: string[];
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  assignedBranchId: string | null;
  vendorId: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  primaryAuthProvider: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
  preferences: UserPreferences | null;
  permissions: string[];
  invPermissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Branch {
  id: string;
  name: string;
}

// POST /auth/register
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegisterResponse extends User {
  message: string;
}

// ── Login / 2FA ──
// One endpoint now covers both steps. twoFactorCode omitted = "please
// validate my credentials and send me a code". twoFactorCode present =
// "here's everything, log me in." See backend request doc v4.0.
export interface LoginPayload {
  email: string;
  password: string;
  twoFactorCode?: string;
  branchId?: string;
}

// Returned by /auth/login when credentials were valid but no code was
// submitted yet — a code has just been emailed.
export interface CodeSentResponse {
  codeSent: true;
  message: string;
  maskedDestination?: string; // e.g. "s***@gmail.com", display only
}

export type LoginResponse = AuthResponse | CodeSentResponse;

export function isCodeSentResponse(res: LoginResponse): res is CodeSentResponse {
  return (res as CodeSentResponse).codeSent === true;
}

// POST /auth/send-otp
export interface SendOtpPayload {
  email?: string;
  phone?: string;
}

// POST /auth/verify-otp
export interface VerifyOtpPayload {
  email?: string;
  phone?: string;
  code: string;
}

// POST /auth/google
export interface GoogleAuthPayload {
  idToken: string;
}

// POST /auth/apple
export interface AppleAuthPayload {
  idToken: string;
  email?: string;
}

// POST /auth/refresh — NOT YET CONFIRMED, see backend request doc (Auth #1)
export interface RefreshPayload {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  identifier: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  identifier: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}
