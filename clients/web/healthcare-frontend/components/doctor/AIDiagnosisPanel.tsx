"use client";

/**
 * components/doctor/AIDiagnosisPanel.tsx
 *
 * Shows the AI diagnosis suggestions for a visit. The doctor can:
 *   - refresh suggestions (re-trigger AI)
 *   - select one suggestion as the basis for the final diagnosis
 *
 * Used inside the doctor's visit detail page. Talks to:
 *   GET  /api/intake/visits/{visitId}/ai-diagnosis
 *   POST /api/intake/visits/{visitId}/diagnose
 *
 * Props:
 *   visitId        — the visit UUID
 *   onPick         — callback when the doctor picks a suggestion
 *   selectedId     — currently selected suggestion ID (for highlight)
 */
import { useCallback, useEffect, useState } from "react";

import {
  AIDiagnosisSuggestion,
  fetchAIDiagnosis,
  triggerAIDiagnosis,
} from "@/lib/doctor-diagnosis";

interface AIDiagnosisPanelProps {
  visitId: string;
  onPick?: (suggestion: AIDiagnosisSuggestion) => void;
  selectedId?: string | null;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; suggestions: AIDiagnosisSuggestion[]; evidenceSource: string; diagnosedAt: string }
  | { kind: "empty" }          // 404 — no diagnosis yet
  | { kind: "error"; message: string };

const SEVERITY_LABEL: Record<number, string> = {
  1: "خفیف",
  2: "خفیف",
  3: "متوسط",
  4: "شدید",
  5: "بحرانی",
};

const SEVERITY_COLOR: Record<number, string> = {
  1: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30",
  2: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30",
  3: "text-amber-700 bg-amber-50 dark:bg-amber-900/30",
  4: "text-orange-700 bg-orange-50 dark:bg-orange-900/30",
  5: "text-red-700 bg-red-50 dark:bg-red-900/30",
};

export function AIDiagnosisPanel({
  visitId,
  onPick,
  selectedId,
}: AIDiagnosisPanelProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const result = await fetchAIDiagnosis(visitId);
      if (!result.suggestions.length) {
        setState({ kind: "empty" });
      } else {
        setState({
          kind: "ready",
          suggestions: result.suggestions,
          evidenceSource: result.evidence_source,
          diagnosedAt: result.diagnosed_at,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطای ناشناخته";
      // 404 → empty state, anything else → error
      if (message.includes("404") || message.includes("Not found")) {
        setState({ kind: "empty" });
      } else {
        setState({ kind: "error", message });
      }
    }
  }, [visitId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await triggerAIDiagnosis(visitId);
      setState({
        kind: "ready",
        suggestions: result.suggestions,
        evidenceSource: result.evidence_source,
        diagnosedAt: result.diagnosed_at,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطای ناشناخته";
      setState({ kind: "error", message });
    } finally {
      setRefreshing(false);
    }
  }, [visitId]);

  // ── Loading ────────────────────────────────────────────────────────
  if (state.kind === "loading") {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded" />
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          در حال بارگذاری پیشنهادهای تشخیص هوش مصنوعی...
        </p>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────
  if (state.kind === "empty") {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6 text-center">
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
          هنوز پیشنهاد تشخیصی ثبت نشده است
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          با کلیک روی دکمه زیر، هوش مصنوعی بر اساس علائم ثبت‌شده ویزیت،
          فهرستی از بیماری‌های محتمل را پیشنهاد می‌دهد.
        </p>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-trust-600 px-4 py-2 text-sm font-medium text-white hover:bg-trust-700 disabled:opacity-60"
        >
          {refreshing ? "در حال اجرای هوش مصنوعی..." : "اجرای تشخیص هوش مصنوعی"}
        </button>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (state.kind === "error") {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
        <h3 className="text-base font-semibold text-red-700 dark:text-red-400">
          خطا در بارگذاری پیشنهادهای تشخیص
        </h3>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400/80">
          {state.message}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────
  const { suggestions, evidenceSource, diagnosedAt } = state;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            پیشنهادهای تشخیص هوش مصنوعی
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {suggestions.length} بیماری محتمل · منبع:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {evidenceSource === "stored_ai_symptoms"
                ? "علائم ذخیره‌شده"
                : evidenceSource === "reextracted"
                ? "استخراج مجدد از متن"
                : evidenceSource === "stored"
                ? "ذخیره‌شده"
                : evidenceSource}
            </span>{" "}
            · {new Date(diagnosedAt).toLocaleString("fa-IR")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          {refreshing ? "در حال اجرا..." : "اجرای مجدد"}
        </button>
      </header>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {suggestions.map((s) => {
          const isSelected = selectedId === s.id;
          const severityLabel = SEVERITY_LABEL[s.severity] ?? "نامشخص";
          const severityColor = SEVERITY_COLOR[s.severity] ?? SEVERITY_COLOR[1];

          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick?.(s)}
                className={[
                  "w-full text-right px-5 py-4 transition-colors",
                  "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  isSelected
                    ? "bg-trust-50 dark:bg-trust-950/30 ring-1 ring-inset ring-trust-300 dark:ring-trust-700"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {s.rank}
                      </span>
                      <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {s.disease_name_fa}
                      </h4>
                      {s.is_emergency && (
                        <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:text-red-300">
                          اورژانسی
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {s.disease_name_en}
                      {s.icd10 ? ` · ICD-10: ${s.icd10}` : ""}
                    </p>
                  </div>

                  <div className="shrink-0 text-left">
                    <div className="text-sm font-bold text-trust-700 dark:text-trust-400">
                      {(s.combined_score * 100).toFixed(1)}%
                    </div>
                    <div className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${severityColor}`}>
                      {severityLabel}
                    </div>
                  </div>
                </div>

                {/* Matched evidences */}
                {s.matched_evidences.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.matched_evidences.slice(0, 5).map((ev) => (
                      <span
                        key={ev.evidence_id}
                        className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300"
                        title={`وزن: ${ev.weight} · طبقه: ${ev.evidence_class}`}
                      >
                        {ev.name_fa ?? ev.evidence_id}
                      </span>
                    ))}
                    {s.matched_evidences.length > 5 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        +{s.matched_evidences.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Score breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div>
                    امتیاز مدل ML:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {(s.ml_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    امتیاز قانون‌محور:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {(s.rule_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
