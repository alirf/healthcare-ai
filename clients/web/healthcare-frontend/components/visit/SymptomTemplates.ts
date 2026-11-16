"use client";

import type { SymptomCategory, SymptomData, VisitHistory } from "@/types/visit";

// ==================== VISIT HISTORY MOCK ====================

export const mockVisitHistory: VisitHistory[] = [
  {
    id: "v1",
    title: "ویزیت قلب و عروق",
    doctorName: "دکتر علی محمدی",
    date: "2026-08-28T11:00:00Z",
    status: "completed",
    icon: "Stethoscope",
    iconColor: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    symptoms: ["درد سینه", "تنگی نفس"],
  },
  {
    id: "v2",
    title: "ویزیت آنلاین",
    doctorName: "دکتر سارا یوسفی",
    date: "2026-09-05T14:30:00Z",
    status: "completed",
    icon: "Stethoscope",
    iconColor: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
    symptoms: ["تب", "گلودرد", "سرفه"],
  },
  {
    id: "v3",
    title: "ویزیت پوست",
    doctorName: "دکتر رضا کریمی",
    date: "2026-09-07T09:00:00Z",
    status: "in_progress",
    icon: "Stethoscope",
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    symptoms: ["ضایعه پوستی"],
  },
];

// ==================== SYMPTOM CATEGORIES ====================

