"use server";

import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  try {
    const payload = jwtDecode<JWTPayload>(token);
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export async function isAuthenticated(): Promise<boolean> {
  //return true;
  return !!(await getSession());
}