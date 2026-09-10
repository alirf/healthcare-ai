export type TicketStatus = "open" | "in_progress" | "answered" | "closed";

export interface SupportTicket {
  id: string;
  subject: string;
  trackingCode: string;
  category: "گزارش مشکل" | "پرسش جدید" | "سایر";
  date: string;
  status: TicketStatus;
  lastMessage: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface TicketMessage {
  id: string;
  sender: "user" | "support";
  content: string;
  timestamp: string;
  isRead?: boolean;
}