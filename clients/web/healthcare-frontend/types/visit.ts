"use client";

// ==================== CHAT MESSAGE TYPES ====================

export type MessageSender = "user" | "ai" | "doctor";

export type MessageType = "text" | "symptoms" | "doctor_reply";

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content?: string;
  symptoms?: SymptomBox[];
  timestamp: string;
  dateGroup?: string;
  avatar?: string;
  doctorName?: string;
}

// ==================== SYMPTOM BOX TYPES ====================

export type SymptomSeverity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type SymptomType = 
  | "fever"           // تب
  | "cough"           // سرفه
  | "pain"            // درد در بدن (با آناتومی)
  | "headache"        // سردرد
  | "vomiting"        // استفراغ
  | "skin_lesion"     // ضایعه پوستی (با آناتومی)
  | string;           // سایر علائم

export interface SymptomData {
  id: string;
  type: SymptomType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  importance: "high" | "medium" | "low";
  requiresDetails: boolean;
  details?: SymptomDetails;
  completed: boolean;
}

export interface SymptomDetails {
  severity?: SymptomSeverity;
  bodyParts?: string[];       // برای درد و ضایعه پوستی
  duration?: string;
  frequency?: string;
  description?: string;
}

// ==================== VISIT HISTORY TYPES ====================

export interface VisitHistory {
  id: string;
  title: string;
  doctorName: string;
  clinicName?: string;
  date: string;
  status: "completed" | "pending" | "in_progress";
  icon: string;
  iconColor: string;
  bgColor: string;
  symptoms: string[];
}

// ==================== SYMPTOM CATEGORY TYPES ====================

export interface SymptomCategory {
  id: string;
  label: string;
  icon: string;
  symptoms: SymptomOption[];
}

export interface SymptomOption {
  id: string;
  type: SymptomType;
  label: string;
  description?: string;
}