"use client";
// app/dashboard/doctor/page.tsx
// ==================== DOCTOR DASHBOARD — Main Page ====================
//
// داشبورد اصلی پزشک. شامل:
//   - خلاصه امروز: تعداد ویزیت‌های در انتظار، تکمیل‌شده، در حال گفتگو
//   - لیست ویزیت‌های اخیر
//   - میانبرهای سریع
//   - آمار هفتگی
//
// در گام‌های بعدی با API واقعی جایگزین می‌شود.

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Stethoscope, Users, Clock, CheckCircle2, Loader2,
  CalendarDays, TrendingUp, ChevronLeft, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

// ==================== Stats ====================
const stats = [
  {
    id: "waiting",
    label: "در انتظار پذیرش",
    value: 0, // placeholder — در گام ۵ با fetchVisitQueueCount
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800/30",
    href: "/dashboard/doctor/visits",
  },
  {
    id: "in-progress",
    label: "در حال گفتگو",
    value: 0,
    icon: Activity,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800/30",
    href: "/dashboard/doctor/visits",
  },
  {
    id: "completed-today",
    label: "تکمیل‌شده امروز",
    value: 0,
    icon: CheckCircle2,
    color: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
    borderColor: "border-healing-200 dark:border-healing-800/30",
    href: "/dashboard/doctor/visits",
  },
  {
    id: "total-patients",
    label: "بیماران من",
    value: 0,
    icon: Users,
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    borderColor: "border-trust-200 dark:border-trust-800/30",
    href: "/dashboard/doctor/patients",
  },
];

// ==================== Quick Actions ====================
const quickActions = [
  {
    id: "view-queue",
    title: "مشاهده ویزیت‌های در انتظار",
    subtitle: "بیمارانی که منتظر پذیرش هستند",
    icon: Stethoscope,
    href: "/dashboard/doctor/visits",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "my-patients",
    title: "بیماران من",
    subtitle: "لیست بیماران تحت درمان",
    icon: Users,
    href: "/dashboard/doctor/patients",
    gradient: "from-trust-500 to-healing-500",
  },
  {
    id: "schedule",
    title: "برنامه کاری",
    subtitle: "مدیریت ساعات کاری و نوبت‌ها",
    icon: CalendarDays,
    href: "/dashboard/doctor/schedule",
    gradient: "from-amber-500 to-orange-500",
  },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DoctorDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // شبیه‌سازی بارگذاری — در گام ۵ با fetch واقعی جایگزین می‌شود
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSkeleton />
      </Suspense>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ===== Welcome Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-violet-200 dark:border-violet-800/30">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  سلام {user?.firstName || "پزشک"} 👋
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date().toLocaleDateString("fa-IR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                آنلاین و آماده پذیرش
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Stats Grid ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.id} href={stat.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * idx }}
                >
                  <Card
                    className={cn(
                      "overflow-hidden cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border",
                      stat.borderColor
                    )}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                          stat.bgColor
                        )}
                      >
                        <Icon className={cn("w-5 h-5", stat.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-bold text-foreground">
                          {stat.value.toLocaleString("fa-IR")}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {stat.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ===== Quick Actions ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          میانبرهای سریع
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * idx }}
              >
                <Link href={action.href}>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-border">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md shrink-0",
                          action.gradient
                        )}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {action.subtitle}
                        </p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ===== Recent Visits (placeholder) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-500" />
                ویزیت‌های اخیر
              </h2>
              <Link href="/dashboard/doctor/visits">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-violet-500">
                  مشاهده همه
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                </Button>
              </Link>
            </div>
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Loader2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                لیست ویزیت‌های اخیر به‌زودی نمایش داده می‌شود
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                در گام ۵ با اتصال به API واقعی تکمیل می‌شود
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
