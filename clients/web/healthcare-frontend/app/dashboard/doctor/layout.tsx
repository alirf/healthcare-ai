// app/dashboard/doctor/layout.tsx
// ==================== DOCTOR LAYOUT — Role-Specific Shell ====================
//
// این layout فقط برای /dashboard/doctor/* اجرا می‌شود.
// شامل:
//   - DoctorHeader (هدر اختصاصی پزشک با رنگ بنفش)
//   - DoctorSidebar (منوی کناری پزشک)
//   - Footer ساده
//   - MobileNav (در آینده)
//
// نکته: این layout قبل از children اجرا می‌شود. اگر کاربر نقش doctor نداشته باشد،
// middleware.ts او را redirect می‌کند. اینجا دیگر چک لازم نیست.

import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import DoctorHeader from "@/components/doctor/DoctorHeader";
import DoctorSidebar from "@/components/doctor/DoctorSidebar";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // احراز هویت اولیه — middleware.ts کار اصلی را کرده، ولی اینجا هم برای امنیت
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DoctorHeader />
      <div className="flex flex-1 pt-[60px]">
        <DoctorSidebar />
        {/* Padding برای جلوگیری از overlap با sidebar در desktop */}
        <main className="flex-1 transition-all duration-300 p-4 md:p-6 lg:pr-[280px] lg:pl-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
