/**
 * lib/doctor-diagnosis.ts
 *
 * Frontend service for the AI diagnosis flow:
 *   - trigger AI diagnosis for a visit
 *   - fetch stored AI suggestions
 *   - submit the doctor's final diagnosis (with ICD-10)
 *   - fetch the final diagnosis (doctor + patient views)
 *
 * Backend endpoints (Gateway → visit-intake-service):
 *   POST /api/intake/visits/{visitId}/diagnose         — doctor triggers AI
 *   GET  /api/intake/visits/{visitId}/ai-diagnosis     — doctor fetches suggestions
 *   POST /api/intake/visits/{visitId}/final-diagnosis  — doctor submits final
 *   GET  /api/intake/visits/{visitId}/final-diagnosis  — doctor + patient fetch
 *
 * All responses are typed against the backend Pydantic schemas in
 * services/visit-intake-service/app/schemas/diagnosis.py.
 */
import { apiFetch } from "@/lib/api-config";

// ==================== Types ====================

export interface MatchedEvidence {
  evidence_id: string;
  weight: number;
  evidence_class: "cardinal" | "major" | "minor" | string;
  name_fa: string | null;
}

export interface DiseasePrediction {
  disease_id: string;
  disease_name_fa: string;
  disease_name_en: string;
  icd10: string | null;
  ml_probability: number;
  rule_score: number;
  combined_score: number;
  is_emergency: boolean;
  severity: number;             // 1-5
  matched_evidences: MatchedEvidence[];
  absent_evidences: MatchedEvidence[];
}

export interface AIDiagnosisSuggestion extends DiseasePrediction {
  id: string;                   // UUID of the stored row
  rank: number;                 // 1-based position
}

export interface AIDiagnosisResponse {
  visit_id: string;
  suggestions: AIDiagnosisSuggestion[];
  evidence_source: string;       // stored_ai_symptoms | reextracted | stored | passthrough
  patient_sex: string;
  model_version: string;
  rule_engine_version: string;
  diagnosed_at: string;          // ISO 8601
  input_evidence_count: number;
}

export interface FinalDiagnosisRequest {
  selected_suggestion_id?: string | null;
  manual_disease_name?: string | null;
  manual_icd10?: string | null;
  notes?: string;
  requires_follow_up?: boolean;
  follow_up_days?: number | null;
}

export interface FinalDiagnosisResponse {
  id: string;
  visit_id: string;
  disease_name_fa: string;
  disease_name_en: string | null;
  icd10: string | null;
  disease_id: string | null;
  selected_suggestion_id: string | null;
  notes: string;
  requires_follow_up: boolean;
  follow_up_days: number | null;
  doctor_id: string;
  created_at: string;
  visit_status: string;
}

// ==================== API functions ====================

/**
 * Trigger AI diagnosis for a visit.
 *
 * Calls POST /api/intake/visits/{visitId}/diagnose → visit-intake-service
 * → ai-triage-service → ai-diagnosis-service (LogisticRegression).
 *
 * Returns the freshly stored suggestions. The doctor can call this again
 * to refresh the suggestions (e.g. after more chat messages with the
 * patient).
 */
export async function triggerAIDiagnosis(
  visitId: string
): Promise<AIDiagnosisResponse> {
  return apiFetch<AIDiagnosisResponse>(
    `/api/intake/visits/${visitId}/diagnose`,
    { method: "POST" }
  );
}

/**
 * Fetch the stored AI diagnosis suggestions for a visit.
 *
 * Returns 404 if no diagnosis has been triggered yet — the doctor
 * should call triggerAIDiagnosis() first.
 */
export async function fetchAIDiagnosis(
  visitId: string
): Promise<AIDiagnosisResponse> {
  return apiFetch<AIDiagnosisResponse>(
    `/api/intake/visits/${visitId}/ai-diagnosis`
  );
}

/**
 * Submit the doctor's final diagnosis.
 *
 * The doctor can either pick an AI suggestion (selected_suggestion_id)
 * or enter a manual diagnosis (manual_disease_name + manual_icd10).
 * At least one source must be provided.
 *
 * After submission, the visit status is moved to "completed" server-side.
 */
export async function submitFinalDiagnosis(
  visitId: string,
  payload: FinalDiagnosisRequest
): Promise<FinalDiagnosisResponse> {
  return apiFetch<FinalDiagnosisResponse>(
    `/api/intake/visits/${visitId}/final-diagnosis`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Fetch the final diagnosis for a visit.
 *
 * - Doctor: can view any time after submission.
 * - Patient: only sees it once visit_status === "completed".
 *
 * Returns 404 if no final diagnosis has been submitted yet.
 */
export async function fetchFinalDiagnosis(
  visitId: string
): Promise<FinalDiagnosisResponse> {
  return apiFetch<FinalDiagnosisResponse>(
    `/api/intake/visits/${visitId}/final-diagnosis`
  );
}
