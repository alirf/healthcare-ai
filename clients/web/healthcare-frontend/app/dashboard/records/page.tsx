"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Stethoscope,
  FlaskConical,
  Image,
  ClipboardList,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import RecordCard from "@/components/records/RecordCard";
import RecordSummary from "@/components/records/RecordSummary";
import RecentActivity from "@/components/records/RecentActivity";
import HealthTips from "@/components/records/HealthTips";
import type { MedicalRecord, RecordSummary as RecordSummaryType, RecordActivity } from "@/types/records";

// ==================== FILTER TABS ====================
type FilterTab = "all" | "visit" | "test" | "image" | "note";

const filterTabs: { key: FilterTab; label: string; icon: string }[] = [
  { key: "all", label: "همه", icon: "LayoutGrid" },
  { key: "visit", label: "ویزیت‌ها", icon: "Stethoscope" },
  { key: "test", label: "آزمایش‌ها", icon: "FlaskConical" },
  { key: "image", label: "تصاویر", icon: "Image" },
  { key: "note", label: "یادداشت‌ها", icon: "ClipboardList" },
];

// ==================== MOCK DATA ====================

const mockRecords: MedicalRecord[] = [
  {
    id: "r1",
    type: "visit",
    title: "ویزیت آنلاین",
    subtitle: "دکتر سارا یوسفی",
    description: "متخصص داخلی\nعلائم: تب، گلودرد، سرفه\nتشخیص: احتمال عفونت ویروسی",
    doctorName: "سارا یوسفی",
    date: "2026-09-05T14:30:00Z",
    status: "completed",
    statusLabel: "تکمیل شده",
    icon: "Stethoscope",
    iconColor: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    borderColor: "border-trust-200 dark:border-trust-800",
    tags: ["تب", "گلودرد"],
  },
  {
    id: "r2",
    type: "test",
    title: "آزمایش خون",
    subtitle: "آزمایشگاه امید",
    description: "شامل: CBC، قند خون، چربی خون\nنتیجه: قند خون مرزی - نیاز به پیگیری",
    clinicName: "آزمایشگاه امید",
    date: "2026-09-01T09:00:00Z",
    status: "reviewed",
    statusLabel: "بررسی شده",
    icon: "FlaskConical",
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    tags: ["CBC", "قند خون"],
  },
  {
    id: "r3",
    type: "visit",
    title: "ویزیت قلب و عروق",
    subtitle: "دکتر علی محمدی",
    description: "فوق تخصص قلب\nعلائم: درد سینه، تنگی نفس\nتشخیص: آنژین صدری - نیاز به آنژیوگرافی",
    doctorName: "علی محمدی",
    date: "2026-08-28T11:00:00Z",
    status: "completed",
    statusLabel: "تکمیل شده",
    icon: "Stethoscope",
    iconColor: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    borderColor: "border-trust-200 dark:border-trust-800",
    tags: ["قلب", "آنژین"],
  },
  {
    id: "r4",
    type: "image",
    title: "رادیوگرافی قفسه سینه",
    subtitle: "مرکز تصویربرداری نور",
    description: "PA view\nنتیجه: ریه‌ها طبیعی - قلب اندکی بزرگ",
    clinicName: "مرکز تصویربرداری نور",
    date: "2026-08-25T16:00:00Z",
    status: "reviewed",
    statusLabel: "بررسی شده",
    icon: "Image",
    iconColor: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800",
    tags: ["رادیوگرافی", "قفسه سینه"],
  },
  {
    id: "r5",
    type: "note",
    title: "یادداشت شخصی",
    subtitle: "ثبت شده توسط بیمار",
    description: "از دیروز سردرد دارم و داروی استامینوفن مصرف کردم.\nتب ندارم ولی احساس خستگی شدید دارم.",
    date: "2026-08-20T20:00:00Z",
    status: "pending",
    statusLabel: "در انتظار",
    icon: "FileText",
    iconColor: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
    borderColor: "border-healing-200 dark:border-healing-800",
    tags: ["سردرد", "خستگی"],
  },
  {
    id: "r6",
    type: "test",
    title: "آزمایش ادرار",
    subtitle: "آزمایشگاه پارس",
    description: "UA & Culture\nنتیجه: عفونت ادراری - آنتی‌بیوتیک تجویز شد",
    clinicName: "آزمایشگاه پارس",
    date: "2026-08-15T10:30:00Z",
    status: "completed",
    statusLabel: "تکمیل شده",
    icon: "FlaskConical",
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    tags: ["ادرار", "عفونت"],
  },
];

