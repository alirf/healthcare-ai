// middleware.ts
// ==================== ROLE-BASED ROUTE PROTECTION ====================
//
// این فایل در root پروژه قرار می‌گیرد و توسط Next.js روی همه route‌ها اجرا می‌شود.
//
// کارهای middleware:
//   1. اگر کاربر به /dashboard/* رفت ولی توکن ندارد → redirect به /login
//   2. اگر doctor به /dashboard/* (صفحات بیمار) رفت → redirect به /dashboard/doctor
//   3. اگر patient به /dashboard/doctor/* رفت → redirect به /dashboard
//   4. اگر admin به /dashboard/doctor/* یا /dashboard/* (صفحات بیمار) رفت → redirect به /dashboard/admin
//
// نکته: middleware در Edge Runtime اجرا می‌شود و نمی‌تواند از zustand یا localStorage استفاده کند.
// به همین دلیل توکن را از cookie می‌خوانیم (در login باید توکن را در cookie هم set کنیم).
//
// اگر cookie نباشد، از header Authorization استفاده می‌کنیم (برای SSR).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { BackendRole, Role } from "@/types/auth";

function normalizeRole(raw: string | undefined | null): Role | null {
  if (!raw) return null;
  const r = String(raw).toLowerCase().trim();
  if (r === "patient") return "patient";
  if (r === "doctor") return "doctor";
  if (r === "admin") return "admin";
  return null;
}

/**
 * Decode JWT payload بدون اعتبارسنجی signature (Edge Runtime نمی‌تواند کلید عمومی RSA را راحت لود کند).
 * اعتبارسنجی واقعی در api-gateway انجام می‌شود.
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      payloadBase64 + "=".repeat((4 - (payloadBase64.length % 4)) % 4);

    // در Edge Runtime، atob موجود است
    const payloadJson = atob(padded);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function getRoleFromRequest(request: NextRequest): Role | null {
  // ۱. از cookie (پیشنهادی برای production)
  const cookieToken = request.cookies.get("access_token")?.value;
  if (cookieToken) {
    const payload = decodeJwt(cookieToken);
    if (payload?.role) {
      const role = normalizeRole(payload.role as BackendRole);
      if (role) return role;
    }
  }

  // ۲. از header Authorization (برای SSR یا API calls)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = decodeJwt(token);
    if (payload?.role) {
      const role = normalizeRole(payload.role as BackendRole);
      if (role) return role;
    }
  }

  return null;
}

function getDashboardPath(role: Role): string {
  switch (role) {
    case "doctor":
      return "/dashboard/doctor";
    case "admin":
      return "/dashboard/admin";
    case "patient":
    default:
      return "/dashboard";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Public Routes — هیچ اعتبارسنجی لازم نیست ────────────────────
  const PUBLIC_PATHS = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/about",
    "/privacy",
    "/terms",
    "/test",
    "/health",
  ];

  // مسیرهای عمومی — همیشه اجازه عبور
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // ولی اگر کاربر قبلاً login کرده، نباید بتواند به /login برگردد
    if (pathname === "/login" || pathname === "/register") {
      const role = getRoleFromRequest(request);
      if (role) {
        // قبلاً login کرده → redirect به dashboard متناظر
        return NextResponse.redirect(
          new URL(getDashboardPath(role), request.url)
        );
      }
    }
    return NextResponse.next();
  }

  // ─── Static files & API — نادیده بگیر ──────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ─── Protected Routes — بررسی احراز هویت ──────────────────────────
  const role = getRoleFromRequest(request);

  // اگر توکن نبود → redirect به /login
  if (!role) {
    const loginUrl = new URL("/login", request.url);
    // بعد از login، کاربر به صفحه‌ای که می‌خواست برگردد
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Role-Based Access Control ──────────────────────────────────

  // صفحات doctor — فقط doctor
  if (pathname.startsWith("/dashboard/doctor")) {
    if (role !== "doctor") {
      return NextResponse.redirect(
        new URL(getDashboardPath(role), request.url)
      );
    }
    return NextResponse.next();
  }

  // صفحات admin — فقط admin
  if (pathname.startsWith("/dashboard/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(
        new URL(getDashboardPath(role), request.url)
      );
    }
    return NextResponse.next();
  }

  // صفحات patient (بقیه /dashboard/*) — فقط patient
  // doctor نباید به /dashboard/visit یا /dashboard/records برود
  if (pathname.startsWith("/dashboard")) {
    if (role !== "patient") {
      return NextResponse.redirect(
        new URL(getDashboardPath(role), request.url)
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

/**
 * Matcher — فقط روی این مسیرها اجرا می‌شود.
 * همه‌چیز به جز static files و API routes و فایل‌های static.
 */
export const config = {
  matcher: [
    /*
     * همه route‌ها به جز:
     *   - /_next/* (Next.js internals)
     *   - /api/* (API routes)
     *   - /favicon.ico, /robots.txt, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json).*)",
  ],
};
