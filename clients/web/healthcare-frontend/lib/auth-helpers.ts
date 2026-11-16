// lib/auth-helpers.ts
// ==================== AUTH HELPERS — JWT & Token Utilities ====================
//
// توابع کمکی برای کار با JWT و توکن‌ها در فرانت‌endid.
// این توابع در middleware.ts، RoleGuard.tsx و سایر کامپوننت‌ها استفاده می‌شوند.

import type { BackendRole, JwtPayload, Role } from "@/types/auth";
import { normalizeRole } from "@/types/auth";

/**
 * کلید localStorage برای توکن‌ها.
 * هماهنگ با auth-api.ts و profile-api.ts فعلی.
 */
export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const AUTH_USER_KEY = "auth_user";

/**
 * خواندن توکن access از localStorage یا sessionStorage.
 * ترتیب اولویت:
 *   1. localStorage.access_token
 *   2. localStorage.accessToken
 *   3. localStorage.token
 *   4. sessionStorage.access_token
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

/**
 * خواندن توکن refresh از localStorage.
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Decode JWT payload (بدون اعتبارسنجی signature).
 * در فرانت‌endid فقط برای خواندن نقش و user_id استفاده می‌شود.
 * اعتبارسنجی واقعی در api-gateway انجام می‌شود.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // base64url → base64
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // padding
    const padded =
      payloadBase64 + "=".repeat((4 - (payloadBase64.length % 4)) % 4);

    const payloadJson = atob(padded);
    const payload = JSON.parse(payloadJson) as JwtPayload;

    return payload;
  } catch {
    return null;
  }
}

/**
 * استخراج نقش از توکن JWT.
 * backend نقش را با UPPERCASE در JWT ذخیره می‌کند (PATIENT/DOCTOR/ADMIN).
 * این تابع آن را به lowercase تبدیل می‌کند (patient/doctor/admin).
 */
export function getRoleFromToken(token: string | null): Role | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  return normalizeRole(payload.role as BackendRole);
}

/**
 * استخراج user_id از توکن JWT.
 */
export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  return payload.sub ?? null;
}

/**
 * بررسی آیا توکن منقضی شده است (بدون اعتبارسنجی signature).
 * فقط برای پیش‌نمایش در فرانت‌endid — اعتبارسنجی واقعی در api-gateway.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * پاک کردن تمام داده‌های احراز هویت از localStorage.
 */
export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
}

/**
 * ذخیره توکن‌ها در localStorage.
 */
export function persistTokens(access: string, refresh?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}
