// types/auth.ts

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  primaryAuthProvider: string;
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

// POST /auth/login
export interface LoginPayload {
  email: string;
  password: string;
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