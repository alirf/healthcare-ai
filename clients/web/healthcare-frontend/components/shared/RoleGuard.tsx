"use client";
// components/shared/RoleGuard.tsx
// ==================== ROLE GUARD — Client-Side Protection ====================
//
// کامپوننت wrapper برای محافظت از صفحات در سطح کلاینت.
//
// استفاده:
//   <RoleGuard allowedRoles={["doctor"]}>
//     <DoctorOnlyContent />
//   </RoleGuard>
//
// اگر کاربر نقش مجاز نداشته باشد:
//   - اگر لاگین نکرده → redirect به /login
//   - اگر نقش متفاوت دارد → redirect به dashboard متناظر
//   - در حالت loading → اسکلتون
//
// نکته: این کامپوننت در کنار middleware.ts استفاده می‌شود.
// middleware.ts در سطح server محافظت می‌کند، این کامپوننت در سطح client.
// همیشه هر دو فعال باشند.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath } from "@/lib/role-redirect";
import type { Role } from "@/types/auth";

interface RoleGuardProps {
  /** نقش‌هایی که اجازه دسترسی دارند */
  allowedRoles: Role[];
  /** محتوای محافظت‌شده */
  children: React.ReactNode;
  /** مسیر redirect سفارشی (اختیاری) — اگر نباشد، به dashboard متناظر می‌رود */
  redirectTo?: string;
  /** show fallback while checking — پیش‌فرض: true */
  showFallback?: boolean;
}

export function RoleGuard({
  allowedRoles,
  children,
  redirectTo,
  showFallback = true,
}: RoleGuardProps) {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // اگر لاگین نکرده → redirect به /login
    if (!isAuthenticated || !role) {
      router.replace("/login");
      return;
    }

    // اگر نقش مجاز نیست → redirect به dashboard متناظر
    if (!allowedRoles.includes(role)) {
      const target = redirectTo ?? getDashboardPath(role);
      router.replace(target);
      return;
    }
  }, [mounted, isAuthenticated, role, allowedRoles, redirectTo, router]);

  // در SSR یا قبل از mount، چیزی نمایش نده تا از hydration mismatch جلوگیری شود
  if (!mounted) {
    return showFallback ? <RoleGuardFallback /> : null;
  }

  // اگر لاگین نکرده یا نقش مجاز نیست
  if (!isAuthenticated || !role || !allowedRoles.includes(role)) {
    return showFallback ? <RoleGuardFallback /> : null;
  }

  return <>{children}</>;
}

/**
 * اسکلتون نمایشی هنگام بررسی نقش.
 */
function RoleGuardFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        در حال بررسی دسترسی...
      </div>
    </div>
  );
}

/**
 * کامپوننت نمایش خطا وقتی کاربر نقش لازم را ندارد.
 * (در حالت عادی middleware redirect می‌کند، ولی اگر به‌هر دلیل اینجا رسید)
 */
export function AccessDenied({
  requiredRoles,
  yourRole,
}: {
  requiredRoles: Role[];
  yourRole: Role | null;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">دسترسی غیرمجاز</h2>
            <p className="text-sm text-muted-foreground">
              این صفحه فقط برای نقش‌های{" "}
              <span className="font-medium text-foreground">
                {requiredRoles.map((r) => roleLabel(r)).join("، ")}
              </span>{" "}
              قابل دسترسی است.
            </p>
            {yourRole && (
              <p className="text-xs text-muted-foreground">
                نقش شما:{" "}
                <span className="font-medium">{roleLabel(yourRole)}</span>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(yourRole ? getDashboardPath(yourRole) : "/login")}
          >
            بازگشت به داشبورد
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function roleLabel(role: Role): string {
  switch (role) {
    case "patient":
      return "بیمار";
    case "doctor":
      return "پزشک";
    case "admin":
      return "مدیر";
    default:
      return role;
  }
}

// ==================== Convenient Wrappers ====================

/** فقط برای بیمار */
export function PatientOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["patient"]}>{children}</RoleGuard>;
}

/** فقط برای پزشک */
export function DoctorOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["doctor"]}>{children}</RoleGuard>;
}

/** فقط برای ادمین */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}

/** برای پزشک یا ادمین */
export function StaffOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["doctor", "admin"]}>{children}</RoleGuard>;
}