export const symptomCategories: SymptomCategory[] = [
  {
    id: "general",
    label: "عمومی",
    icon: "Thermometer",
    symptoms: [
      { id: "fever", type: "fever", label: "تب", description: "افزایش دمای بدن" },
      { id: "chills", type: "chills", label: "لرز", description: "لرز و سرمازدگی" },
      { id: "fatigue", type: "fatigue", label: "خستگی", description: "احساس خستگی مفرط" },
      { id: "weakness", type: "weakness", label: "ضعف عمومی", description: "کاهش نیروی بدنی" },
      { id: "sweating", type: "sweating", label: "تعرق", description: "عرق کردن بیش از حد" },
      { id: "weight_loss", type: "weight_loss", label: "کاهش وزن", description: "کاهش غیرعادی وزن" },
      { id: "weight_gain", type: "weight_gain", label: "افزایش وزن", description: "افزایش سریع وزن" },
      { id: "anorexia", type: "anorexia", label: "بی‌اشتهایی", description: "عدم میل به غذا" },
    ],
  },
  {
    id: "respiratory",
    label: "تنفسی",
    icon: "Wind",
    symptoms: [
      { id: "cough", type: "cough", label: "سرفه", description: "سرفه خشک یا خلط‌دار" },
      { id: "shortness_breath", type: "shortness_breath", label: "تنگی نفس", description: "مشکل در تنفس" },
      { id: "chest_pain", type: "chest_pain", label: "درد قفسه سینه", description: "درد در ناحیه سینه" },
      { id: "wheezing", type: "wheezing", label: "خس خس", description: "صدای خس خس هنگام نفس" },
      { id: "sore_throat", type: "sore_throat", label: "گلودرد", description: "درد و التهاب گلو" },
      { id: "runny_nose", type: "runny_nose", label: "آبریزش بینی", description: "ترشحات بینی" },
      { id: "nasal_congestion", type: "nasal_congestion", label: "گرفتگی بینی", description: "انسداد مجاری بینی" },
      { id: "sneezing", type: "sneezing", label: "عطسه", description: "عطسه مکرر" },
    ],
  },
  {
    id: "pain",
    label: "درد",
    icon: "Activity",
    symptoms: [
      { id: "headache", type: "headache", label: "سردرد", description: "درد در ناحیه سر" },
      { id: "pain", type: "pain", label: "درد در بدن", description: "درد در نواحی مختلف بدن" },
      { id: "back_pain", type: "back_pain", label: "کمردرد", description: "درد در ناحیه کمر" },
      { id: "abdominal_pain", type: "abdominal_pain", label: "درد شکم", description: "درد در ناحیه شکم" },
      { id: "joint_pain", type: "joint_pain", label: "درد مفاصل", description: "درد در مفاصل" },
      { id: "muscle_pain", type: "muscle_pain", label: "درد عضلانی", description: "درد در عضلات" },
      { id: "toothache", type: "toothache", label: "دندان درد", description: "درد در دندان‌ها" },
      { id: "earache", type: "earache", label: "گوش درد", description: "درد در گوش" },
    ],
  },
  {
    id: "digestive",
    label: "گوارشی",
    icon: "Utensils",
    symptoms: [
      { id: "vomiting", type: "vomiting", label: "استفراغ", description: "بالا آوردن غذا" },
      { id: "nausea", type: "nausea", label: "حالت تهوع", description: "احساس تهوع" },
      { id: "diarrhea", type: "diarrhea", label: "اسهال", description: "مدفوع آبکی" },
      { id: "constipation", type: "constipation", label: "یبوست", description: "دشواری در دفع" },
      { id: "bloating", type: "bloating", label: "نفخ", description: "احساس پری شکم" },
      { id: "heartburn", type: "heartburn", label: "سوزش سر دل", description: "سوزش در مری" },
      { id: "loss_appetite", type: "loss_appetite", label: "کاهش اشتها", description: "کم شدن میل به غذا" },
    ],
  },
  {
    id: "skin",
    label: "پوست",
    icon: "Scan",
    symptoms: [
      { id: "skin_lesion", type: "skin_lesion", label: "ضایعه پوستی", description: "تغییرات ظاهری پوست" },
      { id: "rash", type: "rash", label: "راش", description: "جوش‌های پوستی" },
      { id: "itching", type: "itching", label: "خارش", description: "خارش پوست" },
      { id: "redness", type: "redness", label: "قرمزی", description: "قرمزی پوست" },
      { id: "swelling", type: "swelling", label: "تورم", description: "ورم در نواحی مختلف" },
      { id: "dry_skin", type: "dry_skin", label: "خشکی پوست", description: "پوست خشک و پوسته‌پوسته" },
      { id: "bruising", type: "bruising", label: "کبودی", description: "کبودی‌های پوستی" },
    ],
  },
  {
    id: "neurological",
    label: "اعصاب",
    icon: "Brain",
    symptoms: [
      { id: "dizziness", type: "dizziness", label: "سرگیجه", description: "احساس چرخش سر" },
      { id: "numbness", type: "numbness", label: "بی‌حسی", description: "از دست دادن حس" },
      { id: "tingling", type: "tingling", label: "گزگز", description: "احساس سوزن سوزن شدن" },
      { id: "tremor", type: "tremor", label: "لرزش", description: "لرزش غیرارادی" },
      { id: "seizure", type: "seizure", label: "تشنج", description: "حمله صرع" },
      { id: "confusion", type: "confusion", label: "گیجی", description: "سردرگمی" },
      { id: "memory_loss", type: "memory_loss", label: "فراموشی", description: "کاهش حافظه" },
    ],
  },
  {
    id: "cardiovascular",
    label: "قلب و عروق",
    icon: "Heart",
    symptoms: [
      { id: "chest_tightness", type: "chest_tightness", label: "فشار سینه", description: "احساس فشار در سینه" },
      { id: "palpitations", type: "palpitations", label: "تپش قلب", description: "ضربان نامنظم قلب" },
      { id: "leg_swelling", type: "leg_swelling", label: "ورم پاها", description: "تورم در پاها" },
      { id: "cold_extremities", type: "cold_extremities", label: "سردی اندام‌ها", description: "دست و پای سرد" },
    ],
  },
  {
    id: "urinary",
    label: "ادراری",
    icon: "Droplets",
    symptoms: [
      { id: "frequent_urination", type: "frequent_urination", label: "تکرر ادرار", description: "دفع مکرر ادرار" },
      { id: "painful_urination", type: "painful_urination", label: "درد هنگام ادرار", description: "سوزش و درد" },
      { id: "blood_urine", type: "blood_urine", label: "خون در ادرار", description: "هماتوری" },
      { id: "urgency", type: "urgency", label: "فوریت ادرار", description: "نیاز فوری به دفع" },
    ],
  },
];

// ==================== BODY PARTS FOR ANATOMY ====================

export const bodyParts = [
  { id: "head", label: "سر", x: 50, y: 8, width: 16, height: 12 },
  { id: "neck", label: "گردن", x: 50, y: 18, width: 10, height: 6 },
  { id: "chest", label: "قفسه سینه", x: 50, y: 28, width: 28, height: 14 },
  { id: "abdomen", label: "شکم", x: 50, y: 42, width: 24, height: 12 },
  { id: "left_arm", label: "دست چپ", x: 22, y: 32, width: 12, height: 28 },
  { id: "right_arm", label: "دست راست", x: 78, y: 32, width: 12, height: 28 },
  { id: "left_hand", label: "دست چپ", x: 14, y: 58, width: 10, height: 8 },
  { id: "right_hand", label: "دست راست", x: 86, y: 58, width: 10, height: 8 },
  { id: "left_leg", label: "پای چپ", x: 38, y: 56, width: 14, height: 36 },
  { id: "right_leg", label: "پای راست", x: 62, y: 56, width: 14, height: 36 },
  { id: "left_foot", label: "پای چپ", x: 36, y: 90, width: 12, height: 8 },
  { id: "right_foot", label: "پای راست", x: 64, y: 90, width: 12, height: 8 },
  { id: "back", label: "کمر", x: 50, y: 35, width: 24, height: 16 },
  { id: "shoulders", label: "شانه‌ها", x: 50, y: 22, width: 36, height: 8 },
];

