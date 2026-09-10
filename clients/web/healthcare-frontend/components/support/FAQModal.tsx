"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/types/support";

const faqItems: FAQItem[] = [
  {
    id: "f1",
    question: "چگونه ویزیت آنلاین رزرو کنم؟",
    answer:
      "از منوی «ویزیت هوشمند» وارد شوید، علائم خود را شرح دهید و پس از تحلیل هوش مصنوعی، ویزیت شما به پزشک متخصص ارجاع داده می‌شود. همچنین می‌توانید از بخش «نوبت‌ها» پزشک مورد نظر خود را انتخاب کنید.",
  },
  {
    id: "f2",
    question: "کد تأیید (OTP) دریافت نمی‌کنم، چه کنم؟",
    answer:
      "ابتدا از صحیح بودن شماره موبایل اطمینان حاصل کنید. در صورت عدم دریافت کد پس از ۶۰ ثانیه، دکمه «ارسال مجدد» را بزنید. اگر مشکل همچنان وجود داشت، با پشتیبانی تماس بگیرید.",
  },
  {
    id: "f3",
    question: "هزینه ویزیت چقدر است و چگونه پرداخت کنم؟",
    answer:
      "هزینه ویزیت بسته به تخصص پزشک متفاوت است و قبل از شروع ویزیت به شما نمایش داده می‌شود. پرداخت از طریق کیف پول داخلی یا درگاه بانکی انجام می‌شود.",
  },
  {
    id: "f4",
    question: "چگونه نتایج آزمایش خود را در پرونده ثبت کنم؟",
    answer:
      "از بخش «پرونده پزشکی» روی «پرونده جدید» کلیک کنید، نوع «آزمایش» را انتخاب و فایل تصویر یا PDF را بارگذاری کنید. نتایج پس از بررسی در پرونده شما ثبت می‌شود.",
  },
  {
    id: "f5",
    question: "آیا امکان لغو نوبت ویزیت وجود دارد؟",
    answer:
      "بله، تا ۲ ساعت قبل از زمان ویزیت می‌توانید از بخش «نوبت‌ها» نوبت خود را لغو کنید. مبلغ پرداختی ظرف ۲۴ تا ۷۲ ساعت به کیف پول شما برگردانده می‌شود.",
  },
  {
    id: "f6",
    question: "چگونه سفارش دارو را پیگیری کنم؟",
    answer:
      "وضعیت سفارش شما در بخش «تراکنش‌ها» و «فعالیت‌های اخیر» داشبورد قابل مشاهده است. پس از ارسال، کد پیگیری مرسوله نیز برای شما پیامک می‌شود.",
  },
  {
    id: "f7",
    question: "چگونه رمز عبور خود را تغییر دهم؟",
    answer:
      "از صفحه ورود گزینه «رمز عبور را فراموش کردم» را بزنید و با دریافت کد تأیید پیامکی، رمز جدید تعیین کنید. برای تغییر رمز در حالت لاگین از «تنظیمات ← امنیت» اقدام کنید.",
  },
];

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const [openId, setOpenId] = useState<string | null>(faqItems[0].id);
  const [search, setSearch] = useState("");

  const filtered = search
    ? faqItems.filter((f) => f.question.includes(search) || f.answer.includes(search))
    : faqItems;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-2xl max-h-[80vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-md shadow-trust-500/20">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">سوالات متداول</h3>
                  <p className="text-xs text-muted-foreground">پاسخ پرتکرارترین سوالات کاربران</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="جستجو در سوالات..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm"
                />
              </div>
            </div>

            {/* FAQ List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filtered.length === 0 && (
                <div className="text-center py-10">
                  <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">سوال مورد نظر یافت نشد</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    می‌توانید از بخش «پرسش جدید» سوال خود را مطرح کنید
                  </p>
                </div>
              )}

              {filtered.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={cn(
                      "border rounded-xl overflow-hidden transition-colors",
                      isOpen
                        ? "border-trust-200 dark:border-trust-800 bg-trust-50/50 dark:bg-trust-900/10"
                        : "border-border"
                    )}
                  >
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-right"
                    >
                      <span className="text-sm font-semibold text-foreground">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
                          isOpen && "rotate-180 text-trust-500"
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">پاسخ خود را پیدا نکردید؟</p>
              <Link href="/dashboard/support/new-ticket?type=question" onClick={onClose}>
                <Button
                  size="sm"
                  className="h-9 text-xs bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white"
                >
                  مطرح کردن پرسش جدید
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}