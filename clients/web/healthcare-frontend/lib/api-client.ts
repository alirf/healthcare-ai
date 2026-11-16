"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function apiGet<T>(endpoint: string): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = await getAuthToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      // مهم: اگر داده داشبورد عوض می‌شود، کش را غیرفعال کن
      cache: "no-store",
    });
  } catch {
    return { success: false, error: "خطا در اتصال به سرور" };
  }

  if (response.status === 204) return { success: true };

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      success: false,
      error: data?.detail || `خطای سرور (${response.status})`,
    };
  }
  return { success: true, data: data as T };
}

export async function fetchDashboardData() {
  return apiGet("/api/v1/dashboard");
}