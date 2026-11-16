"use client";

/**
 * components/visit/PatientFinalDiagnosis.tsx
 *
 * Patient-facing panel showing the doctor's final diagnosis after a
 * completed visit. Also used as the post-submit success screen on the
 * doctor side (with a different "mode" prop).
 *
 * Talks to:
 *   GET /api/intake/visits/{visitId}/final-diagnosis
 *
 * If the visit is not yet "completed", shows a "still in progress" state.
 */
import { useEffect, useState } from "react";

import {
  FinalDiagnosisResponse,
  fetchFinalDiagnosis,
} from "@/lib/doctor-diagnosis";

interface PatientFinalDiagnosisProps {
  visitId: string;
  /** "patient" (read-only view) | "doctor-success" (post-submit confirmation) */
  mode?: "patient" | "doctor-success";
}

type State =
  | { kind: "loading" }
  | { kind: "ready"; diagnosis: FinalDiagnosisResponse }
  | { kind: "not-yet" }     // visit not completed yet
  | { kind: "error"; message: string };

export function PatientFinalDiagnosis({
  visitId,
  mode = "patient",
}: PatientFinalDiagnosisProps) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState({ kind: "loading" });
      try {
        const diagnosis = await fetchFinalDiagnosis(visitId);
        if (cancelled) return;
        setState({ kind: "ready", diagnosis });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "خطای ناشناخته";
        if (
          message.includes("404") ||
          message.includes("Not found") ||
          message.includes("not yet available")
        ) {
          setState({ kind: "not-yet" });
        } else {
          setState({ kind: "error", message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  if (state.kind === "loading") {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded" />
        </div>
      </div>
    );
  }

  if (state.kind === "not-yet") {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6 text-center">
        <h3 className="text-base font-semibold text-amber-800 dark:text-amber-400">
          تشخیص نهایی هنوز آماده نیست
        </h3>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400/80">
          پزشک هنوز تشخیص نهایی این ویزیت را ثبت نکرده است. پس از تکمیل ویزیت،
          نتیجه اینجا نمایش داده می‌شود.
        </p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
        <h3 className="text-base font-semibold text-red-700 dark:text-red-400">
          خطا در بارگذاری تشخیص نهایی
        </h3>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400/80">
          {state.message}
        </p>
      </div>
    );
  }

  const { diagnosis } = state;
  const createdAt = new Date(diagnosis.created_at).toLocaleString("fa-IR");

  return (
    <div className="rounded-xl border border-healing-200 dark:border-healing-900 bg-gradient-to-br from-healing-50 to-white dark:from-healing-950/40 dark:to-slate-900 overflow-hidden">
      <header className="border-b border-healing-200 dark:border-healing-900 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-healing-500 text-white">
            ✓
          </span>
          <div>
            <h3 className="text-base font-semibold text-healing-800 dark:text-healing-300">
              {mode === "doctor-success"
                ? "تشخیص نهایی با موفقیت ثبت شد"
                : "تشخیص نهایی شما"}
            </h3>
            <p className="text-xs text-healing-700/80 dark:text-healing-400/70">
              ثبت‌شده در {createdAt}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 space-y-4">
        {/* Disease name */}
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            بیماری تشخیص‌داده‌شده
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            {diagnosis.disease_name_fa}
          </p>
          {diagnosis.disease_name_en && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {diagnosis.disease_name_en}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {diagnosis.icd10 && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                کد ICD-10
              </p>
              <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {diagnosis.icd10}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              وضعیت ویزیت
            </p>
            <p className="font-semibold text-healing-700 dark:text-healing-400">
              {diagnosis.visit_status === "completed"
                ? "تکمیل‌شده"
                : diagnosis.visit_status}
            </p>
          </div>
        </div>

        {/* Notes */}
        {diagnosis.notes && (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              یادداشت پزشک
            </p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white/60 dark:bg-slate-900/40 px-3 py-2 text-sm text-slate-800 dark:text-slate-200">
              {diagnosis.notes}
            </p>
          </div>
        )}

        {/* Follow-up */}
        {diagnosis.requires_follow_up && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
              نیاز به ویزیت پیگیری{" "}
              {diagnosis.follow_up_days
                ? `طی ${diagnosis.follow_up_days} روز آینده`
                : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
