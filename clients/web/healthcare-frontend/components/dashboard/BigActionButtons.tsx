"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Stethoscope,
  Pill,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BigActionButton } from "@/types/new-layout";

const actions: BigActionButton[] = [
  {
    id: "chat",
    title: "گفتگو با پزشک",
    subtitle: "پیام و مکالمه رایگان",
    icon: "MessageSquare",
    href: "/dashboard/chat-doctor",
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    hoverColor: "group-hover:bg-trust-500",
    borderColor: "border-trust-200 dark:border-trust-800",
  },
  {
    id: "visit",
    title: "ویزیت هوشمند",
    subtitle: "تحلیل AI شرح حال",
    icon: "Stethoscope",
    href: "/dashboard/visit",
    color: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
    hoverColor: "group-hover:bg-healing-500",
    borderColor: "border-healing-200 dark:border-healing-800",
  },
  {
    id: "pharmacy",
    title: "خرید دارو",
    subtitle: "داروخانه آنلاین",
    icon: "Pill",
    href: "/dashboard/pharmacy",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    hoverColor: "group-hover:bg-amber-500",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    id: "records",
    title: "پرونده پزشکی",
    subtitle: "مشاهده سوابق",
    icon: "FileText",
    href: "/dashboard/records",
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    hoverColor: "group-hover:bg-violet-500",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
];

const iconMap = {
  MessageSquare,
  Stethoscope,
  Pill,
  FileText,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function BigActionButtons() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {actions.map((action) => {
        const Icon = iconMap[action.icon as keyof typeof iconMap];
        return (
          <motion.div key={action.id} variants={itemVariants}>
            <Link href={action.href}>
              <Card
                className={cn(
                  "group relative overflow-hidden p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border",
                  action.borderColor
                )}
              >
                {/* Hover overlay */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-300",
                    action.hoverColor
                  )}
                />

                <div className="relative z-10 flex flex-col items-center text-center gap-3">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 group-hover:bg-white/20",
                      action.bgColor
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-7 h-7 transition-colors duration-300 group-hover:text-white",
                        action.color
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-white transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
                      {action.subtitle}
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-white/70 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}