// lib/visit-service.ts
import type { ChatMessage, SymptomData, VisitHistory } from "@/types/visit";
import { createSymptomData, symptomCategories } from "@/components/visit/SymptomTemplates";
import { refreshToken, clearTokens } from "@/lib/auth-api";

// از rewrite داخل next.config استفاده می‌کنیم → بدون مشکل CORS
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/gateway";

// ==================== Backend response types ====================

interface ApiVisit {
  id: string;
  medical_record_id: string | null;
  doctor_id: string | null;
  status: string;
  chief_complaint: string | null;
  started_at: string;
}

interface ApiMessage {
  id: string;
  sender_type: string;   // patient | ai | system
  message_type: string;  // text | file
  content: string | null;
  attachment_url: string | null;
  sent_at: string;
}

interface ApiSymptom {
  id: string;
  symptom_name: string;
  source: string;
  severity: string | null;           // mild | moderate | severe
  body_part: string | null;
  duration_description: string | null;
  notes: string | null;
  created_at: string;
}

// ==================== Helpers ====================

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && retry) {
    // یک بار تلاش برای رفرش توکن
    const refreshed = await refreshToken();
    if (refreshed.success) {
      return apiFetch<T>(path, options, false);
    }
    // رفرش هم ممکن نبود → پاک کردن و رفتن به لاگین
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("نشست شما منقضی شده است. لطفاً دوباره وارد شوید.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const detail = err?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(" | ")   // خطاهای 422 FastAPI
          : `خطای سرور (${res.status})`;
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ==================== Mappings ====================

const STATUS_MAP: Record<string, VisitHistory["status"]> = {
  intake: "pending",
  ai_processing: "pending",
  doctor_assigned: "pending",
  in_chat: "in_progress",
  prescription_pending: "in_progress",
  completed: "completed",
  closed: "completed",
  cancelled: "completed",
};

const SEVERITY_TO_NUMBER: Record<string, 3 | 6 | 9> = {
  mild: 3, moderate: 6, severe: 9,
};

function severityFromNumber(n: number): "mild" | "moderate" | "severe" {
  return n <= 3 ? "mild" : n <= 7 ? "moderate" : "severe";
}

function findTypeByLabel(label: string): string {
  for (const cat of symptomCategories) {
    const opt = cat.symptoms.find((s) => s.label === label);
    if (opt) return opt.type;
  }
  return label;
}

function toVisitHistory(v: ApiVisit): VisitHistory {
  return {
    id: v.id,
    title: v.chief_complaint ?? "ویزیت آنلاین",
    doctorName: v.doctor_id ? "پزشک متخصص" : "در انتظار تخصیص پزشک",
    date: v.started_at,
    status: STATUS_MAP[v.status] ?? "pending",
    icon: "Stethoscope",
    iconColor: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    symptoms: [],
  };
}

// ==================== Public API (names unchanged → no page.tsx change) ====================

// لیست ویزیت‌های بیمار
export async function fetchVisits(): Promise<VisitHistory[]> {
  const data = await apiFetch<{ total: number; visits: ApiVisit[] }>("/api/intake/visits");
  return data.visits.map(toVisitHistory);
}

// جزئیات یک ویزیت → تبدیل به ChatMessage[] برای نمایش در چت
export async function fetchVisitDetail(visitId: string): Promise<ChatMessage[]> {
  const [msgs, symptoms] = await Promise.all([
    apiFetch<ApiMessage[]>(`/api/intake/visits/${visitId}/messages`),
    apiFetch<ApiSymptom[]>(`/api/intake/visits/${visitId}/symptoms`),
  ]);

  const chat: ChatMessage[] = msgs.map((m) => ({
    id: m.id,
    sender: m.sender_type === "patient" ? "user" : m.sender_type === "doctor" ? "doctor" : "ai",
    type: "text",
    content: m.content ?? undefined,
    timestamp: m.sent_at,
  }));

  if (symptoms.length > 0) {
    const boxes: SymptomData[] = symptoms.map((s) => {
      const box = createSymptomData(findTypeByLabel(s.symptom_name), s.id);
      box.completed = true;
      if (box.details) {
        if (s.severity) box.details.severity = SEVERITY_TO_NUMBER[s.severity] ?? 5;
        if (s.body_part) box.details.bodyParts = [s.body_part];
        box.details.duration = s.duration_description ?? "";
        box.details.description = s.notes ?? "";
      }
      return box;
    });

    chat.push({
      id: `symptoms-${visitId}`,
      sender: "ai",
      type: "symptoms",
      content: "علائم ثبت‌شده در این ویزیت:",
      symptoms: boxes,
      timestamp: symptoms[0].created_at,
    });
  }

  return chat;
}

// ذخیره کامل یک ویزیت: ساخت ویزیت ← پیام‌های کاربر ← علائم ← submit برای AI
export async function saveVisit(payload: {
  messages: ChatMessage[];
  symptoms: SymptomData[];
}): Promise<string> {
  const firstUserMsg = payload.messages.find((m) => m.sender === "user")?.content;

  const visit = await apiFetch<ApiVisit>("/api/intake/visits", {
    method: "POST",
    body: JSON.stringify({
      chief_complaint: firstUserMsg ? firstUserMsg.slice(0, 200) : undefined,
    }),
  });

  for (const m of payload.messages) {
    if (m.sender === "user" && m.content) {
      await apiFetch(`/api/intake/visits/${visit.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: m.content }),
      });
    }
  }

  for (const s of payload.symptoms) {
    await apiFetch(`/api/intake/visits/${visit.id}/symptoms`, {
      method: "POST",
      body: JSON.stringify({
        symptom_name: s.label,                 // فارسی برای ParserBERT
        severity: s.details?.severity ? severityFromNumber(s.details.severity) : undefined,
        body_part: s.details?.bodyParts?.[0],
        duration_description: s.details?.duration || undefined,
        notes: s.details?.description || undefined,
      }),
    });
  }

  await apiFetch(`/api/intake/visits/${visit.id}/submit`, { method: "POST" });
  return visit.id;
}