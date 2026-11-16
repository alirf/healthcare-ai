"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, CalendarDays, FileText, Upload, Trash2, Download,
  HeartPulse, Droplets, Activity, Wind, Stethoscope, Archive, Lock,
  Pencil, Check, ChevronLeft, Stethoscope as VisitIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  fetchRecordDetail, updateRecord, closeRecord, archiveRecord,
  uploadRecordFile, deleteRecordFile, fetchVisitInfo,
  RECORD_TYPE_META, RECORD_STATUS_META, visitStatusLabel,
  formatFileSize,
  type ApiRecordDetail, type ApiRecordFile, type ApiVisitInfo,
} from "@/lib/record-service";

const typeIcons: Record<string, typeof HeartPulse> = {
  HeartPulse, Droplets, Activity, Wind, Stethoscope,
};

interface RecordDetailModalProps {
  recordId: string | null;
  onClose: () => void;
  onChanged: () => void; // بستن/بایگانی/ویرایش → رفرش لیست
}

export default function RecordDetailModal({ recordId, onClose, onChanged }: RecordDetailModalProps) {
  const [record, setRecord] = useState<ApiRecordDetail | null>(null);
  const [visitInfos, setVisitInfos] = useState<Record<string, ApiVisitInfo | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ویرایش
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // فایل‌ها
  const [uploading, setUploading] = useState(false);
  const [uploadDesc, setUploadDesc] = useState("");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"close" | "archive" | null>(null);

  const load = async () => {
    if (!recordId) return;
    setLoading(true);
    setError("");
    try {
      const detail = await fetchRecordDetail(recordId);
      setRecord(detail);
      setEditTitle(detail.title);
      setEditDesc(detail.description ?? "");
      // جزئیات هر ویزیت را از visit-intake می‌گیریم (نامتقارن، خطاها نادیده)
      const infos: Record<string, ApiVisitInfo | null> = {};
      await Promise.all(
        detail.visits.map(async (v) => {
          infos[v.visit_id] = await fetchVisitInfo(v.visit_id);
        })
      );
      setVisitInfos(infos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری پرونده");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRecord(null);
    setVisitInfos({});
    setEditing(false);
    if (recordId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const typeMeta = record ? RECORD_TYPE_META[record.record_type] ?? { label: record.record_type, icon: "Stethoscope" } : null;
  const TypeIcon = typeMeta ? (typeIcons[typeMeta.icon] ?? Stethoscope) : Stethoscope;
  const statusMeta = record ? RECORD_STATUS_META[record.status] : null;

  // ---------- actions ----------
  const handleSaveEdit = async () => {
    if (!record) return;
    if (editTitle.trim().length < 2) { setError("عنوان نمی‌تواند خالی باشد"); return; }
    setSavingEdit(true);
    setError("");
    try {
      const updated = await updateRecord(record.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
      });
      setRecord((prev) => prev ? { ...prev, ...updated } : prev);
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ویرایش");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStatusAction = async (action: "close" | "archive") => {
    if (!record) return;
    setActionLoading(action);
    setError("");
    try {
      const updated = action === "close" ? await closeRecord(record.id) : await archiveRecord(record.id);
      setRecord((prev) => prev ? { ...prev, ...updated } : prev);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !record) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadRecordFile(record.id, file, uploadDesc.trim() || undefined);
      setRecord((prev) => prev ? { ...prev, files: [...prev.files, uploaded] } : prev);
      setUploadDesc("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در آپلود فایل");
    } finally {
      setUploading(false);
      e.target.value = ""; // امکان انتخاب مجدد همان فایل
    }
  };

  const handleDeleteFile = async (file: ApiRecordFile) => {
    if (!record) return;
    setDeletingFileId(file.id);
    setError("");
    try {
      await deleteRecordFile(record.id, file.id);
      setRecord((prev) => prev ? { ...prev, files: prev.files.filter((f) => f.id !== file.id) } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف فایل");
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <AnimatePresence>
      {recordId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="w-full max-w-2xl h-[85vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== Header ===== */}
            <div className="p-5 border-b border-border space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-md shrink-0">
                    <TypeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    {editing ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-trust-500/30"
                      />
                    ) : (
                      <h3 className="text-base font-bold text-foreground leading-tight truncate">
                        {record?.title ?? "..."}
                      </h3>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {record ? formatRelativeTime(record.opened_at) : ""}
                      </span>
                      {record?.icd10_code && (
                        <span className="text-[11px] text-muted-foreground" dir="ltr">ICD-10: {record.icd10_code}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Badges + Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {statusMeta && record && (
                  <Badge variant="outline" className={cn("text-[10px]", statusMeta.badge)}>
                    {statusMeta.label}
                  </Badge>
                )}
                {typeMeta && <Badge variant="outline" className="text-[10px] text-muted-foreground">{typeMeta.label}</Badge>}
                <span className="text-[11px] text-muted-foreground">
                  {record?.visits.length ?? 0} ویزیت • {record?.files.length ?? 0} فایل
                </span>

                <div className="mr-auto flex items-center gap-1.5">
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-8 text-xs">
                      <Pencil className="w-3.5 h-3.5 ml-1" />
                      ویرایش
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="h-8 text-xs">انصراف</Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit} className="h-8 text-xs bg-trust-500 hover:bg-trust-600 text-white">
                        {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 ml-1" /> ذخیره</>}
                      </Button>
                    </>
                  )}

                  {record?.status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => handleStatusAction("archive")}
                      disabled={actionLoading !== null} className="h-8 text-xs border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20">
                      {actionLoading === "archive" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Archive className="w-3.5 h-3.5 ml-1" /> بایگانی</>}
                    </Button>
                  )}
                  {(record?.status === "active" || record?.status === "archived") && (
                    <Button size="sm" onClick={() => handleStatusAction("close")}
                      disabled={actionLoading !== null}
                      className="h-8 text-xs bg-slate-600 hover:bg-slate-700 text-white">
                      {actionLoading === "close" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Lock className="w-3.5 h-3.5 ml-1" /> بستن پرونده</>}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ===== Body ===== */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-trust-500" />
              </div>
            ) : error && !record ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
                <p className="text-sm text-red-500">{error}</p>
                <Button variant="outline" size="sm" onClick={load}>تلاش مجدد</Button>
              </div>
            ) : record ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2.5">{error}</p>
                )}

                {/* توضیحات */}
                {editing ? (
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    placeholder="توضیحات پرونده..."
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-trust-500/30"
                  />
                ) : record.description ? (
                  <p className="text-sm text-muted-foreground leading-7 bg-muted/40 rounded-xl p-4">{record.description}</p>
                ) : null}

                {/* ---------- ویزیت‌های لینک‌شده ---------- */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <VisitIcon className="w-4 h-4 text-trust-500" />
                    ویزیت‌های این پرونده
                    <span className="text-[11px] text-muted-foreground font-normal">({record.visits.length})</span>
                  </h4>

                  {record.visits.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-5 text-center">
                      <p className="text-xs text-muted-foreground">
                        هنوز ویزیتی به این پرونده لینک نشده. از صفحه «ویزیت هوشمند» یک ویزیت جدید روی این پرونده شروع کنید.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...record.visits]
                        .sort((a, b) => b.added_at.localeCompare(a.added_at))
                        .map((v) => {
                          const info = visitInfos[v.visit_id];
                          return (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                              <div className="w-9 h-9 rounded-lg bg-trust-50 dark:bg-trust-900/20 flex items-center justify-center shrink-0">
                                <VisitIcon className="w-4 h-4 text-trust-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {info?.chief_complaint ?? `ویزیت ${v.visit_id.slice(0, 8)}...`}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {info ? visitStatusLabel(info.status) : "جزئیات در دسترس نیست"}
                                  {" • "}
                                  {formatRelativeTime(info?.started_at ?? v.added_at)}
                                </p>
                              </div>
                              {info && (
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {visitStatusLabel(info.status)}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* ---------- فایل‌ها ---------- */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    فایل‌های پیوست
                    <span className="text-[11px] text-muted-foreground font-normal">({record.files.length})</span>
                  </h4>

                  {/* آپلود */}
                  {record.status !== "closed" && (
                    <div className="rounded-xl border border-dashed border-trust-300 dark:border-trust-700 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={uploadDesc}
                          onChange={(e) => setUploadDesc(e.target.value)}
                          placeholder="توضیح فایل (مثلاً: نتیجه آزمایش خون)"
                          className="flex-1 px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-trust-500/30"
                        />
                        <label className={cn(
                          "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-white cursor-pointer transition-all",
                          uploading
                            ? "bg-trust-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600"
                        )}>
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {uploading ? "در حال آپلود..." : "انتخاب فایل"}
                          <input type="file" className="hidden" disabled={uploading} onChange={handleUpload} />
                        </label>
                      </div>
                      <p className="text-[10px] text-muted-foreground">حداکثر ۲۵ مگابایت — تصویر، PDF، صدا یا ویدیو</p>
                    </div>
                  )}

                  {/* لیست فایل‌ها */}
                  {record.files.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">فایلی پیوست نشده است</p>
                  ) : (
                    <div className="space-y-2">
                      {record.files.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{f.file_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatFileSize(f.size)}
                              {f.description && ` • ${f.description}`}
                            </p>
                          </div>
                          {f.file_url && (
                            <a href={f.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-trust-500 hover:text-trust-600 hover:bg-trust-50 dark:hover:bg-trust-900/20">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          {record.status !== "closed" && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(f)}
                              disabled={deletingFileId === f.id}
                              className="w-8 h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                              {deletingFileId === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
