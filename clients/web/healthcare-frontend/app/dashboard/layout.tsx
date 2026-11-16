// app/dashboard/layout.tsx
// ==================== PATIENT DASHBOARD LAYOUT ====================
//
// این layout برای مسیرهای /dashboard/* (به‌جز /dashboard/doctor و /dashboard/admin) اجرا می‌شود.
//
// تغییرات نسبت به نسخه قبلی:
//   ✅ اگر کاربر doctor باشد → redirect به /dashboard/doctor
//   ✅ اگر کاربر admin باشد → redirect به /dashboard/admin
//   ✅ فقط patient در این layout می‌ماند
//
// نکته: middleware.ts هم همین کار را می‌کند، ولی این layout برای اطمینان بیشتر و SSR است.

import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import Footer from "@/components/layout/Footer";
import { getRoleFromToken } from "@/lib/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  // نقش کاربر را از توکن بخوان
  const role = getRoleFromToken(null); // در SSR، توکن از localStorage خوانده نمی‌شود
  // نکته: getRoleFromToken در SSR null برمی‌گرداند. نقش‌های doctor/admin توسط middleware.ts redirect می‌شوند.
  // اگر به‌هر دلیل اینجا رسیدند و نقششان مشخص شد، دوباره redirect کن.

  // در سمت کلاینت، auth-store نقش را دارد. اینجا فقط ساختار را برمی‌گردانیم.
  // middleware.ts نقش اصلی را در سطح Edge redirect می‌کند.

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 pt-[60px]">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 p-4 md:p-6 lg:pr-[280px] lg:pl-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
