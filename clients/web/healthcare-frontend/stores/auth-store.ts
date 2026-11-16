"use client";
// stores/auth-store.ts
// ==================== AUTH STORE — Role-Aware ====================
//
// تغییرات نسبت به نسخه قبل:
//   ✅ نقش (role) به state اضافه شد
//   ✅ mock state حذف شد (isAuthenticated پیش‌فرض false)
//   ✅ constructor اطلاعات کاربر را از JWT می‌خواند (اگر توکن معتبر باشد)
//   ✅ تابع setTokens اضافه شد — توکن + نقش را همزمان ست می‌کند
//   ✅ تابع hasRole برای بررسی نقش

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BackendRole, Role } from "@/types/auth";
import { normalizeRole } from "@/types/auth";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role; // نقش normalized (lowercase)
  avatarUrl?: string;
}

interface AuthStore {
  // state
  user: AuthUser | null;
  isAuthenticated: boolean;
  role: Role | null;
  accessToken: string | null;
  refreshToken: string | null;

  // actions
  setUser: (user: AuthUser | null) => void;
  setTokens: (
    access: string,
    refresh: string,
    user?: AuthUser | null
  ) => void;
  hasRole: (role: Role) => boolean;
  logout: () => void;
}

/**
 * Decode JWT payload بدون اعتبارسنجی signature (فرانت‌endid فقط برای خواندن نقش).
 * اعتبارسنجی واقعی در api-gateway انجام می‌شود.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * از روی توکن access، نقش را استخراج می‌کند.
 * backend در JWT نقش را با UPPERCASE ذخیره می‌کند (PATIENT/DOCTOR/ADMIN).
 */
function extractRoleFromToken(token: string | null): Role | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return normalizeRole(payload.role as string);
}

/**
 * ساخت AuthUser از روی JWT payload + اطلاعات ذخیره‌شده در localStorage.
 * در حالت اولیه (بعد از refresh صفحه) این تابع کاربر را بازسازی می‌کند.
 */
function buildInitialUser(): {
  user: AuthUser | null;
  isAuthenticated: boolean;
  role: Role | null;
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof window === "undefined") {
    return {
      user: null,
      isAuthenticated: false,
      role: null,
      accessToken: null,
      refreshToken: null,
    };
  }

  const accessToken =
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    null;
  const refreshToken = localStorage.getItem("refresh_token") || null;

  if (!accessToken) {
    return {
      user: null,
      isAuthenticated: false,
      role: null,
      accessToken: null,
      refreshToken: null,
    };
  }

  const role = extractRoleFromToken(accessToken);
  if (!role) {
    // توکن معتبر نیست — پاکش کن
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return {
      user: null,
      isAuthenticated: false,
      role: null,
      accessToken: null,
      refreshToken: null,
    };
  }

  // اطلاعات کاربر را از localStorage یا از JWT payload بازسازی کن
  // (auth-service در /auth/me اطلاعات کامل را برمی‌گرداند، ولی در store اولیه فقط نقش و id داریم)
  const storedUser = localStorage.getItem("auth_user");
  let user: AuthUser | null = null;
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser) as Partial<AuthUser>;
      user = {
        id: parsed.id ?? "",
        firstName: parsed.firstName ?? "",
        lastName: parsed.lastName ?? "",
        email: parsed.email ?? "",
        phone: parsed.phone ?? "",
        role, // همیشه از توکن بگیر، نه از localStorage
        avatarUrl: parsed.avatarUrl,
      };
    } catch {
      user = null;
    }
  }

  // fallback: اگر storedUser نبود، از JWT payload بساز
  if (!user) {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.sub) {
      user = {
        id: String(payload.sub),
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role,
      };
    }
  }

  return {
    user,
    isAuthenticated: true,
    role,
    accessToken,
    refreshToken,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // initial state — از روی توکن ذخیره‌شده بازسازی می‌شود
      ...buildInitialUser(),

      // actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          role: user?.role ?? null,
        }),

      setTokens: (access, refresh, user = null) => {
        const role = extractRoleFromToken(access);
        // توکن‌ها را در localStorage ذخیره کن (برای apiFetch و middleware)
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access);
          if (refresh) localStorage.setItem("refresh_token", refresh);
          if (user) localStorage.setItem("auth_user", JSON.stringify(user));
        }
        set({
          accessToken: access,
          refreshToken: refresh,
          role,
          isAuthenticated: !!access,
          user: user ?? get().user,
        });
      },

      hasRole: (role) => get().role === role,

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("auth_user");
        }
        set({
          user: null,
          isAuthenticated: false,
          role: null,
          accessToken: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: "healthcare-auth",
      // فقط نقش و isAuthenticated را persist کن — توکن‌ها در localStorage مدیریت می‌شوند
      partialize: (s) => ({
        role: s.role,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

// ==================== Selector Hooks ====================

/** hook برای گرفتن نقش فعلی */
export const useRole = (): Role | null => useAuthStore((s) => s.role);

/** hook برای بررسی آیا کاربر پزشک است */
export const useIsDoctor = (): boolean =>
  useAuthStore((s) => s.role === "doctor");

/** hook برای بررسی آیا کاربر بیمار است */
export const useIsPatient = (): boolean =>
  useAuthStore((s) => s.role === "patient");

/** hook برای بررسی آیا کاربر ادمین است */
export const useIsAdmin = (): boolean => useAuthStore((s) => s.role === "admin");
