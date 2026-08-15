"use client";

import { motion } from "framer-motion";
import { CalendarDays, Pill, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types/new-layout";

const reminders: Reminder[] = [
  {
    id: "r1",
    type: "appointment",
    title: "نوبت با دکتر احمدی",
    description: "قلب و عروق - ویزیت آنلاین",
    date: "2026-08-15",
    time: "14:00",
    urgency: "soon",
    urgencyLabel: "۲ روز دیگر",
    icon: "CalendarDays",
    iconColor: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
  },
  {
    id: "r2",
    type: "order",
    title: "رسیدن داروها",
    description: "آسپرین + ویتامین D3",
    date: "2026-08-13",
    urgency: "today",
    urgencyLabel: "امروز",
    icon: "Pill",
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    id: "r3",
    type: "medication",
    title: "مصرف قرص فشار خون",
    description: "هر ۸ ساعت یک بار",
    date: "2026-08-13",
    time: "20:00",
    urgency: "today",
    urgencyLabel: "امشب",
    icon: "Clock",
    iconColor: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
  },
];

const iconMap = {
  CalendarDays,
  Pill,
  Clock,
  AlertCircle,
};

const urgencyColors: Record<string, string> = {
  today: "bg-red-500 text-white",
  soon: "bg-amber-500 text-white",
  upcoming: "bg-trust-500 text-white",
};

export default function Reminders() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="overflow-hidden border-healing-200 dark:border-healing-800/30">
        <CardContent className="p-5 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-healing-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-healing-100 dark:bg-healing-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-healing-500" />
              </div>
              <span className="font-bold text-sm text-foreground">یادآوری‌ها</span>
            </div>

            {/* Reminder Items */}
            <div className="space-y-2">
              {reminders.map((reminder, index) => {
                const Icon = iconMap[reminder.icon as keyof typeof iconMap];
                const urgencyColor = urgencyColors[reminder.urgency] || urgencyColors.upcoming;

                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      reminder.bgColor
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className={cn("w-4 h-4", reminder.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{reminder.description}</p>
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", urgencyColor)}>
                      {reminder.urgencyLabel}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}