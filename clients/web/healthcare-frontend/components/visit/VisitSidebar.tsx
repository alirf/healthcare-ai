"use client";

import { motion } from "framer-motion";
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Plus,
  Search,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { VisitHistory } from "@/types/visit";
import { Button } from "@/components/ui/button";

interface VisitSidebarProps {
  visits: VisitHistory[];
  selectedVisitId?: string;
  onSelectVisit: (visit: VisitHistory) => void;
  onNewVisit: () => void;
}

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-healing-500", bg: "bg-healing-50 dark:bg-healing-900/20", label: "تکمیل شده" },
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", label: "در انتظار" },
  in_progress: { icon: Stethoscope, color: "text-trust-500", bg: "bg-trust-50 dark:bg-trust-900/20", label: "در حال ویزیت" },
};

export default function VisitSidebar({ visits, selectedVisitId, onSelectVisit, onNewVisit }: VisitSidebarProps) {
  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">ویزیت‌های قبلی</h3>
          <span className="text-xs text-muted-foreground">{visits.length} ویزیت</span>
        </div>
        
        {/* New Visit Button */}
        <Button
          onClick={onNewVisit}
          className="w-full h-10 text-sm bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25"
        >
          <Plus className="w-4 h-4 ml-1.5" />
          ویزیت جدید
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجو..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500"
          />
        </div>
      </div>

      {/* Visit List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {visits.map((visit, index) => {
          const status = statusConfig[visit.status];
          const StatusIcon = status.icon;
          const isSelected = selectedVisitId === visit.id;

          return (
            <motion.button
              key={visit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectVisit(visit)}
              className={cn(
                "w-full text-right p-3 rounded-xl transition-all duration-200 group",
                isSelected
                  ? "bg-trust-50 dark:bg-trust-900/20 border border-trust-200 dark:border-trust-800 shadow-sm"
                  : "hover:bg-muted border border-transparent"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  visit.bgColor
                )}>
                  <Stethoscope className={cn("w-5 h-5", visit.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-sm font-semibold truncate",
                    isSelected ? "text-trust-600" : "text-foreground"
                  )}>
                    {visit.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">{visit.doctorName}</p>
                  
                  {/* Symptoms Tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {visit.symptoms.slice(0, 2).map((symptom, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {symptom}
                      </span>
                    ))}
                    {visit.symptoms.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{visit.symptoms.length - 2}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(visit.date)}
                    </span>
                    <div className={cn("flex items-center gap-1 text-[10px]", status.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronLeft className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isSelected ? "text-trust-500" : "text-muted-foreground/30 group-hover:text-muted-foreground"
                )} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}