"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SymptomChat, { type SymptomChatHandle } from "@/components/visit/SymptomChat";
import VisitSidebar from "@/components/visit/VisitSidebar";
import { mockVisitHistory } from "@/components/visit/SymptomTemplates";
import { fetchVisits, fetchVisitDetail, saveVisit } from "@/lib/visit-service";
import type { ChatMessage, VisitHistory } from "@/types/visit";
import { Stethoscope } from "lucide-react";

// برچسب فارسی علائم (اگر SymptomData فیلد label ندارد)
const SYMPTOM_LABELS: Record<string, string> = {
  fever: "تب",
  cough: "سرفه",
  pain: "درد",
  headache: "سردرد",
  vomiting: "حالت تهوع/استفراغ",
  skin_lesion: "ضایعه پوستی",
};

export default function VisitPage() {
  const { isOpen, isCollapsed, open, setCollapsed } = useSidebarStore();

  const [visits, setVisits] = useState<VisitHistory[]>(mockVisitHistory);
  const [selectedVisitId, setSelectedVisitId] = useState<string | undefined>();
  const [showVisitList, setShowVisitList] = useState(true);
  const [loadingVisit, setLoadingVisit] = useState(false);
  const [sending, setSending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // با تغییر chatKey کامپوننت چت کاملاً ریست می‌شود
  const [chatKey, setChatKey] = useState(0);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[] | null>(null);

  const chatRef = useRef<SymptomChatHandle>(null);

  // بارگذاری لیست ویزیت‌ها از سرور (وقتی بک‌اند آماده شد، خط mock حذف شود)
  useEffect(() => {
    fetchVisits()
      .then(setVisits)
      .catch(() => {
        /* سرور هنوز آماده نیست → از mock استفاده می‌کنیم */
      });
  }, []);

  // ذخیره ویزیت جاری روی سرور (submit → ai-nlp-service evidence extraction)
    const persistCurrentVisit = async () => {
    const chat = chatRef.current;
    if (!chat || !chat.hasUserChatted()) return;

    const snapshot = chat.getVisitSnapshot();
    setSending(true);
    setSaveError(null);
    try {
      await saveVisit({ messages: snapshot.messages, symptoms: snapshot.symptoms });
      const fresh = await fetchVisits();
      setVisits(fresh);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ذخیره ویزیت";
      console.error("خطا در ذخیره ویزیت:", err);
      setSaveError(msg);
      throw err;
    } finally {
      setSending(false);
    }
  };

  // ========== ویزیت جدید ==========
  const handleNewVisit = async () => {
    try {
      await persistCurrentVisit();
    } catch {
      /* خطا در persistCurrentVisit مدیریت و در saveError نمایش داده شده */
      return;
    }
    setSelectedVisitId(undefined);
    setHistoryMessages(null);
    setSaveError(null);
    setChatKey((k) => k + 1);
  };

  // ========== انتخاب ویزیت قبلی ==========
  const handleSelectVisit = async (visit: VisitHistory) => {
    setSelectedVisitId(visit.id);
    setLoadingVisit(true);

    try {
      const messages = await fetchVisitDetail(visit.id);
      setHistoryMessages(messages);
      setChatKey((k) => k + 1); // ریست چت با پیام‌های تاریخچه
    } catch (err) {
      console.error("خطا در دریافت ویزیت از سرور:", err);
      // فعلاً چت خالی نمایش داده می‌شود تا UI خراب نشود
      setHistoryMessages([]);
      setChatKey((k) => k + 1);
    } finally {
      setLoadingVisit(false);
    }
  };

  const isReadOnly = selectedVisitId !== undefined;

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toggle Visit List Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVisitList(!showVisitList)}
          className="absolute top-3 z-30 w-8 h-8 rounded-lg border shadow-sm bg-card left-3">
          <Menu className="w-4 h-4" />
        </Button>

        {/* Loading Overlay برای بارگذاری ویزیت */}
        {loadingVisit && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-xl border shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال بارگذاری ویزیت...
            </div>
          </div>
        )}
        {saveError && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-2 max-w-md">
            <span className="flex-1">{saveError}</span>
            <button
              onClick={() => { setSaveError(null); persistCurrentVisit().catch(() => {}); }}
              className="font-bold underline shrink-0"
            >
              تلاش مجدد
            </button>
          </div>
        )}

        <SymptomChat
          key={chatKey}
          ref={chatRef}
          onSendToDoctor={async () => {
            await persistCurrentVisit();
          }}
          initialMessages={historyMessages ?? undefined}
          readOnly={isReadOnly}
          isSending={sending}
        />
      </div>

      {/* Visit Sidebar (Left side in RTL) */}
      <AnimatePresence>
        {showVisitList && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0 h-full border-l border-border overflow-hidden"
          >
            <VisitSidebar
              visits={visits}
              selectedVisitId={selectedVisitId}
              onSelectVisit={handleSelectVisit}
              onNewVisit={handleNewVisit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}