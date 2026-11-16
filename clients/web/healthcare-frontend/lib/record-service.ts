// lib/record-service.ts
import { apiFetch } from "@/lib/api-config";

// ==================== Types (بک‌اند) ====================

export interface ApiRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description: string | null;
  icd10_code: string | null;
  status: "active" | "archived" | "closed";
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiRecordVisit {
  id: string;
  record_id: string;
  visit_id: string;      // ویزیت در visit-intake-service زندگی می‌کند
  added_by: string;
  added_at: string;
}

export interface ApiRecordFile {
  id: string;
  record_id: string;
  uploaded_by: string;
  file_name: string;
  content_type: string;
  size: number;
  description: string | null;
  file_url: string | null;   // presigned URL تازه
  created_at: string;
}

export interface ApiRecordDetail extends ApiRecord {
  visits: ApiRecordVisit[];
  files: ApiRecordFile[];
}

export interface ApiRecordList {
  total: number;
  records: ApiRecord[];
}

// اطلاعات ویزیت که از visit-intake-service گرفته می‌شود (برای نمایش در جزئیات پرونده)
export interface ApiVisitInfo {
  id: string;
  status: string;
  chief_complaint: string | null;
  started_at: string;
  completed_at: string | null;
  doctor_id: string | null;
}

// ==================== نقشه‌های نمایشی ====================

export const RECORD_TYPE_META: Record<string, { label: string; icon: string }> = {
  heart_attack: { label: "سکته قلبی", icon: "HeartPulse" },
  diabetes: { label: "دیابت", icon: "Droplets" },
  hypertension: { label: "فشار خون", icon: "Activity" },
  respiratory: { label: "تنفسی", icon: "Wind" },
  general: { label: "عمومی", icon: "Stethoscope" },
};
export const recordTypeLabel = (t: string) => RECORD_TYPE_META[t]?.label ?? t;

export const RECORD_STATUS_META: Record<string, { label: string; badge: string }> = {
  active: { label: "فعال", badge: "bg-healing-500/10 text-healing-600 border-healing-500/20" },
  archived: { label: "بایگانی‌شده", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  closed: { label: "بسته‌شده", badge: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

const VISIT_STATUS_FA: Record<string, string> = {
  intake: "ثبت اولیه",
  ai_processing: "پردازش هوش مصنوعی",
  doctor_assigned: "در صف پزشک",
  in_chat: "در حال ویزیت",
  prescription_pending: "در انتظار نسخه",
  completed: "تکمیل‌شده",
  closed: "بسته‌شده",
  cancelled: "لغوشده",
};
export const visitStatusLabel = (s: string) => VISIT_STATUS_FA[s] ?? s;

// ==================== API عمومی ====================
// قانون: هیچ مسیری با "/" تمام نمی‌شود (نه اینجا، نه در گیت‌وی، نه در بک‌اند)

// لیست پرونده‌های من
export async function fetchRecords(status?: string): Promise<ApiRecord[]> {
  const q = status ? `?status_filter=${status}` : "";
  const data = await apiFetch<ApiRecordList>(`/api/records${q}`);
  return data.records;
}

// جزئیات پرونده (ویزیت‌ها + فایل‌ها)
export async function fetchRecordDetail(recordId: string): Promise<ApiRecordDetail> {
  return apiFetch<ApiRecordDetail>(`/api/records/${recordId}`);
}

// ساخت پرونده جدید
export async function createRecord(payload: {
  record_type: string;
  title: string;
  description?: string;
  icd10_code?: string;
}): Promise<ApiRecord> {
  return apiFetch<ApiRecord>("/api/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ویرایش پرونده
export async function updateRecord(
  recordId: string,
  payload: { title?: string; description?: string; record_type?: string; icd10_code?: string }
): Promise<ApiRecord> {
  return apiFetch<ApiRecord>(`/api/records/${recordId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// بستن پرونده
export async function closeRecord(recordId: string): Promise<ApiRecord> {
  return apiFetch<ApiRecord>(`/api/records/${recordId}/close`, { method: "POST" });
}

// بایگانی پرونده
export async function archiveRecord(recordId: string): Promise<ApiRecord> {
  return apiFetch<ApiRecord>(`/api/records/${recordId}/archive`, { method: "POST" });
}

// لیست فایل‌های پرونده (URL تازه)
export async function fetchRecordFiles(recordId: string): Promise<ApiRecordFile[]> {
  return apiFetch<ApiRecordFile[]>(`/api/records/${recordId}/files`);
}

// آپلود فایل (multipart)
export async function uploadRecordFile(
  recordId: string,
  file: File,
  description?: string
): Promise<ApiRecordFile> {
  const form = new FormData();
  form.append("file", file);
  if (description) form.append("description", description);
  return apiFetch<ApiRecordFile>(`/api/records/${recordId}/files`, {
    method: "POST",
    body: form,
  });
}

// حذف فایل
export async function deleteRecordFile(recordId: string, fileId: string): Promise<void> {
  await apiFetch<void>(`/api/records/${recordId}/files/${fileId}`, { method: "DELETE" });
}

// جزئیات یک ویزیت لینک‌شده (از visit-intake-service — در صورت خطا null برمی‌گردد)
export async function fetchVisitInfo(visitId: string): Promise<ApiVisitInfo | null> {
  try {
    return await apiFetch<ApiVisitInfo>(`/api/intake/visits/${visitId}`);
  } catch {
    return null; // سرویس ویزیت در دسترس نیست → فقط UUID نمایش داده می‌شود
  }
}

// فرمت حجم فایل
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}