// clients/web/healthcare-frontend/lib/profile-api.ts
// کلاینت سرویس پروفایل کاربر (User Profile Service) از طریق API Gateway

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""; // مثلا "" یا "/api/gateway"
const BASE = `${API_BASE}/api/profile`;

// ---------- خطا ----------
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------- توکن ----------
// اگر auth-api شما کلید دیگری در localStorage می‌گذارد، فقط همین تابع را اصلاح کنید
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token")
  );
}

export type Role = "patient" | "doctor";

// خواندن نقش از payload توکن JWT (بدون نیاز به تماس با سرور)
export function getRoleFromToken(): Role | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role = String(payload.role ?? "").toLowerCase();
    if (role === "doctor") return "doctor";
    if (role === "patient") return "patient";
    return null;
  } catch {
    return null;
  }
}

// ---------- درخواست پایه ----------
async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("اتصال به سرور برقرار نشد. API Gateway و profile-service را بررسی کنید.", 0);
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    /* بدنه JSON ندارد */
  }

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = typeof detail === "string" ? detail : `خطای سرور (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

// ---------- انواع داده (هماهنگ با Pydantic Schemaهای بک‌اند) ----------
export interface Allergy {
  id: string;
  user_id: string;
  allergy_name: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  reaction_description?: string | null;
  diagnosed_at?: string | null;
  created_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  medication_name: string;
  dosage?: string | null;
  frequency?: string | null;
  prescribed_by?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Condition {
  id: string;
  user_id: string;
  condition_name: string;
  icd10_code?: string | null;
  diagnosed_at?: string | null;
  severity: "mild" | "moderate" | "severe";
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PatientProfile {
  user_id: string;
  full_name: string;
  birth_date: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  height_cm?: number | null;
  weight_kg?: number | null;
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
  allergies: Allergy[];
  medications: Medication[];
  conditions: Condition[];
}

export interface DoctorProfile {
  user_id: string;
  full_name: string;
  specialty: string;
  medical_license_number: string;
  years_of_experience?: number | null;
  phone?: string | null;
  office_address?: string | null;
  profile_image_url?: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- فرم‌ها ----------
export interface PatientProfilePayload {
  full_name: string;
  birth_date: string;
  gender: PatientProfile["gender"];
  height_cm?: number | null;
  weight_kg?: number | null;
  blood_type?: PatientProfile["blood_type"];
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface AllergyPayload {
  allergy_name: string;
  severity: Allergy["severity"];
  reaction_description?: string;
  diagnosed_at?: string;
}

export interface MedicationPayload {
  medication_name: string;
  dosage?: string;
  frequency?: string;
  prescribed_by?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  is_active?: boolean;
}

export interface ConditionPayload {
  condition_name: string;
  icd10_code?: string;
  diagnosed_at?: string;
  severity: Condition["severity"];
  notes?: string;
  is_active?: boolean;
}

export interface DoctorProfilePayload {
  full_name: string;
  specialty: string;
  medical_license_number: string;
  years_of_experience?: number | null;
  phone?: string | null;
  office_address?: string | null;
}

// =====================================================================
// PATIENT
// =====================================================================
export const getPatientProfile = () => req<PatientProfile>("/patient/me");
export const createPatientProfile = (body: PatientProfilePayload) =>
  req<PatientProfile>("/patient/me", { method: "POST", body: JSON.stringify(body) });
export const updatePatientProfile = (body: Partial<PatientProfilePayload>) =>
  req<PatientProfile>("/patient/me", { method: "PUT", body: JSON.stringify(body) });

export const addAllergy = (body: AllergyPayload) =>
  req<Allergy>("/patient/me/allergies", { method: "POST", body: JSON.stringify(body) });
export const updateAllergy = (id: string, body: Partial<AllergyPayload>) =>
  req<Allergy>(`/patient/me/allergies/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteAllergy = (id: string) =>
  req<void>(`/patient/me/allergies/${id}`, { method: "DELETE" });

export const addMedication = (body: MedicationPayload) =>
  req<Medication>("/patient/me/medications", { method: "POST", body: JSON.stringify(body) });
export const updateMedication = (id: string, body: Partial<MedicationPayload>) =>
  req<Medication>(`/patient/me/medications/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteMedication = (id: string) =>
  req<void>(`/patient/me/medications/${id}`, { method: "DELETE" });

export const addCondition = (body: ConditionPayload) =>
  req<Condition>("/patient/me/conditions", { method: "POST", body: JSON.stringify(body) });
export const updateCondition = (id: string, body: Partial<ConditionPayload>) =>
  req<Condition>(`/patient/me/conditions/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteCondition = (id: string) =>
  req<void>(`/patient/me/conditions/${id}`, { method: "DELETE" });

// =====================================================================
// DOCTOR
// =====================================================================
export const getDoctorProfile = () => req<DoctorProfile>("/doctor/me");
export const createDoctorProfile = (body: DoctorProfilePayload) =>
  req<DoctorProfile>("/doctor/me", { method: "POST", body: JSON.stringify(body) });
export const updateDoctorProfile = (body: Partial<DoctorProfilePayload>) =>
  req<DoctorProfile>("/doctor/me", { method: "PUT", body: JSON.stringify(body) });

// =====================================================================
// AVATAR (multipart)
// =====================================================================
async function uploadAvatar(path: string, file: File): Promise<{ profile_image_url: string }> {
  const form = new FormData();
  form.append("file", file);
  return req<{ profile_image_url: string }>(path, { method: "POST", body: form });
}

export const uploadPatientAvatar = (file: File) => uploadAvatar("/patient/me/avatar", file);
export const uploadDoctorAvatar = (file: File) => uploadAvatar("/doctor/me/avatar", file);
