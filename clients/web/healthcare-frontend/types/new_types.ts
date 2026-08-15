"use client";

// ==================== ACTIVITY TYPES ====================

export type ActivityType = "chat" | "visit" | "order" | "ai" | "appointment" | "prescription";

export type ActivityStatus = 
  "new_message" | "completed" | "in_progress" | "scheduled" | "delivered" | "shipping" | "pending";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: ActivityStatus;
  statusLabel: string;
  date: string;
  icon: string; // lucide icon name
  iconColor: string;
  bgColor: string;
  link: string;
}

// ==================== WALLET TYPES ====================

export interface Wallet {
  balance: number;
  currency: string;
}

// ==================== REMINDER TYPES ====================

export type ReminderType = "appointment" | "medication" | "order" | "checkup";

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  date: string;
  time?: string;
  urgency: "today" | "soon" | "upcoming";
  urgencyLabel: string;
  icon: string;
  iconColor: string;
  bgColor: string;
}

// ==================== HEALTH SUMMARY TYPES ====================

export interface HealthMetricSummary {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  bgColor: string;
}

// ==================== AI RECOMMENDATION TYPES ====================

export interface AIRecommendation {
  id: string;
  title: string;
  content: string;
  type: "exercise" | "diet" | "medication" | "checkup" | "general";
  icon: string;
  iconColor: string;
}

// ==================== SLIDE TYPES ====================

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  bgColor: string;
  textColor: string;
  ctaText: string;
  ctaLink: string;
}

// ==================== BIG ACTION BUTTON TYPES ====================

export interface BigActionButton {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  borderColor: string;
}

// ==================== SIDEBAR TYPES ====================

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  isActive?: boolean;
  badge?: number;
  badgeColor?: string;
}

// ==================== HEADER TYPES ====================

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "visit" | "order" | "chat" | "system" | "reminder";
  isRead: boolean;
  createdAt: string;
  link?: string;
}