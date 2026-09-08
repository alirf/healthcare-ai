// ==================== AUTH API TYPES ====================

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