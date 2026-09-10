"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  AlertTriangle,
  MessageCirclePlus,
  HelpCircle,
  Loader2,
  CheckCircle,
  Ticket,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RequestType = "problem" | "question" | "other";

const requestTypes: {
  id: RequestType;
  label: string;
  description: string;
  icon: typeof HelpCircle;
  activeBorder: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    id: "problem",
    label: "گزارش مشکل",
    description: "خرابی، خطا یا باگ در سامانه",
    icon: AlertTriangle,
    activeBorder: "border-red-300 dark:border-red-700",
    activeBg: "bg-red-50 dark:bg-red-900/20",
    activeText: "text-red-600 dark:text-red-400",
  },
  {
    id: "question",
    label: "پرسش جدید",
    description: "سوال درباره خدمات سامانه",
    icon: MessageCirclePlus,
    activeBorder: "border-trust-300 dark:border-trust-700",
    activeBg: "bg-trust-50 dark:bg-trust-900/20",
    activeText: "text-trust-600 dark:text-trust-400",
  },
  {
    id: "other",
    label: "سایر موارد",
    description: "موضوعات دیگر",
    icon: HelpCircle,
    activeBorder: "border-violet-300 dark:border-violet-700",
    activeBg: "bg-violet-50 dark:bg-violet-900/20",
    activeText: "text-violet-600 dark:text-violet-400",
  },
];

const categories = [
  { value: "general", label: "عمومی" },
  { value: "visit", label: "ویزیت آنلاین" },
  { value: "pharmacy", label: "داروخانه" },
  { value: "payment", label: "پرداخت و تراکنش" },
  { value: "account", label: "حساب کاربری" },
  { value: "technical", label: "مشکل فنی" },
];

function NewTicketForm() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as RequestType) || "question";

  const [type, setType] = useState<RequestType>(
    requestTypes.some((t) => t.id === initialType) ? initialType : "question"
  );
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (subject.trim().length < 5) {
      setError("موضوع باید حداقل ۵ کاراکتر باشد");
      return;
    }
    if (description.trim().length < 20) {
      setError("توضیحات باید حداقل ۲۰ کاراکتر باشد");
      return;
    }

    setLoading(true);
    // TODO: اتصال به بک‌اند پشتیبانی
    await new Promise((r) => setTimeout(r, 1500));
    setTrackingCode(`TKT-${Math.floor(1000 + Math.random() * 9000)}`);
    setSubmitted(true);
    setLoading(false);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubject("");
    setDescription("");
    setCategory("general");
    setType("question");
    setTrackingCode("");
  };

  // ==================== SUCCESS SCREEN ====================
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-healing-100 dark:bg-healing-900/30 flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-10 h-10 text-healing-500" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">تیکت شما با موفقیت ثبت شد!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                پاسخ تیکت شما از طریق پیامک و اعلان سامانه اطلاع‌رسانی می‌شود.
              </p>
            </div>

            {/* Tracking Code */}
            <div className="bg-muted rounded-xl px-4 py-3 flex items-center justify-center gap-2">
              <Ticket className="w-4 h-4 text-trust-500" />
              <span className="text-xs text-muted-foreground">کد پیگیری:</span>
              <span className="text-sm font-bold text-foreground" dir="ltr">
                {trackingCode}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link href="/dashboard/support">
                <Button className="w-full h-11 bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25">
                  مشاهده تیکت‌ها
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </Link>
              <Button variant="outline" onClick={handleReset} className="w-full h-11">
                ثبت تیکت جدید
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ==================== FORM ====================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/support">
          <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">ارسال تیکت جدید</h1>
          <p className="text-xs text-muted-foreground">
            مشکل یا سوال خود را برای تیم پشتیبانی مطرح کنید
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Request Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع درخواست</label>
              <div className="grid grid-cols-3 gap-2">
                {requestTypes.map((rt) => {
                  const Icon = rt.icon;
                  const isActive = type === rt.id;
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => setType(rt.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all",
                        isActive
                          ? cn(rt.activeBorder, rt.activeBg)
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? rt.activeText : "text-muted-foreground")} />
                      <span className={cn("text-xs font-bold", isActive ? rt.activeText : "text-foreground")}>
                        {rt.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {rt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">موضوع</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="موضوع تیکت را بنویسید..."
                  className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">دسته‌بندی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مشکل یا سوال خود را با جزئیات کامل بنویسید (حداقل ۲۰ کاراکتر)..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm resize-none transition-all"
              />
              <p className="text-[10px] text-muted-foreground text-left" dir="ltr">
                {description.length} / 20
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white font-semibold shadow-lg shadow-trust-500/25"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>ثبت تیکت</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={null}>
      <NewTicketForm />
    </Suspense>
  );
}