// ==================== SYMPTOM CONFIGURATION ====================

export const symptomConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  importance: "high" | "medium" | "low";
  requiresDetails: boolean;
  hasAnatomy: boolean;
  hasSeverity: boolean;
}> = {
  fever: {
    label: "تب",
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-200 dark:border-rose-800",
    importance: "high",
    requiresDetails: true,
    hasAnatomy: false,
    hasSeverity: true,
  },
  cough: {
    label: "سرفه",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    importance: "medium",
    requiresDetails: true,
    hasAnatomy: false,
    hasSeverity: true,
  },
  pain: {
    label: "درد در بدن",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    importance: "high",
    requiresDetails: true,
    hasAnatomy: true,
    hasSeverity: true,
  },
  headache: {
    label: "سردرد",
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800",
    importance: "high",
    requiresDetails: true,
    hasAnatomy: false,
    hasSeverity: true,
  },
  vomiting: {
    label: "استفراغ",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    importance: "high",
    requiresDetails: true,
    hasAnatomy: false,
    hasSeverity: true,
  },
  skin_lesion: {
    label: "ضایعه پوستی",
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    borderColor: "border-pink-200 dark:border-pink-800",
    importance: "medium",
    requiresDetails: true,
    hasAnatomy: true,
    hasSeverity: false,
  },
};

// ==================== INITIAL SYMPTOM DATA FACTORY ====================

export function createSymptomData(type: string, id: string): SymptomData {
  const config = symptomConfig[type] || {
    label: type,
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    borderColor: "border-trust-200 dark:border-trust-800",
    importance: "medium",
    requiresDetails: false,
    hasAnatomy: false,
    hasSeverity: false,
  };

  return {
    id,
    type,
    label: config.label,
    icon: "Activity",
    color: config.color,
    bgColor: config.bgColor,
    borderColor: config.borderColor,
    importance: config.importance,
    requiresDetails: config.requiresDetails,
    details: config.requiresDetails ? {
      severity: config.hasSeverity ? 5 : undefined,
      bodyParts: config.hasAnatomy ? [] : undefined,
      duration: "",
      frequency: "",
      description: "",
    } : undefined,
    completed: !config.requiresDetails,
  };
}

// ==================== EVIDENCE-BASED SYMPTOM DATA FACTORY ====================
// NEW — replaces the hard-coded 6-symptom mock with real ParsBERT evidences.
// Used by SymptomChat.handleSendMessage when it calls extractEvidences().

/**
 * Build a SymptomData box from a single detected evidence returned by
 * ai-nlp-service (POST /api/intake/extract-evidences-preview).
 *
 * - `type` is set to the evidence_id (e.g. "E_21_0003") so the de-dup check
 *   in SymptomChat (existingTypes.has(s.type)) works per-evidence instead
 *   of the old 6 hard-coded strings.
 * - `label` prefers the Persian name (`name_fa`), falls back to the English
 *   `name`, then to the raw evidence_id — so the UI never shows an empty box.
 * - `importance` is derived from the model's confidence so high-confidence
 *   evidences surface as "important" in the UI automatically.
 * - `requiresDetails=true` + a default severity of 5 means the user can open
 *   the box and refine severity / body parts exactly like before.
 */
export function createSymptomDataFromEvidence(
  evidenceId: string,
  nameFa: string,
  confidence: number,
  index: number
): SymptomData {
  return {
    id: `evidence-${evidenceId}-${Date.now()}-${index}`,
    type: evidenceId,                                 // ← per-evidence dedup key
    label: nameFa,
    icon: "Activity",
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    borderColor: "border-trust-200 dark:border-trust-800",
    importance: confidence > 0.8 ? "high" : confidence > 0.5 ? "medium" : "low",
    requiresDetails: true,
    details: {
      severity: 5,
      bodyParts: [],
      duration: "",
      frequency: "",
      description: "",
    },
    completed: false,
  };
}
