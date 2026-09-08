"use client";

import { motion } from "framer-motion";
import {
  Stethoscope,
  FlaskConical,
  Image,
  FileText,
  ChevronLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MedicalRecord } from "@/types/records";

const iconMap = {
  Stethoscope,
  FlaskConical,
  Image,
  FileText,
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-healing-500", bg: "bg-healing-50 dark:bg-healing-900/20", label: "تکمیل شده" },
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", label: "در انتظار" },
  in_progress: { icon: AlertCircle, color: "text-trust-500", bg: "bg-trust-50 dark:bg-trust-900/20", label: "در حال بررسی" },
  reviewed: { icon: CheckCircle2, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", label: "بررسی شده" },
};

interface RecordCardProps {
  record: MedicalRecord;
  index: number;
}

export default function RecordCard({ record, index }: RecordCardProps) {
  const Icon = iconMap[record.icon as keyof typeof iconMap] || FileText;
  const status = statusConfig[record.status];
  const StatusIcon = status.icon;

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border",
          record.borderColor
        )}
      >
        <div className="flex items-start gap-4">
          {/* Right side: Icon + Avatar */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {/* Record Type Icon */}
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center",
                record.bgColor
              )}
            >
              <Icon className={cn("w-5 h-5", record.iconColor)} />
            </div>

            {/* Doctor/Clinic Avatar */}
            <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-slate-800 shadow-sm">
              <AvatarImage src={record.doctorAvatar} />
              <AvatarFallback
                className={cn(
                  "text-xs font-bold text-white",
                  record.type === "visit" ? "bg-gradient-to-br from-trust-500 to-healing-500" :
                  record.type === "test" ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                  record.type === "image" ? "bg-gradient-to-br from-violet-500 to-purple-500" :
                  "bg-gradient-to-br from-slate-500 to-slate-600"
                )}
              >
                {getInitials(record.doctorName || record.clinicName || "?")}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Middle: Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title & Doctor */}
            <div>
              <h3 className="font-bold text-sm text-foreground leading-tight">
                {record.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {record.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {record.description}
            </p>

            {/* Tags */}
            {record.tags && record.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {record.tags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 border-trust-200 dark:border-trust-800 text-trust-600 dark:text-trust-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Left side: Date & Action */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{new Date(record.date).toLocaleDateString("fa-IR")}</span>
            </div>

            {/* Status Badge */}
            <div className={cn("flex items-center gap-1 text-[10px] px-2 py-1 rounded-full", status.bg, status.color)}>
              <StatusIcon className="w-3 h-3" />
              <span>{status.label}</span>
            </div>

            {/* View Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-trust-500 hover:text-trust-600 hover:bg-trust-50 dark:hover:bg-trust-900/20 gap-1 px-2"
            >
              مشاهده
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}