// types/auth.ts
// ==================== AUTH TYPES — Role-Based ====================
//
// نقش‌ها در سیستم (با حروف کوچک در فرانت‌اند، با حروف بزرگ در JWT payload):
//   patient — بیمار
//   doctor  — پزشک
//   admin   — مدیر
//
// backend (auth-service/app/core/security.py) نقش را در JWT با UPPERCASE ذخیره می‌کند:
//   payload = {"sub": user_id, "role": "PATIENT", ...}
//
// ولی api-gateway هدر x-user-role را با lowercase به سرویس‌های پایین می‌فرستد.
// در فرانت‌endid همیشه lowercase کار کنیم تا یکپارچه باشد.

/** نقش‌های مجاز در سیستم */
export type Role = "patient" | "doctor" | "admin";

/** نقش‌های موجود در JWT payload (UPPERCASE — backend فرمت) */
export type BackendRole = "PATIENT" | "DOCTOR" | "ADMIN";

/** تبدیل نقش backend (UPPERCASE) به فرمت frontend (lowercase) */
export function normalizeRole(raw: string | undefined | null): Role | null {
  if (!raw) return null;
  const r = String(raw).toLowerCase().trim();
  if (r === "patient") return "patient";
  if (r === "doctor") return "doctor";
  if (r === "admin") return "admin";
  return null;
}

// ==================== AUTH API TYPES ====================

export interface RegisterRequest {
  phone_number: string;
  password: string;
  email: string;
  role: BackendRole;
}

export interface OTPRequest {
  phone_number: string;
  purpose: "REGISTER" | "LOGIN" | "RESET_PASSWORD";
}

export interface OTPVerifyRequest {
  phone_number: string;
  code: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginOTPVerifyRequest {
  phone_number: string;
  code: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface ResetPasswordRequest {
  phone_number: string;
  code: string;
  new_password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * User برگشتی از auth-service بعد از login/verify.
 * هماهنگ با auth-service/app/models.py::User
 */
export interface User {
  id: string;
  phone_number: string;
  email: string | null;
  role: BackendRole; // PATIENT | DOCTOR | ADMIN
  is_phone_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

// ==================== JWT Payload (Decode در فرانت‌اند) ====================

/**
 * ساختار JWT payload که از auth-service تولید می‌شود.
 * مرجع: auth-service/app/core/security.py::create_access_token
 */
export interface JwtPayload {
  sub: string; // user_id
  role: BackendRole; // PATIENT | DOCTOR | ADMIN
  phone_verified?: boolean;
  iat?: number;
  exp?: number;
  type?: "access" | "refresh";
  iss?: string;
}

// ==================== Role Helpers ====================

/** آیا نقش بیمار است؟ */
export const isPatient = (role: Role | null | undefined): role is "patient" =>
  role === "patient";

/** آیا نقش پزشک است؟ */
export const isDoctor = (role: Role | null | undefined): role is "doctor" =>
  role === "doctor";

/** آیا نقش مدیر است؟ */
export const isAdmin = (role: Role | null | undefined): role is "admin" =>
  role === "admin";

/** نقش‌های مجاز برای دسترسی به مسیر خاص */
export type AllowedRoles = Role[];
