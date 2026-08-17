// types/auth.types.ts

/**
 * CONFIRMED — matches the real POST /auth/login response body exactly
 * (verified against a live login response). Previous version was missing
 * assignedBranchId, status, permissions, invPermissions, vendorId,
 * createdAt/updatedAt, lastLoginAt/lastSeenAt, marketingOptIn,
 * whatsappOptIn, and preferences — those are now added below.
 *
 * `permissions` / `invPermissions` came back as empty arrays in the sample
 * response — element type is a guess (string) until we see a populated
 * array. `preferences` came back null — shape unknown, left as unknown.
 */
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
  preferences: unknown | null;
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

/**
 * CONFIRMED — matches GET /auth/branches ("List all active branches for
 * the login dropdown"). Response shape itself hasn't been hit live yet —
 * field names below are a reasonable guess (id + display name) based on
 * what the login dropdown needs. Correct once you've seen a real response.
 */
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

/**
 * CONFIRMED — matches Swagger exactly: "Login with email/password and
 * optional branchId". branchId is documented as optional in the DTO —
 * previously omitted here because an earlier ValidationPipe check
 * (forbidNonWhitelisted: true) suggested sending it would 400. Swagger
 * now shows it as an accepted field, so it's safe to send.
 */
export interface LoginPayload {
  email: string;
  password: string;
  branchId?: string;
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

/**
 * CONFIRMED CONTRACT — not yet live on the backend, but these shapes are
 * finalized in the backend request doc (not a guess). Two calls for the
 * public "forgot password" flow:
 *
 *   1. POST /auth/forgot-password { identifier }
 *      Sends a 6-digit code to whichever email/phone `identifier`
 *      resolves to.
 *
 *   2. POST /auth/reset-password { identifier, code, newPassword }
 *      Confirms the code and sets a new password. This is
 *      code-based only — it does NOT accept an authenticated,
 *      code-less call, so it can't be reused for the profile page's
 *      "change password" form. See ChangePasswordPayload below for that.
 */
export interface ForgotPasswordPayload {
  identifier: string; // email or phone
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

/**
 * NOT YET BUILT ON THE BACKEND — proposed contract for the profile page's
 * "change password" form, handed to the backend dev alongside items 1/2
 * above. Authenticated (accessToken in the Authorization header) and
 * requires currentPassword to confirm it's really the account owner —
 * a live session alone isn't proof of that. Should revoke the user's
 * other refresh tokens on success, matching the "you'll be signed out on
 * other devices" copy already in the UI.
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}