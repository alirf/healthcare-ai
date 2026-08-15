"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Stethoscope,
  Pill,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Activity } from "@/types/new-layout";
import { cn, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

const activities: Activity[] = [
  {
    id: "a1",
    type: "chat",
    title: "گفتگو با دکتر احمدی",
    description: "آخرین پیام: \"لطفاً نتایج آزمایش را ارسال کنید\"",
    status: "new_message",
    statusLabel: "پیام جدید",
    date: "2026-08-13T10:30:00Z",
    icon: "MessageSquare",
    iconColor: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-900/20",
    link: "/dashboard/chat-doctor",
  },
  {
    id: "a2",
    type: "visit",
    title: "ویزیت آنلاین تکمیل شد",
    description: "دکتر کریمی - تخصص داخلی",
    status: "completed",
    statusLabel: "تکمیل شده",
    date: "2026-08-12T14:00:00Z",
    icon: "Stethoscope",
    iconColor: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
    link: "/dashboard/visit/v2",
  },
  {
    id: "a3",
    type: "order",
    title: "سفارش دارو ارسال شد",
    description: "آسپرین + ویتامین D3",
    status: "shipping",
    statusLabel: "در حال ارسال",
    date: "2026-08-12T09:00:00Z",
    icon: "Pill",
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    link: "/dashboard/orders",
  },
  {
    id: "a4",
    type: "ai",
    title: "تحلیل هوش مصنوعی",
    description: "احتمال آنژین صدری: ۶۵٪",
    status: "in_progress",
    statusLabel: "در حال بررسی",
    date: "2026-08-11T08:00:00Z",
    icon: "Brain",
    iconColor: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    link: "/dashboard/ai-chat",
  },
  {
    id: "a5",
    type: "appointment",
    title: "نوبت جدید ثبت شد",
    description: "دکتر سارا احمدی - ۱۵ مرداد",
    status: "scheduled",
    statusLabel: "برنامه‌ریزی",
    date: "2026-08-10T10:00:00Z",
    icon: "CalendarDays",
    iconColor: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    link: "/dashboard/appointments",
  },
];

const iconMap = {
  MessageSquare,
  Stethoscope,
  Pill,
  Brain,
  CalendarDays,
};

const statusBadgeColors: Record<string, string> = {
  new_message: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  completed: "bg-healing-500/10 text-healing-600 border-healing-500/20",
  shipping: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_progress: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  scheduled: "bg-trust-500/10 text-trust-600 border-trust-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  delivered: "bg-healing-500/10 text-healing-600 border-healing-500/20",
};

export default function RecentActivity() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-3"
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-trust-500" />
              فعالیت‌های اخیر
            </CardTitle>
            <Link href="/dashboard/activities">
              <Button variant="ghost" size="sm" className="text-trust-500 hover:text-trust-600 hover:bg-trust-50 text-xs h-8">
                مشاهده همه
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {activities.map((activity, index) => {
              const Icon = iconMap[activity.icon as keyof typeof iconMap];
              const statusColor = statusBadgeColors[activity.status] || statusBadgeColors.pending;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                >
                  <Link href={activity.link}>
                    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer group">
                      {/* Icon */}
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", activity.bgColor)}>
                        <Icon className={cn("w-5 h-5", activity.iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      </div>

                      {/* Status */}
                      <Badge variant="outline" className={cn("text-[10px] shrink-0 hidden sm:flex", statusColor)}>
                        {activity.statusLabel}
                      </Badge>

                      {/* Date */}
                      <span className="text-xs text-muted-foreground shrink-0 hidden md:block w-20 text-left">
                        {formatRelativeTime(activity.date)}
                      </span>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-trust-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}