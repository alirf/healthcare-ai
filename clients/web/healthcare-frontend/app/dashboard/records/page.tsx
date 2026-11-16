"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, LayoutGrid, Activity, Archive, Lock,
  HeartPulse, Droplets, Wind, Stethoscope, ChevronRight, ChevronLeft,
  RefreshCw, Inbox, CalendarDays, ServerCrash, FileStack,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  fetchRecords, RECORD_TYPE_META, RECORD_STATUS_META,
  type ApiRecord,
} from "@/lib/record-service";
import NewRecordModal from "@/components/records/NewRecordModal";
import RecordDetailModal from "@/components/records/RecordDetailModal";
import HealthTips from "@/components/records/HealthTips";

// ==================== فیلتر وضعیت ====================
type StatusFilter = "all" | "active" | "archived" | "closed";

const filterTabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "archived", label: "بایگانی" },
  { key: "closed", label: "بسته‌شده" },
];

const typeIcons: Record<string, typeof HeartPulse> = {
  HeartPulse, Droplets, Activity, Wind, Stethoscope,
};

const ITEMS_PER_PAGE = 6;

// آیکن پیش‌فرض برای هر نوع پرونده در خلاصه
function TypeIcon({ t, className }: { t: string; className?: string }) {
  const meta = RECORD_TYPE_META[t] ?? { icon: "Stethoscope" };
  const Icon = typeIcons[meta.icon] ?? Stethoscope;
  return <Icon className={className} />;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // ---------- داده ----------
  const load = async (status?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRecords(status && status !== "all" ? status : undefined);
      setRecords(data);
    } catch (err) {
      // تشخیص خطای شبکه از خطای سرور
      const isNetwork =
        err instanceof TypeError ||
        (err instanceof Error && /fetch|network|Failed to fetch/i.test(err.message));
      setError(
        isNetwork
          ? "اتصال به سرور برقرار نشد. مطمئن شو API Gateway و medical-record-service روشن‌اند (و NEXT_PUBLIC_API_URL خالی یا /api/gateway باشد)."
          : err instanceof Error
          ? err.message
          : "خطا در دریافت پرونده‌ها"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  setLoading(true);
  load(activeFilter);
  setCurrentPage(1);
}, [activeFilter]);

  // ---------- خلاصه غنی (از روی همه پرونده‌های فیلترشده) ----------
  const summary = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const r of records) byType[r.record_type] = (byType[r.record_type] ?? 0) + 1;
    const typeList = Object.entries(byType)
      .map(([type, count]) => ({
        type,
        count,
        label: RECORD_TYPE_META[type]?.label ?? type,
        icon: RECORD_TYPE_META[type]?.icon ?? "Stethoscope",
      }))
      .sort((a, b) => b.count - a.count);

    const lastRecord = records.length
      ? [...records].sort((a, b) => b.opened_at.localeCompare(a.opened_at))[0]
      : null;

    return {
      total: records.length,
      active: records.filter((r) => r.status === "active").length,
      archived: records.filter((r) => r.status === "archived").length,
      closed: records.filter((r) => r.status === "closed").length,
      typeList,
      lastRecord,
    };
  }, [records]);

  // ---------- صفحه‌بندی ----------
  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE));
  const paginated = records.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilterChange = (f: StatusFilter) => {
    setActiveFilter(f);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ============ ستون اصلی (۲/۳) ============ */}
        <div className="xl:col-span-2 space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="overflow-hidden border-trust-200 dark:border-trust-800/30">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-md shadow-trust-500/20">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-foreground">پرونده‌های پزشکی</h1>
                      <p className="text-xs text-muted-foreground">
                        مثلاً یک پرونده برای سکته قلبی که همه ویزیت‌هایش را جمع می‌کند
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => load(activeFilter)} disabled={loading}
                      className="h-10 px-3 border-trust-200 hover:bg-trust-50 dark:border-trust-800 dark:hover:bg-trust-900/20">
                      <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                    <Button onClick={() => setNewModalOpen(true)}
                      className="bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25 h-10 gap-1.5">
                      <Plus className="w-4 h-4" />
                      پرونده جدید
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* خطا (با آیکن واضح برای خطای شبکه) */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                <ServerCrash className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <Button variant="outline" size="sm" onClick={() => load(activeFilter)} className="h-7 text-xs shrink-0">
                  تلاش مجدد
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* تب‌های فیلتر */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              const count = tab.key === "all" ? records.length : summary[tab.key];
              return (
                <button key={tab.key} onClick={() => handleFilterChange(tab.key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                    isActive
                      ? "bg-trust-500 text-white shadow-md shadow-trust-500/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}>
                  {tab.label}
                  {!loading && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground"
                    )}>
                      {count.toLocaleString("fa-IR")}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* لیست پرونده‌ها */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[110px] rounded-xl" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {activeFilter === "all" ? "هنوز پرونده‌ای نساخته‌اید" : "پرونده‌ای با این وضعیت یافت نشد"}
              </p>
              <Button onClick={() => setNewModalOpen(true)} variant="outline" size="sm" className="h-9">
                <Plus className="w-4 h-4 ml-1" />
                ساخت اولین پرونده
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {paginated.map((record, index) => {
                  const typeMeta = RECORD_TYPE_META[record.record_type] ?? { label: record.record_type, icon: "Stethoscope" };
                  const status = RECORD_STATUS_META[record.status];
                  return (
                    <motion.div key={record.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}>
                      <Card
                        onClick={() => setSelectedRecordId(record.id)}
                        className="group relative overflow-hidden p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border hover:border-trust-200 dark:hover:border-trust-800"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-trust-50 dark:bg-trust-900/20 flex items-center justify-center shrink-0">
                            <TypeIcon t={record.record_type} className="w-5 h-5 text-trust-500" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-foreground">{record.title}</h3>
                              <Badge variant="outline" className={cn("text-[10px]", status?.badge)}>{status?.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {typeMeta.label}
                              {record.icd10_code && <span dir="ltr"> • ICD-10: {record.icd10_code}</span>}
                            </p>
                            {record.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{record.description}</p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {formatRelativeTime(record.opened_at)}
                            </div>
                            <span className="text-[11px] text-trust-500 font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              مشاهده جزئیات
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* صفحه‌بندی */}
          {!loading && records.length > ITEMS_PER_PAGE && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                نمایش <span className="font-medium text-foreground">{paginated.length.toLocaleString("fa-IR")}</span> مورد از{" "}
                <span className="font-medium text-foreground">{records.length.toLocaleString("fa-IR")}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="w-8 h-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                      currentPage === page ? "bg-trust-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
                    )}>
                    {page.toLocaleString("fa-IR")}
                  </button>
                ))}
                <Button variant="outline" size="icon" className="w-8 h-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* ============ ستون کناری (۱/۳) ============ */}
        <div className="space-y-4">
          {/* خلاصه غنی */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="overflow-hidden border-trust-200 dark:border-trust-800/30">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-trust-500" />
                  </div>
                  <span className="font-bold text-sm text-foreground">خلاصه پرونده‌ها</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground tracking-tight">
                    {loading ? "—" : summary.total.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-sm text-muted-foreground">پرونده</span>
                </div>

                {/* آمار وضعیت‌ها */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "فعال", value: summary.active, icon: Activity, cls: "text-healing-500 bg-healing-50 dark:bg-healing-900/20" },
                    { label: "بایگانی", value: summary.archived, icon: Archive, cls: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
                    { label: "بسته", value: summary.closed, icon: Lock, cls: "text-slate-500 bg-slate-50 dark:bg-slate-900/20" },
                  ].map((s, i) => (
                    <motion.div key={s.label}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.1 * i }}
                      className={cn("flex flex-col items-center p-3 rounded-xl", s.cls)}>
                      <s.icon className="w-4 h-4 mb-1" />
                      <span className="text-lg font-bold">{loading ? "—" : s.value.toLocaleString("fa-IR")}</span>
                      <span className="text-[10px] text-muted-foreground">{s.label}</span>
                    </motion.div>
                  ))}
                </div>

                {/* تفکیک بر اساس نوع پرونده */}
                {!loading && summary.typeList.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 pt-2">
                      <FileStack className="w-3.5 h-3.5" />
                      تفکیک بر اساس نوع
                    </p>
                    <div className="space-y-1.5">
                      {summary.typeList.map((t) => (
                        <div key={t.type} className="flex items-center gap-2">
                          <TypeIcon t={t.type} className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-foreground flex-1">{t.label}</span>
                          <span className="text-xs font-bold text-trust-500">{t.count.toLocaleString("fa-IR")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* آخرین پرونده */}
                {!loading && summary.lastRecord && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5 text-healing-500 shrink-0" />
                    <span>آخرین پرونده:</span>
                    <span className="font-medium text-foreground truncate">{summary.lastRecord.title}</span>
                    <span className="shrink-0">({formatRelativeTime(summary.lastRecord.opened_at)})</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* راهنما */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <Card className="overflow-hidden border-healing-200 dark:border-healing-800/30">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-healing-100 dark:bg-healing-900/30 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4 text-healing-500" />
                  </div>
                  <span className="font-bold text-sm text-foreground">چطور کار می‌کند؟</span>
                </div>
                <ol className="space-y-2.5 text-xs text-muted-foreground leading-6">
                  <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-trust-100 dark:bg-trust-900/30 text-trust-600 text-[10px] font-bold flex items-center justify-center shrink-0">۱</span>یک پرونده برای هر موضوع سلامتی بساز (مثلاً سکته قلبی)</li>
                  <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-trust-100 dark:bg-trust-900/30 text-trust-600 text-[10px] font-bold flex items-center justify-center shrink-0">۲</span>روی همان پرونده با چند پزشک مختلف ویزیت شو</li>
                  <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-trust-100 dark:bg-trust-900/30 text-trust-600 text-[10px] font-bold flex items-center justify-center shrink-0">۳</span>نتیجه آزمایش و تصاویر را به پرونده اضافه کن</li>
                  <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-trust-100 dark:bg-trust-900/30 text-trust-600 text-[10px] font-bold flex items-center justify-center shrink-0">۴</span>وقتی موضوع تمام شد، پرونده را ببند</li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>

          {/* کارت نکته سلامتی (همان قبلی) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <HealthTips />
          </motion.div>
        </div>
      </div>

      {/* ============ مودال‌ها ============ */}
      <NewRecordModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={() => load(activeFilter)}
      />
      <RecordDetailModal
        recordId={selectedRecordId}
        onClose={() => setSelectedRecordId(null)}
        onChanged={() => load(activeFilter)}
      />
    </div>
  );
}