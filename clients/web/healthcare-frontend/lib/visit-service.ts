import type { ChatMessage, SymptomData, VisitHistory } from "@/types/visit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token"); // با کلیدی که در لاگین ذخیره می‌کنید هماهنگ کنید
}

// دریافت لیست ویزیت‌های کاربر از سرور
export async function fetchVisits(): Promise<VisitHistory[]> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/intake/visits`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch visits");
  return res.json();
}

// دریافت جزئیات (پیام‌های) یک ویزیت خاص
export async function fetchVisitDetail(visitId: string): Promise<ChatMessage[]> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/intake/visits/${visitId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch visit detail");
  const data = await res.json();
  return data.messages ?? [];
}

// ذخیره ویزیت جدید روی سرور
export async function saveVisit(payload: {
  messages: ChatMessage[];
  symptoms: SymptomData[];
}): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/intake/visits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save visit");
}