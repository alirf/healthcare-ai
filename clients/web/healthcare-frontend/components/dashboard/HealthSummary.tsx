"use client";

import { motion } from "framer-motion";
import { Activity, Heart, Thermometer, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HealthMetricSummary } from "@/types/new-layout";

const metrics: HealthMetricSummary[] = [
  {
    label: "ضربان قلب",
    value: 78,
    unit: "bpm",
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
  },
  {
    label: "فشار خون",
    value: "125/82",
    unit: "mmHg",
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
  },
  {
    label: "دما",
    value: 36.8,
    unit: "°C",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
];

export default function HealthSummary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="overflow-hidden border-healing-200 dark:border-healing-800/30">
        <CardContent className="p-5 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-healing-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-healing-100 dark:bg-healing-900/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-healing-500" />
              </div>
              <span className="font-bold text-sm text-foreground">خلاصه وضعیت سلامتی</span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={cn("flex flex-col items-center p-3 rounded-xl", metric.bgColor)}
                >
                  <span className={cn("text-lg font-bold", metric.color)}>
                    {metric.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{metric.label}</span>
                  <span className="text-[9px] text-muted-foreground/70">{metric.unit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}