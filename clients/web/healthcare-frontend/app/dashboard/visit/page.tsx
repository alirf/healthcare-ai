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

  // ========== ویزیت جدید ==========
  const handleNewVisit = () => {
    const chat = chatRef.current;

    // حالت ۱: کاربر چتی نکرده → فقط ریست، بدون ذخیره
    if (!chat || !chat.hasUserChatted()) {
      setSelectedVisitId(undefined);
      setHistoryMessages(null);
      setChatKey((k) => k + 1);
      return;
    }

    // حالت ۲: کاربر چت کرده → ویزیت فعلی به تاریخچه اضافه می‌شود
    const snapshot = chat.getVisitSnapshot();
    const firstUserMsg =
      snapshot.messages.find((m) => m.sender === "user")?.content ?? "ویزیت جدید";
    const symptomLabels = snapshot.symptoms.map(
      (s) => SYMPTOM_LABELS[s.type] ?? s.type
    );

    const newVisit: VisitHistory = {
      id: `visit-${Date.now()}`,
      title: firstUserMsg.length > 40 ? firstUserMsg.slice(0, 40) + "…" : firstUserMsg,
      doctorName: "در انتظار تخصیص پزشک",
      symptoms: symptomLabels,
      status: "pending",
      date: new Date().toISOString(),
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      iconColor: "text-violet-500",
      icon: "Stethoscope",
    };

    // ذخیره روی سرور (بدون await تا UI قفل نشود)
    saveVisit({ messages: snapshot.messages, symptoms: snapshot.symptoms }).catch(
      (err) => console.error("خطا در ذخیره ویزیت:", err)
    );

    setVisits((prev) => [newVisit, ...prev]);
    setSelectedVisitId(undefined);
    setHistoryMessages(null);
    setChatKey((k) => k + 1); // شروع ویزیت جدید
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

        <SymptomChat
          key={chatKey}
          ref={chatRef}
          onSendToDoctor={() => console.log("Sending to doctor...")}
          initialMessages={historyMessages ?? undefined}
          readOnly={isReadOnly}
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