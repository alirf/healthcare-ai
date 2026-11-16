"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FilePlus2, HeartPulse, Droplets, Activity, Wind, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createRecord, RECORD_TYPE_META } from "@/lib/record-service";

const typeIcons: Record<string, typeof HeartPulse> = {
  HeartPulse, Droplets, Activity, Wind, Stethoscope,
};

interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void; // بعد از ساخت، لیست رفرش می‌شود
}

export default function NewRecordModal({ isOpen, onClose, onCreated }: NewRecordModalProps) {
  const [recordType, setRecordType] = useState("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icd10, setIcd10] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("عنوان پرونده را وارد کنید");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createRecord({
        record_type: recordType,
        title: title.trim(),
        description: description.trim() || undefined,
        icd10_code: icd10.trim() || undefined,
      });
      // ریست فرم
      setTitle(""); setDescription(""); setIcd10(""); setRecordType("general");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ساخت پرونده");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card rounded-2xl shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-md shadow-trust-500/20">
                  <FilePlus2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">پرونده پزشکی جدید</h3>
                  <p className="text-xs text-muted-foreground">مثلاً بعد از یک اتفاق مهم سلامتی</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* نوع پرونده */}
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع پرونده</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {Object.entries(RECORD_TYPE_META).map(([key, meta]) => {
                    const Icon = typeIcons[meta.icon] ?? Stethoscope;
                    const isActive = recordType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRecordType(key)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all",
                          isActive
                            ? "border-trust-400 bg-trust-50 dark:bg-trust-900/20 shadow-sm"
                            : "border-border hover:border-trust-200"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", isActive ? "text-trust-500" : "text-muted-foreground")} />
                        <span className={cn("text-[11px] font-medium", isActive ? "text-trust-600" : "text-foreground")}>
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* عنوان */}
              <div className="space-y-2">
                <label className="text-sm font-medium">عنوان پرونده</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: سکته قلبی - شهریور ۱۴۰۵"
                  className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm transition-all"
                />
              </div>

              {/* کد ICD10 (اختیاری) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">کد تشخیص ICD-10 <span className="text-muted-foreground font-normal">(اختیاری)</span></label>
                <input
                  type="text"
                  value={icd10}
                  onChange={(e) => setIcd10(e.target.value)}
                  placeholder="مثلاً I21"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm transition-all"
                />
              </div>

              {/* توضیحات */}
              <div className="space-y-2">
                <label className="text-sm font-medium">توضیحات <span className="text-muted-foreground font-normal">(اختیاری)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="شرح مختصری از وضعیت بنویسید..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm resize-none transition-all"
                />
              </div>

              {/* خطا */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-red-500 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* دکمه‌ها */}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ساخت پرونده"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
