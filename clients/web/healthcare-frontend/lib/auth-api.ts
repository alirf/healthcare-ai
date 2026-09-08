"use client";

// ==================== AUTH API CLIENT ====================
// Healthcare Auth Service API Client
// Base URL should be set via environment variable

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "/api/gateway";

// ==================== TYPES ====================

export interface RegisterRequest {
  phone_number: string;
  password: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
}

export interface OTPRequest {
  phone_number: string;
  purpose: "REGISTER" | "LOGIN" | "FORGOT_PASSWORD";
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

export interface User {
  id: string;
  phone_number: string;
  email: string;
  role: string;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== TOKEN MANAGEMENT ====================

export const setTokens = (tokens: AuthTokens) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("token_expires_at", String(Date.now() + tokens.expires_in * 1000));
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

// ==================== API HELPERS ====================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.detail || data?.message || `خطای سرور: ${response.status}`,
      };
    }

    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "خطا در اتصال به سرور",
    };
  }
}

// ==================== AUTH API FUNCTIONS ====================

/**
 * Register a new user
 * POST /auth/register
 * Backend creates user + OTP automatically
 * Returns: { message: "کد تایید به شماره موبایل ارسال شد", user_id: string }
 */
export async function register(
  request: RegisterRequest
): Promise<ApiResponse<{ message: string; user_id: string }>> {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Verify OTP for registration
 * POST /auth/verify-otp
 * Backend verifies OTP with purpose "REGISTER" and returns tokens
 */
export async function verifyOTP(
  request: OTPVerifyRequest
): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (result.success && result.data) {
    setTokens({
      access_token: result.data.access_token,
      refresh_token: result.data.refresh_token,
      expires_in: result.data.expires_in,
      token_type: result.data.token_type,
    });
    setUser(result.data.user);
  }

  return result;
}

/**
 * Login with password
 * POST /auth/login
 */
export async function login(
  request: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (result.success && result.data) {
    setTokens({
      access_token: result.data.access_token,
      refresh_token: result.data.refresh_token,
      expires_in: result.data.expires_in,
      token_type: result.data.token_type,
    });
    setUser(result.data.user);
  }

  return result;
}

/**
 * Request OTP for login
 * POST /auth/login/otp/request
 * Only for LOGIN purpose - backend checks if user exists, then creates OTP
 */
export async function requestLoginOTP(
  request: Pick<OTPRequest, "phone_number">
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest("/auth/login/otp/request", {
    method: "POST",
    body: JSON.stringify({
      phone_number: request.phone_number,
      purpose: "LOGIN",
    }),
  });
}

/**
 * Verify login OTP
 * POST /auth/login/otp/verify
 */
export async function verifyLoginOTP(
  request: LoginOTPVerifyRequest
): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse>("/auth/login/otp/verify", {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (result.success && result.data) {
    setTokens({
      access_token: result.data.access_token,
      refresh_token: result.data.refresh_token,
      expires_in: result.data.expires_in,
      token_type: result.data.token_type,
    });
    setUser(result.data.user);
  }

  return result;
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
export async function refreshToken(): Promise<ApiResponse<AuthTokens>> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return { success: false, error: "توکن بازیابی یافت نشد" };
  }

  const result = await apiRequest<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (result.success && result.data) {
    setTokens(result.data);
  }

  return result;
}

/**
 * Logout user
 * POST /auth/logout
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  const refresh = getRefreshToken();
  clearTokens();

  if (refresh) {
    return apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refresh }),
    });
  }

  return { success: true };
}

/**
 * Request forgot password OTP
 * POST /auth/forgot-password
 * Backend creates OTP with purpose "RESET_PASSWORD"
 */
export async function forgotPassword(
  request: Pick<OTPRequest, "phone_number">
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      phone_number: request.phone_number,
      purpose: "RESET_PASSWORD",
    }),
  });
}

/**
 * Verify forgot password OTP
 * POST /auth/verify-otp
 * Uses purpose "RESET_PASSWORD" to verify the OTP
 * This should be called BEFORE allowing password reset
 */
export async function verifyForgotPasswordOTP(
  request: OTPVerifyRequest
): Promise<ApiResponse<{ message: string }>> {
  // Backend verify_otp_code checks purpose from the OTP record in DB
  // We pass the code and phone_number, backend finds the OTP by phone + purpose
  return apiRequest("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Reset password with OTP
 * POST /auth/reset-password
 * Backend verifies OTP with purpose "RESET_PASSWORD" internally
 */
export async function resetPassword(
  request: ResetPasswordRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get current user info
 * GET /auth/me
 */
export async function getMe(): Promise<ApiResponse<User>> {
  return apiRequest("/auth/me", {
    method: "GET",
  });
}