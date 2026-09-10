"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  CalendarDays,
  Send,
  CheckCheck,
  User,
  Headset,
  AlertTriangle,
  MessageCirclePlus,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { SupportTicket, TicketMessage, TicketStatus } from "@/types/support";

const statusConfig: Record<
  TicketStatus,
  { label: string; badge: string }
> = {
  open: { label: "باز", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  in_progress: { label: "در حال بررسی", badge: "bg-trust-500/10 text-trust-600 border-trust-500/20" },
  answered: { label: "پاسخ داده شده", badge: "bg-healing-500/10 text-healing-600 border-healing-500/20" },
  closed: { label: "بسته شده", badge: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

interface TicketDetailModalProps {
  ticket: SupportTicket | null;
  onClose: () => void;
}

export default function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ساخت گفتگوی اولیه بر اساس داده تیکت
  const initialMessages = useMemo<TicketMessage[]>(() => {
    if (!ticket) return [];
    const base = new Date(ticket.date).getTime();
    return [
      {
        id: `${ticket.id}-user`,
        sender: "user",
        content: ticket.subject,
        timestamp: ticket.date,
        isRead: true,
      },
      {
        id: `${ticket.id}-support`,
        sender: "support",
        content: ticket.lastMessage,
        timestamp: new Date(base + 2 * 3600_000).toISOString(),
        isRead: ticket.status === "closed" || ticket.status === "answered",
      },
    ];
  }, [ticket]);

  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);

  // ریست پیام‌ها وقتی تیکت عوض می‌شود
  useMemo(() => setMessages(initialMessages), [initialMessages]);

  const handleSendReply = () => {
    if (!reply.trim() || !ticket) return;
    const userMsg: TicketMessage = {
      id: `reply-${Date.now()}`,
      sender: "user",
      content: reply.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, userMsg]);
    setReply("");
    setIsSending(true);

    // شبیه‌سازی پاسخ پشتیبانی
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `support-${Date.now()}`,
          sender: "support",
          content: "پیام شما دریافت شد. کارشناسان ما در اسرع وقت پاسخ می‌دهند.",
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ]);
      setIsSending(false);
    }, 1500);
  };

  const isClosed = ticket?.status === "closed";
  const status = ticket ? statusConfig[ticket.status] : null;

  return (
    <AnimatePresence>
      {ticket && status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="w-full max-w-2xl h-[80vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== Header ===== */}
            <div className="p-5 border-b border-border space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      ticket.category === "گزارش مشکل"
                        ? "bg-red-50 dark:bg-red-900/20"
                        : "bg-healing-50 dark:bg-healing-900/20"
                    )}
                  >
                    {ticket.category === "گزارش مشکل" ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <MessageCirclePlus className="w-5 h-5 text-healing-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground leading-tight">
                      {ticket.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        <span dir="ltr">{ticket.trackingCode}</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatRelativeTime(ticket.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px]", status.badge)}>
                  {status.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {ticket.category}
                </Badge>
              </div>
            </div>

            {/* ===== Messages ===== */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2.5", isUser ? "flex-row" : "flex-row-reverse")}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                        isUser
                          ? "bg-gradient-to-br from-trust-500 to-healing-500"
                          : "bg-gradient-to-br from-amber-500 to-orange-500"
                      )}
                    >
                      {isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Headset className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={cn("flex flex-col max-w-[75%]", isUser ? "items-start" : "items-end")}>
                      <span className="text-[10px] text-muted-foreground mb-1 mr-1">
                        {isUser ? "شما" : "پشتیبانی سلامت هوشمند"}
                      </span>
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "bg-[#0084ff] text-white rounded-br-sm"
                            : "bg-white dark:bg-slate-800 border border-border rounded-bl-sm"
                        )}
                      >
                        {msg.content}
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1 text-[10px]",
                            isUser ? "justify-end text-white/70" : "justify-start text-muted-foreground"
                          )}
                        >
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString("fa-IR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isUser && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {isSending && (
                <div className="flex gap-2.5 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                    <Headset className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* ===== Reply / Footer ===== */}
            {isClosed ? (
              <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  این تیکت بسته شده است. برای موضوع جدید تیکت ثبت کنید.
                </span>
              </div>
            ) : (
              <div className="p-3 border-t border-border">
                <div className="flex items-end gap-2 bg-muted rounded-2xl p-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder="پاسخ خود را بنویسید..."
                    rows={1}
                    className="flex-1 bg-transparent py-1.5 px-2 text-sm outline-none resize-none min-h-[36px] max-h-[100px] placeholder:text-muted-foreground"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendReply}
                    disabled={!reply.trim() || isSending}
                    className="w-9 h-9 rounded-xl bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-md shadow-trust-500/25 shrink-0"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}