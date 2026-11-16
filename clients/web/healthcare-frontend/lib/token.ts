// lib/token.ts
// مدیریت کامل توکن‌ها — هم کلاینت lib ها از اینجا استفاده می‌کنند
// هم auth-api برای سازگاری backward این‌ها را re-export می‌کند
import { API_BASE } from "@/lib/api-base";

// ==================== TYPES ====================

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface User {
  id: string;
  phone_number: string;
  email: string;
  role: string;
  is_phone_verified: boolean;
  is_active: boolean;
  created_at: string;
}

// ==================== TOKEN MANAGEMENT ====================

export const setTokens = (tokens: AuthTokens) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("token_expires_at", String(Date.now() + tokens.expires_in * 1000));
    document.cookie = `access_token=${tokens.access_token}; path=/; max-age=${tokens.expires_in}; SameSite=Lax`;
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token");
  }
  return null;
};

export const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("user");
    document.cookie = "access_token=; path=/; max-age=0";
  }
};

export const isTokenExpired = (): boolean => {
  if (typeof window !== "undefined") {
    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt);
  }
  return true;
};

// ==================== USER STORAGE ====================

export const setUser = (user: User) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getUser = (): User | null => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
  }
  return null;
};

// ==================== REFRESH (بدون وابستگی به apiFetch تا چرخه شکل نگیرد) ====================

export async function refreshToken(): Promise<{ success: boolean; data?: AuthTokens; error?: string }> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return { success: false, error: "توکن بازیابی یافت نشد" };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return { success: false, error: err?.detail || `خطای سرور (${res.status})` };
    }

    const data = (await res.json()) as AuthTokens;
    setTokens(data);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "خطا در اتصال به سرور" };
  }
}