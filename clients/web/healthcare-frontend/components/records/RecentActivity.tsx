"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Stethoscope,
  FlaskConical,
  FileText,
  Image,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { RecordActivity } from "@/types/records";

interface RecentActivityProps {
  activities: RecordActivity[];
}

const iconMap = {
  Stethoscope,
  FlaskConical,
  FileText,
  Image,
};

export default function RecentActivity({ activities }: RecentActivityProps) {
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
              <span className="font-bold text-sm text-foreground">آخرین فعالیت‌ها</span>
            </div>

            {/* Activity Items */}
            <div className="space-y-2">
              {activities.map((activity, index) => {
                const Icon = iconMap[activity.icon as keyof typeof iconMap] || FileText;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50 cursor-pointer group",
                      activity.bgColor
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className={cn("w-4 h-4", activity.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {formatRelativeTime(activity.date)}
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground/50 group-hover:text-trust-500 transition-colors shrink-0" />
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