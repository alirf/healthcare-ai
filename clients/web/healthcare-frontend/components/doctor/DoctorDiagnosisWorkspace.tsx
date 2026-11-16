"use client";

/**
 * components/doctor/DoctorDiagnosisWorkspace.tsx
 *
 * Top-level workspace the doctor sees inside a visit detail page.
 * Composes:
 *   - AIDiagnosisPanel    (list of AI suggestions, click to select)
 *   - FinalDiagnosisForm  (submit final diagnosis, can pick a suggestion
 *                         or type a manual one with ICD-10)
 *   - PatientFinalDiagnosis shown in "doctor-success" mode after submit
 *
 * Usage:
 *   <DoctorDiagnosisWorkspace visitId={visitId} />
 *
 * The parent page can render this inside the doctor's visit layout
 * (e.g. /dashboard/doctor/visits/[visitId]/diagnosis).
 */
import { useState } from "react";

import {
  AIDiagnosisSuggestion,
  FinalDiagnosisResponse,
} from "@/lib/doctor-diagnosis";
import { AIDiagnosisPanel } from "@/components/doctor/AIDiagnosisPanel";
import { FinalDiagnosisForm } from "@/components/doctor/FinalDiagnosisForm";
import { PatientFinalDiagnosis } from "@/components/visit/PatientFinalDiagnosis";

interface DoctorDiagnosisWorkspaceProps {
  visitId: string;
}

export function DoctorDiagnosisWorkspace({
  visitId,
}: DoctorDiagnosisWorkspaceProps) {
  const [selected, setSelected] = useState<AIDiagnosisSuggestion | null>(null);
  const [submitted, setSubmitted] = useState<FinalDiagnosisResponse | null>(
    null
  );

  if (submitted) {
    return (
      <div className="space-y-4">
        <PatientFinalDiagnosis visitId={visitId} mode="doctor-success" />

        <button
          type="button"
          onClick={() => {
            setSubmitted(null);
            setSelected(null);
          }}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          بازگشت به ویرایش تشخیص
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT: AI suggestions list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          پیشنهادهای هوش مصنوعی
        </h2>
        <AIDiagnosisPanel
          visitId={visitId}
          selectedId={selected?.id ?? null}
          onPick={(s) => setSelected(s)}
        />
      </div>

      {/* RIGHT: Final diagnosis form */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          ثبت تشخیص نهایی
        </h2>
        <FinalDiagnosisForm
          visitId={visitId}
          selectedSuggestion={selected}
          onClearSelection={() => setSelected(null)}
          onSubmitted={(response) => setSubmitted(response)}
          onCancel={() => setSelected(null)}
        />
      </div>
    </div>
  );
}
