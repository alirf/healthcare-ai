"use client";

/**
 * components/doctor/FinalDiagnosisForm.tsx
 *
 * Form for the doctor to submit the final diagnosis of a visit.
 *
 * The doctor can either:
 *   - pick one of the AI suggestions (passed via `selectedSuggestion`),
 *   - OR enter a manual diagnosis with manual ICD-10 code.
 *
 * On submit, calls POST /api/intake/visits/{visitId}/final-diagnosis.
 * On success, the visit is automatically marked "completed" server-side,
 * and we call `onSubmitted(response)` so the parent can route to a
 * success screen or refresh the visit list.
 */
import { useState } from "react";

import {
  AIDiagnosisSuggestion,
  FinalDiagnosisResponse,
  submitFinalDiagnosis,
} from "@/lib/doctor-diagnosis";

interface FinalDiagnosisFormProps {
  visitId: string;
  selectedSuggestion: AIDiagnosisSuggestion | null;
  onClearSelection: () => void;
  onSubmitted: (response: FinalDiagnosisResponse) => void;
  onCancel: () => void;
}

export function FinalDiagnosisForm({
  visitId,
  selectedSuggestion,
  onClearSelection,
  onSubmitted,
  onCancel,
}: FinalDiagnosisFormProps) {
  // Manual override fields (only used if the doctor types something here)
  const [manualDiseaseName, setManualDiseaseName] = useState("");
  const [manualIcd10, setManualIcd10] = useState("");
  const [notes, setNotes] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState<number | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useManual = manualDiseaseName.trim().length > 0;

  const canSubmit = (() => {
    if (submitting) return false;
    if (useManual) {
      return manualDiseaseName.trim().length > 0;
    }
    return selectedSuggestion !== null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    try {
      const response = await submitFinalDiagnosis(visitId, {
        selected_suggestion_id:
          useManual || !selectedSuggestion ? null : selectedSuggestion.id,
        manual_disease_name: useManual ? manualDiseaseName.trim() : null,
        manual_icd10: useManual ? manualIcd10.trim() || null : null,
        notes: notes.trim(),
        requires_follow_up: requiresFollowUp,
        follow_up_days:
          requiresFollowUp && followUpDays !== ""
            ? Number(followUpDays)
            : null,
      });
      onSubmitted(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5"
    >
      <header className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          ثبت تشخیص نهایی
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          پس از ثبت، وضعیت ویزیت به «تکمیل‌شده» تغییر می‌یابد و بیمار می‌تواند
          نتیجه را مشاهده کند.
        </p>
      </header>

      {/* Selected AI suggestion (read-only chip) */}
      {selectedSuggestion && !useManual && (
        <div className="rounded-lg border border-trust-200 dark:border-trust-800 bg-trust-50 dark:bg-trust-950/30 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-trust-700 dark:text-trust-400">
                تشخیص انتخاب‌شده از پیشنهادهای هوش مصنوعی
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedSuggestion.disease_name_fa}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {selectedSuggestion.disease_name_en}
                {selectedSuggestion.icd10
                  ? ` · ICD-10: ${selectedSuggestion.icd10}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="shrink-0 rounded-md border border-trust-300 dark:border-trust-700 px-2 py-1 text-xs font-medium text-trust-700 dark:text-trust-400 hover:bg-trust-100 dark:hover:bg-trust-900/40"
            >
              لغو انتخاب
            </button>
          </div>
        </div>
      )}

      {/* Manual override fields */}
      <div className="space-y-3">
        <div>
          <label
            htmlFor="manual-disease-name"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            تشخیص دستی (اختیاری — برای نادیده گرفتن پیشنهاد هوش مصنوعی)
          </label>
          <input
            id="manual-disease-name"
            type="text"
            value={manualDiseaseName}
            onChange={(e) => setManualDiseaseName(e.target.value)}
            placeholder="مثلاً: سینوزیت باکتریایی حاد"
            className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-trust-500 focus:outline-none focus:ring-1 focus:ring-trust-500"
          />
        </div>

        <div>
          <label
            htmlFor="manual-icd10"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            کد ICD-10 (اختیاری)
          </label>
          <input
            id="manual-icd10"
            type="text"
            value={manualIcd10}
            onChange={(e) => setManualIcd10(e.target.value)}
            placeholder="مثلاً: J01.0"
            className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-trust-500 focus:outline-none focus:ring-1 focus:ring-trust-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="diagnosis-notes"
          className="block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          یادداشت پزشک (توضیحات، نسخه، توصیه‌ها)
        </label>
        <textarea
          id="diagnosis-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="توضیحات کامل برای بیمار..."
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-trust-500 focus:outline-none focus:ring-1 focus:ring-trust-500"
        />
      </div>

      {/* Follow-up */}
      <div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={requiresFollowUp}
            onChange={(e) => setRequiresFollowUp(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-trust-600 focus:ring-trust-500"
          />
          نیاز به ویزیت پیگیری دارد
        </label>
        {requiresFollowUp && (
          <div>
            <label
              htmlFor="follow-up-days"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              فاصله تا ویزیت پیگیری (روز)
            </label>
            <input
              id="follow-up-days"
              type="number"
              min={1}
              max={365}
              value={followUpDays}
              onChange={(e) =>
                setFollowUpDays(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder="مثلاً: 7"
              className="mt-1 block w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-trust-500 focus:outline-none focus:ring-1 focus:ring-trust-500"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-trust-600 px-4 py-2 text-sm font-medium text-white hover:bg-trust-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting
            ? "در حال ثبت..."
            : useManual
            ? "ثبت تشخیص دستی"
            : selectedSuggestion
            ? "ثبت تشخیص انتخاب‌شده"
            : "ثبت تشخیص"}
        </button>
      </div>
    </form>
  );
}