const mockSummary: RecordSummaryType = {
  totalRecords: 25,
  totalVisits: 12,
  totalTests: 8,
  totalImages: 3,
  totalNotes: 2,
  lastUpdated: "2026-09-07T10:00:00Z",
};

const mockActivities: RecordActivity[] = [
  {
    id: "a1",
    title: "ویزیت آنلاین جدید",
    description: "دکتر سارا یوسفی - ویزیت تکمیل شد",
    date: "2026-09-05T14:30:00Z",
    icon: "Stethoscope",
    iconColor: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
  },
  {
    id: "a2",
    title: "آزمایش خون",
    description: "نتایج آزمایشگاه امید آماده شد",
    date: "2026-09-01T09:00:00Z",
    icon: "FlaskConical",
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    id: "a3",
    title: "رادیوگرافی قفسه سینه",
    description: "تصاویر از مرکز نور دریافت شد",
    date: "2026-08-25T16:00:00Z",
    icon: "Image",
    iconColor: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    id: "a4",
    title: "یادداشت جدید",
    description: "ثبت علائم روزانه - سردرد و خستگی",
    date: "2026-08-20T20:00:00Z",
    icon: "FileText",
    iconColor: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
  },
];

// ==================== PAGINATION ====================
const ITEMS_PER_PAGE = 6;

export default function RecordsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRecords =
    activeFilter === "all"
      ? mockRecords
      : mockRecords.filter((r) => r.type === activeFilter);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ===== MAIN COLUMN (Larger - Right side in RTL) ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT COLUMN (Main Content) - takes 2/3 on xl */}
        <div className="xl:col-span-2 space-y-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden border-trust-200 dark:border-trust-800/30">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Title */}
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-md shadow-trust-500/20">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-foreground">پرونده‌های پزشکی</h1>
                      <p className="text-xs text-muted-foreground">
                        مدیریت و مشاهده تمام سوابق پزشکی شما
                      </p>
                    </div>
                  </div>

                  {/* New Record Button */}
                  <Button
                    className="bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25 h-10 gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    پرونده جدید
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-trust-500 text-white shadow-md shadow-trust-500/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="filterIndicator"
                      className="w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* Records List */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {paginatedRecords.map((record, index) => (
                <RecordCard key={record.id} record={record} index={index} />
              ))}
            </AnimatePresence>

            {paginatedRecords.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">پرونده‌ای یافت نشد</p>
              </motion.div>
            )}
          </div>

          {/* Pagination */}
          {filteredRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between pt-2"
            >
              <p className="text-sm text-muted-foreground">
                نمایش{" "}
                <span className="font-medium text-foreground">
                  {Math.min(paginatedRecords.length, ITEMS_PER_PAGE).toLocaleString("fa-IR")}
                </span>{" "}
                مورد از{" "}
                <span className="font-medium text-foreground">
                  {filteredRecords.length.toLocaleString("fa-IR")}
                </span>
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .reverse()
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                        currentPage === page
                          ? "bg-trust-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {page.toLocaleString("fa-IR")}
                    </button>
                  ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN (Widgets) - takes 1/3 on xl */}
        <div className="space-y-4">
          {/* Record Summary */}
          <RecordSummary summary={mockSummary} />

          {/* Recent Activity */}
          <RecentActivity activities={mockActivities} />

          {/* Health Tips */}
          <HealthTips />
        </div>
      </div>
    </div>
  );
}