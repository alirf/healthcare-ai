"use client";

// ==================== MEDICAL RECORD TYPES ====================

export type RecordType = "visit" | "test" | "image" | "note";
export type RecordStatus = "completed" | "pending" | "in_progress" | "reviewed";

export interface MedicalRecord {
  id: string;
  type: RecordType;
  title: string;
  subtitle: string;
  description: string;
  doctorName?: string;
  doctorAvatar?: string;
  clinicName?: string;
  date: string;
  status: RecordStatus;
  statusLabel: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  tags?: string[];
}

export interface RecordSummary {
  totalRecords: number;
  totalVisits: number;
  totalTests: number;
  totalImages: number;
  totalNotes: number;
  lastUpdated: string;
}

export interface RecordActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
  iconColor: string;
  bgColor: string;
}