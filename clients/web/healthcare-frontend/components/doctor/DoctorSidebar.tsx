"use client";
// components/doctor/DoctorSidebar.tsx
// ==================== DOCTOR SIDEBAR — Role-Specific Navigation ====================
//
// منوی کناری اختصاصی پزشک. برخلاف PatientSidebar که شامل ویزیت/پرونده/داروخانه است،
// این منو شامل:
//   - داشبورد پزشک (آمار امروز)
//   - لیست ویزیت‌های در انتظار (با badge شمارش)
//   - بیماران من
//   - برنامه کاری
//   - پروفایل حرفه‌ای
//   - تنظیمات
//
// طراحی: هم‌سازی با Sidebar فعلی بیمار (همان رنگ‌ها، same animations، RTL)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  CalendarDays,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Clock,
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  {
    id: "doctor-dashboard",
    label: "داشبورد",
    href: "/dashboard/doctor",
    icon: LayoutDashboard,
  },
  {
    id: "doctor-visits",
    label: "ویزیت‌های در انتظار",
    href: "/dashboard/doctor/visits",
    icon: Stethoscope,
    badge: true, // نشان شمارش ویزیت‌های در انتظار
  },
  {
    id: "doctor-patients",
    label: "بیماران من",
    href: "/dashboard/doctor/patients",
    icon: Users,
  },
  {
    id: "doctor-schedule",
    label: "برنامه کاری",
    href: "/dashboard/doctor/schedule",
    icon: CalendarDays,
  },
  {
    id: "doctor-profile",
    label: "پروفایل حرفه‌ای",
    href: "/dashboard/doctor/profile",
    icon: UserCog,
  },
  {
    id: "doctor-settings",
    label: "تنظیمات",
    href: "/dashboard/doctor/settings",
    icon: Settings,
  },
];

export default function DoctorSidebar() {
  const pathname = usePathname();
  const { isOpen, isCollapsed, toggle, close, setCollapsed } =
    useSidebarStore();

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 260,
          x: isOpen || !isMobile ? 0 : 260,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed top-[60px] bottom-0 right-0 z-30 bg-card border-l border-border shadow-lg",
          "flex flex-col overflow-hidden",
          isMobile && "top-0"
        )}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">منوی پزشک</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Sidebar Header (Desktop only) */}
        {!isMobile && !isCollapsed && (
          <div className="px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground">
                  پنل پزشک
                </span>
                <p className="text-[10px] text-muted-foreground">
                  سلامت هوشمند
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => isMobile && close()}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive && "text-white"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="doctorSidebarActive"
                      className="mr-auto w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                  {/* Badge for waiting visits count */}
                  {item.badge && !isCollapsed && (
                    <WaitingVisitsBadge isActive={isActive} />
                  )}
                  {item.badge && isCollapsed && (
                    <WaitingVisitsDot isActive={isActive} />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Doctor Status */}
        {!isCollapsed && (
          <div className="p-3 border-t border-border/50">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  آنلاین و آماده پذیرش
                </p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                  وضعیت: در دسترس
                </p>
              </div>
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        )}

        {/* Collapse Toggle Button */}
        {!isMobile && (
          <div className="p-3 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={() => setCollapsed(!isCollapsed)}
              className={cn(
                "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
                isCollapsed && "justify-center"
              )}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-xs font-medium">بستن منو</span>
                </>
              )}
            </Button>
          </div>
        )}
      </motion.aside>

      {/* Mobile Toggle Button (Floating) */}
      {isMobile && !isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => useSidebarStore.getState().open()}
          className="fixed top-[72px] right-4 z-20 w-10 h-10 rounded-full bg-violet-500 text-white shadow-lg flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
      )}
    </>
  );
}

/**
 * Badge شمارش ویزیت‌های در انتظار.
 * TODO: از API بخواند — در گام ۵ به doctor-api.ts اضافه می‌شود.
 */
function WaitingVisitsBadge({ isActive }: { isActive: boolean }) {
  // در حال حاضر placeholder — در گام ۵ با fetchVisitQueueCount جایگزین می‌شود
  const count = 0;

  if (count === 0) return null;

  return (
    <span
      className={cn(
        "mr-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold",
        isActive
          ? "bg-white text-violet-600"
          : "bg-amber-500 text-white"
      )}
    >
      {count.toLocaleString("fa-IR")}
    </span>
  );
}

function WaitingVisitsDot({ isActive }: { isActive: boolean }) {
  const count = 0;
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "absolute top-1 right-1 w-2 h-2 rounded-full",
        isActive ? "bg-white" : "bg-amber-500"
      )}
    />
  );
}
