"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage, SymptomData, SymptomOption } from "@/types/visit";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";
import SymptomSelector from "./SymptomSelector";
import { createSymptomData, mockVisitHistory } from "./SymptomTemplates";

// ==================== MOCK AI RESPONSES ====================

const mockAIResponses: Record<string, string[]> = {
  default: [
    "علائم شما را بررسی می‌کنم...",
    "با توجه به توضیحات شما، چند علامت مهم شناسایی شد.",
    "لطفاً جزئیات هر علامت را تکمیل کنید.",
  ],
};

// ==================== COMPONENT ====================

interface SymptomChatProps {
  onSendToDoctor: () => void;
}

export default function SymptomChat({ onSendToDoctor }: SymptomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSymptomSelector, setShowSymptomSelector] = useState(false);
  const [pendingSymptoms, setPendingSymptoms] = useState<SymptomData[]>([]);
  const [allConfirmed, setAllConfirmed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

    // Simulate AI processing
    setTimeout(() => {
      // AI "thinking" message
      const thinkingMessage: ChatMessage = {
        id: `thinking-${Date.now()}`,
        sender: "ai",
        type: "text",
        content: "🔍 در حال تحلیل علائم شما...",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, thinkingMessage]);

      // After "thinking", show symptoms
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMessage.id));

        // Detect symptoms from message (mock)
        const detectedSymptoms = detectSymptoms(content);
        const symptomBoxes = detectedSymptoms.map((type, i) =>
          createSymptomData(type, `symptom-${Date.now()}-${i}`)
        );

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          type: "symptoms",
          content: "✨ علائم زیر از پیام شما شناسایی شد. لطفاً جزئیات هر کدام را تکمیل کنید:",
          symptoms: symptomBoxes,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setPendingSymptoms(symptomBoxes);
        setIsLoading(false);
      }, 2000);
    }, 500);
  };

  // Simple symptom detection (mock)
  const detectSymptoms = (text: string): string[] => {
    const symptoms: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("تب") || lowerText.includes("گرم") || lowerText.includes("لرز")) {
      symptoms.push("fever");
    }
    if (lowerText.includes("سرفه") || lowerText.includes("خلط")) {
      symptoms.push("cough");
    }
    if (lowerText.includes("درد") || lowerText.includes("کمر درد") || lowerText.includes("درد بدن")) {
      symptoms.push("pain");
    }
    if (lowerText.includes("سردرد") || lowerText.includes("سر درد") || lowerText.includes("میگرن")) {
      symptoms.push("headache");
    }
    if (lowerText.includes("استفراغ") || lowerText.includes("بالا آوردن") || lowerText.includes("حالت تهوع")) {
      symptoms.push("vomiting");
    }
    if (lowerText.includes("پوست") || lowerText.includes("جوش") || lowerText.includes("ضایعه") || lowerText.includes("راش")) {
      symptoms.push("skin_lesion");
    }

    // Default if no symptoms detected
    if (symptoms.length === 0) {
      symptoms.push("pain", "fever");
    }

    return symptoms;
  };

  // Handle symptom update
  const handleSymptomUpdate = (updatedSymptom: SymptomData) => {
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
    const allCompleted = pendingSymptoms.every((s) => s.completed);
    if (!allCompleted) {
      // Auto-complete symptoms that don't require details
      const autoCompleted = pendingSymptoms.map((s) =>
        !s.requiresDetails ? { ...s, completed: true } : s
      );
      setPendingSymptoms(autoCompleted);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.symptoms) {
            return { ...msg, symptoms: autoCompleted };
          }
          return msg;
        })
      );
    }

    setAllConfirmed(true);
    
    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      sender: "user",
      type: "text",
      content: "✅ تمام علائم تأیید شدند",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, confirmMessage]);

    // AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `ai-response-${Date.now()}`,
        sender: "ai",
        type: "text",
        content: "عالی! اطلاعات شما ثبت شد. آیا علامت دیگری دارید یا می‌خواهید ویزیت را برای پزشک ارسال کنید؟",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  // Handle add symptoms from selector
  const handleAddSymptoms = (selected: SymptomOption[]) => {
    const newSymptoms = selected.map((opt, i) => createSymptomData(opt.type, `symptom-add-${Date.now()}-${i}`));
    
    // Add as user message with symptoms on right side
    const userSymptomMessage: ChatMessage = {
      id: `user-symptoms-${Date.now()}`,
      sender: "user",
      type: "symptoms",
      content: `علائم اضافه شده: ${selected.map((s) => s.label).join("، ")}`,
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
            <h3 className="font-bold text-sm text-foreground">ویزیت هوشمند</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-healing-500 animate-pulse" />
              هوش مصنوعی فعال
            </p>
          </div>
        </div>
        
        {allConfirmed && (
          <Button
            onClick={onSendToDoctor}
            size="sm"
            className="h-9 text-xs bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25"
          >
            <Send className="w-3.5 h-3.5 ml-1" />
            ارسال به پزشک
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
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

        {/* Action Buttons after AI symptoms */}
        {pendingSymptoms.length > 0 && !allConfirmed && (
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
              className="h-9 text-xs bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25"
            >
              <Check className="w-3.5 h-3.5 ml-1" />
              تأیید همه علائم
            </Button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} isLoading={isLoading} />

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