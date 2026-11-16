// lib/role-redirect.ts
// ==================== ROLE-BASED REDIRECTS ====================
//
// توابع کمکی برای redirect کاربر بر اساس نقش.
// در سه جا استفاده می‌شود:
//   1. بعد از login موفق (login/page.tsx)
//   2. در middleware.ts (محافظت از route‌ها)
//   3. در layout.tsx (redirect doctor از صفحات بیمار)

import type { Role } from "@/types/auth";

/**
 * مسیر داشبورد اصلی بر اساس نقش.
 *
 * @param role نقش کاربر (lowercase)
 * @returns مسیر داشبورد
 *
 *   patient → /dashboard          (صفحات فعلی بیمار)
 *   doctor  → /dashboard/doctor   (صفحات پزشک)
 *   admin   → /dashboard/admin    (صفحات ادمین — آینده)
 */
export function getDashboardPath(role: Role | null | undefined): string {
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

/**
 * مسیر پیش‌فرض بعد از login موفق.
 */
export function getPostLoginPath(role: Role | null | undefined): string {
  return getDashboardPath(role);
}

/**
 * مسیر پروفایل بر اساس نقش.
 */
export function getProfilePath(role: Role | null | undefined): string {
  switch (role) {
    case "doctor":
      return "/dashboard/doctor/profile";
    case "admin":
      return "/dashboard/admin/profile";
    case "patient":
    default:
      return "/dashboard/profile";
  }
}

/**
 * بررسی آیا مسیر خاص برای نقش خاص مجاز است.
 *
 * قوانین:
 *   - /dashboard/doctor/* فقط برای doctor
 *   - /dashboard/admin/* فقط برای admin
 *   - /dashboard/* (بقیه) فقط برای patient
 *     (doctor و admin نباید به صفحات بیمار بروند)
 */
export function isPathAllowedForRole(
  pathname: string,
  role: Role | null | undefined
): boolean {
  if (!role) return false;

  // صفحات auth — برای همه (ولی اگر لاگین شده، redirect به dashboard)
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return true;
  }

  // صفحات عمومی
  if (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/privacy" ||
    pathname === "/terms"
  ) {
    return true;
  }

  // صفحات doctor — فقط doctor
  if (pathname.startsWith("/dashboard/doctor")) {
    return role === "doctor";
  }

  // صفحات admin — فقط admin
  if (pathname.startsWith("/dashboard/admin")) {
    return role === "admin";
  }

  // صفحات عمومی dashboard — فقط patient
  // (doctor و admin نباید به /dashboard/visit یا /dashboard/records بروند)
  if (pathname.startsWith("/dashboard")) {
    return role === "patient";
  }

  // بقیه مسیرها (مثل /test، صفحات static) — مجاز برای همه
  return true;
}

/**
 * مسیر جایگزین وقتی کاربر به صفحاتی که مجاز نیست دسترسی پیدا کرد.
 */
export function getRedirectPath(
  pathname: string,
  role: Role | null | undefined
): string | null {
  if (!role) return "/login";

  // اگر doctor/admin سعی کرد به صفحات بیمار برود
  if (
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/doctor") &&
    !pathname.startsWith("/dashboard/admin") &&
    role !== "patient"
  ) {
    return getDashboardPath(role);
  }

  // اگر patient سعی کرد به صفحات doctor برود
  if (pathname.startsWith("/dashboard/doctor") && role !== "doctor") {
    return getDashboardPath(role);
  }

  // اگر patient/doctor سعی کرد به صفحات admin برود
  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    return getDashboardPath(role);
  }

  return null;
}
