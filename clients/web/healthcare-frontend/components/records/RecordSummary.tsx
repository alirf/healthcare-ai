"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Stethoscope,
  FlaskConical,
  Image,
  ClipboardList,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RecordSummary as RecordSummaryType } from "@/types/records";

interface RecordSummaryProps {
  summary: RecordSummaryType;
}

const stats = [
  {
    key: "totalVisits",
    label: "ویزیت‌ها",
    icon: Stethoscope,
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    borderColor: "border-trust-200 dark:border-trust-800",
  },
  {
    key: "totalTests",
    label: "آزمایش‌ها",
    icon: FlaskConical,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    key: "totalImages",
    label: "تصاویر",
    icon: Image,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  {
    key: "totalNotes",
    label: "یادداشت‌ها",
    icon: ClipboardList,
    color: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
    borderColor: "border-healing-200 dark:border-healing-800",
  },
];

export default function RecordSummary({ summary }: RecordSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden border-trust-200 dark:border-trust-800/30">
        <CardContent className="p-5 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-trust-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />

          <div className="relative z-10 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center">
                <FileText className="w-4 h-4 text-trust-500" />
              </div>
              <span className="font-bold text-sm text-foreground">خلاصه پرونده‌ها</span>
            </div>

            {/* Total Records */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                {summary.totalRecords.toLocaleString("fa-IR")}
              </span>
              <span className="text-sm text-muted-foreground">پرونده</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const value = summary[stat.key as keyof RecordSummaryType] as number;
                return (
                  <motion.div
                    key={stat.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border",
                      stat.bgColor,
                      stat.borderColor
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mb-1", stat.color)} />
                    <span className={cn("text-lg font-bold", stat.color)}>
                      {value.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Activity className="w-3.5 h-3.5 text-healing-500" />
              <span>آخرین بروزرسانی:</span>
              <span className="font-medium text-foreground">
                {new Date(summary.lastUpdated).toLocaleDateString("fa-IR")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}