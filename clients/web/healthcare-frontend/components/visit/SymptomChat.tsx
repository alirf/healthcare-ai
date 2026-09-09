"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage, SymptomData, SymptomOption } from "@/types/visit";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";
import SymptomSelector from "./SymptomSelector";
import { createSymptomData } from "./SymptomTemplates";

// ==================== TYPES ====================

export interface SymptomChatHandle {
  hasUserChatted: () => boolean;
  getVisitSnapshot: () => { messages: ChatMessage[]; symptoms: SymptomData[] };
  reset: () => void;
}

interface SymptomChatProps {
  onSendToDoctor: () => void;
  initialMessages?: ChatMessage[]; // پیام‌های ویزیت قبلی
  readOnly?: boolean;              // حالت مشاهده‌ی تاریخچه
}

// ==================== COMPONENT ====================

const SymptomChat = forwardRef<SymptomChatHandle, SymptomChatProps>(
  ({ onSendToDoctor, initialMessages, readOnly = false }, ref) => {
    const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const [showSymptomSelector, setShowSymptomSelector] = useState(false);
    const [pendingSymptoms, setPendingSymptoms] = useState<SymptomData[]>([]);
    const [allConfirmed, setAllConfirmed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Expose methods to parent (VisitPage)
    useImperativeHandle(ref, () => ({
      hasUserChatted: () => messages.some((m) => m.sender === "user"),
      getVisitSnapshot: () => ({ messages, symptoms: pendingSymptoms }),
      reset: () => {
        setMessages([]);
        setPendingSymptoms([]);
        setAllConfirmed(false);
        setIsLoading(false);
      },
    }), [messages, pendingSymptoms]);

    // Auto-scroll
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, pendingSymptoms]);

    // Get current date group
    const getDateGroup = () => {
      return new Date().toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Handle user message
    const handleSendMessage = async (content: string) => {
      if (readOnly) return; // در حالت مشاهده تاریخچه اجازه چت نیست

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "user",
        type: "text",
        content,
        timestamp: new Date().toISOString(),
        dateGroup: getDateGroup(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      setTimeout(() => {
        const thinkingMessage: ChatMessage = {
          id: `thinking-${Date.now()}`,
          sender: "ai",
          type: "text",
          content: "🔍 در حال تحلیل علائم شما...",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, thinkingMessage]);

        setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== thinkingMessage.id));

          const detectedSymptoms = detectSymptoms(content);
          const symptomBoxes = detectedSymptoms.map((type, i) =>
            createSymptomData(type, `symptom-${Date.now()}-${i}`)
          );

          const existingTypes = new Set(pendingSymptoms.map((s) => s.type));
          const newUniqueSymptoms = symptomBoxes.filter((s) => !existingTypes.has(s.type));

          if (newUniqueSymptoms.length === 0) {
            const noNewSymptomsMessage: ChatMessage = {
              id: `ai-${Date.now()}`,
              sender: "ai",
              type: "text",
              content: "✅ این علائم قبلاً ثبت شده‌اند. لطفاً علائم جدید رو از دکمه 'اضافه کردن علامت' انتخاب کنید.",
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, noNewSymptomsMessage]);
            setIsLoading(false);
            return;
          }

          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: "ai",
            type: "symptoms",
            content: `✨ علائم جدید زیر از پیام شما شناسایی شد:`,
            symptoms: newUniqueSymptoms,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, aiMessage]);
          setPendingSymptoms((prev) => [...prev, ...newUniqueSymptoms]);
          setIsLoading(false);
        }, 2000);
      }, 500);
    };

    // Simple symptom detection (mock)
    const detectSymptoms = (text: string): string[] => {
      const symptoms: string[] = [];
      const lowerText = text.toLowerCase();
      const existingTypes = new Set(pendingSymptoms.map((s) => s.type));

      if ((lowerText.includes("تب") || lowerText.includes("گرم") || lowerText.includes("لرز")) && !existingTypes.has("fever")) {
        symptoms.push("fever");
      }
      if ((lowerText.includes("سرفه") || lowerText.includes("خلط")) && !existingTypes.has("cough")) {
        symptoms.push("cough");
      }
      if ((lowerText.includes("درد") || lowerText.includes("کمر درد") || lowerText.includes("درد بدن")) && !existingTypes.has("pain")) {
        symptoms.push("pain");
      }
      if ((lowerText.includes("سردرد") || lowerText.includes("سر درد") || lowerText.includes("میگرن")) && !existingTypes.has("headache")) {
        symptoms.push("headache");
      }
      if ((lowerText.includes("استفراغ") || lowerText.includes("بالا آوردن") || lowerText.includes("حالت تهوع")) && !existingTypes.has("vomiting")) {
        symptoms.push("vomiting");
      }
      if ((lowerText.includes("پوست") || lowerText.includes("جوش") || lowerText.includes("ضایعه") || lowerText.includes("راش")) && !existingTypes.has("skin_lesion")) {
        symptoms.push("skin_lesion");
      }

      if (symptoms.length === 0 && pendingSymptoms.length === 0) {
        symptoms.push("pain", "fever");
      }

      return symptoms;
    };

    // Handle symptom update
    const handleSymptomUpdate = (updatedSymptom: SymptomData) => {
      if (readOnly) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.symptoms) {
            return {
              ...msg,
              symptoms: msg.symptoms.map((s) =>
                s.id === updatedSymptom.id ? updatedSymptom : s
              ),
            };
          }
          return msg;
        })
      );
      setPendingSymptoms((prev) =>
        prev.map((s) => (s.id === updatedSymptom.id ? updatedSymptom : s))
      );
    };

    // Handle symptom remove
    const handleSymptomRemove = (symptomId: string) => {
      if (readOnly) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.symptoms) {
            return {
              ...msg,
              symptoms: msg.symptoms.filter((s) => s.id !== symptomId),
            };
          }
          return msg;
        })
      );
      setPendingSymptoms((prev) => prev.filter((s) => s.id !== symptomId));
    };

    // Handle confirm all symptoms
    const handleConfirmAll = () => {
      if (readOnly) return;
      const allCompleted = pendingSymptoms.every((s) => s.completed);
      if (!allCompleted) {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          sender: "ai",
          type: "text",
          content: "⚠️ لطفاً تمام علائم را تکمیل کنید (شدت، مدت و توضیحات را وارد کنید).",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      setAllConfirmed(true);

      const confirmMessage: ChatMessage = {
        id: `confirm-${Date.now()}`,
        sender: "user",
        type: "text",
        content: "✅ تمام علائم تأیید شدند",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmMessage]);

      const aiResponse: ChatMessage = {
        id: `ai-response-${Date.now()}`,
        sender: "ai",
        type: "text",
        content: "🔄 در حال ارسال اطلاعات به پزشک...",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);

      setTimeout(() => {
        onSendToDoctor();
        const successMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          sender: "ai",
          type: "text",
          content: "✅ اطلاعات شما با موفقیت به پزشک ارسال شد.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, successMessage]);
      }, 500);
    };

    // Handle add symptoms from selector
    const handleAddSymptoms = (selected: SymptomOption[]) => {
      if (readOnly) return;
      const newSymptoms = selected.map((opt, i) =>
        createSymptomData(opt.type, `symptom-add-${Date.now()}-${i}`)
      );

      const userSymptomMessage: ChatMessage = {
        id: `user-symptoms-${Date.now()}`,
        sender: "user",
        type: "symptoms",
        content: `➕ علائم اضافه شده: ${selected.map((s) => s.label).join("، ")}`,
        symptoms: newSymptoms,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userSymptomMessage]);
      setPendingSymptoms((prev) => [...prev, ...newSymptoms]);
      setShowSymptomSelector(false);
      setAllConfirmed(false);
    };

    // Get existing symptom types
    const getExistingTypes = () => {
      const types = new Set<string>();
      messages.forEach((msg) => {
        msg.symptoms?.forEach((s) => types.add(s.type));
      });
      pendingSymptoms.forEach((s) => types.add(s.type));
      return Array.from(types);
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
      const date = msg.dateGroup || getDateGroup();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    }, {} as Record<string, ChatMessage[]>);

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {readOnly ? "مشاهده ویزیت قبلی" : "ویزیت هوشمند"}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  readOnly ? "bg-muted-foreground" : "bg-healing-500 animate-pulse"
                )} />
                {readOnly ? "فقط خواندنی" : "هوش مصنوعی فعال"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {/* Welcome Message */}
          {messages.length === 0 && !readOnly && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/20">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">ویزیت هوشمند</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                  علائم خود را بنویسید. هوش مصنوعی ما آن‌ها را تحلیل کرده و به پزشک ارسال می‌کند.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {["تب و لرز دارم", "سردرد شدید", "درد در قفسه سینه", "ضایعه پوستی در دست"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-muted hover:bg-trust-50 dark:hover:bg-trust-900/20 text-xs text-muted-foreground hover:text-trust-600 transition-colors border border-border"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Grouped Messages */}
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="space-y-4">
              {/* Date Divider */}
              <div className="flex items-center justify-center">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-[10px] text-muted-foreground font-medium">{date}</span>
                </div>
              </div>

              {/* Messages */}
              {msgs.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  onSymptomUpdate={handleSymptomUpdate}
                  onSymptomRemove={handleSymptomRemove}
                />
              ))}
            </div>
          ))}

          {/* Action Buttons after AI symptoms (فقط در حالت چت عادی) */}
          {pendingSymptoms.length > 0 && !allConfirmed && !readOnly && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 justify-center pt-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSymptomSelector(true)}
                className="h-9 text-xs border-dashed border-trust-300 hover:bg-trust-50 dark:hover:bg-trust-900/20"
              >
                <Plus className="w-3.5 h-3.5 ml-1" />
                اضافه کردن علامت
              </Button>

              <Button
                size="sm"
                onClick={handleConfirmAll}
                disabled={!pendingSymptoms.every((s) => s.completed)}
                className={cn(
                  "h-9 text-xs text-white shadow-lg shadow-trust-500/25",
                  pendingSymptoms.every((s) => s.completed)
                    ? "bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 cursor-pointer"
                    : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60"
                )}
              >
                <Check className="w-3.5 h-3.5 ml-1" />
                {pendingSymptoms.every((s) => s.completed)
                  ? "تأیید و ارسال به پزشک"
                  : `${pendingSymptoms.filter((s) => !s.completed).length} علامت ناقص`}
              </Button>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input (در حالت readOnly غیرفعال) */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading || readOnly}
          isLoading={isLoading}
        />

        {/* Symptom Selector Modal */}
        <SymptomSelector
          isOpen={showSymptomSelector}
          onClose={() => setShowSymptomSelector(false)}
          onAdd={handleAddSymptoms}
          existingTypes={getExistingTypes()}
        />
      </div>
    );
  }
);

SymptomChat.displayName = "SymptomChat";

export default SymptomChat;