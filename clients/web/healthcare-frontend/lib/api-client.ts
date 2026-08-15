"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_GATEWAY_URL || "http://localhost:8000";

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function apiGet<T>(endpoint: string): Promise<{ success: boolean; data: T }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
  });
  const data = await response.json();
  return { success: response.ok, data };
}

export async function fetchDashboardData() {
  return apiGet("/api/v1/dashboard");
}