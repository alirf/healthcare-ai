"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Headset,
    Phone,
    Mail,
    Send,
    MessageCircle,
    Clock,
    ChevronLeft,
    Eye,
    HelpCircle,
    AlertTriangle,
    MessageCirclePlus,
    CalendarDays,
    Ticket,
    Inbox,
    CheckCircle2,
    Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { SupportTicket, TicketStatus } from "@/types/support";
import FAQModal from "@/components/support/FAQModal";
import TicketDetailModal from "@/components/support/TicketDetailModal";

// ==================== MOCK DATA ====================

const mockTickets: SupportTicket[] = [
    {
        id: "t1",
        subject: "عدم نمایش نتیجه آزمایش در پرونده پزشکی",
        trackingCode: "TKT-1042",
        category: "گزارش مشکل",
        date: "2026-09-09T10:30:00Z",
        status: "in_progress",
        lastMessage: "مشکل شما در حال بررسی توسط تیم فنی است.",
    },
    {
        id: "t2",
        subject: "سوال درباره نحوه مصرف داروی تجویزی",
        trackingCode: "TKT-1038",
        category: "پرسش جدید",
        date: "2026-09-07T08:15:00Z",
        status: "answered",
        lastMessage: "لطفاً دارو را همراه غذا و روزی یک بار مصرف کنید.",
    },
    {
        id: "t3",
        subject: "عدم دریافت کد تأیید پیامکی",
        trackingCode: "TKT-1029",
        category: "گزارش مشکل",
        date: "2026-08-30T12:00:00Z",
        status: "closed",
        lastMessage: "مشکل ارسال پیامک برطرف شد. با تشکر از صبوری شما.",
    },
];

const statusConfig: Record<
    TicketStatus,
    { label: string; icon: typeof Clock; badge: string }
> = {
    open: {
        label: "باز",
        icon: Clock,
        badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    in_progress: {
        label: "در حال بررسی",
        icon: Loader,
        badge: "bg-trust-500/10 text-trust-600 border-trust-500/20",
    },
    answered: {
        label: "پاسخ داده شده",
        icon: CheckCircle2,
        badge: "bg-healing-500/10 text-healing-600 border-healing-500/20",
    },
    closed: {
        label: "بسته شده",
        icon: CheckCircle2,
        badge: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    },
};

const contactMethods = [
    {
        id: "phone",
        label: "تلفن پشتیبانی",
        value: "021-91008800",
        display: "۰۲۱-۹۱۰۰۸۸۰۰",
        icon: Phone,
        color: "text-trust-500",
        bgColor: "bg-trust-50 dark:bg-trust-900/20",
        borderColor: "border-trust-200 dark:border-trust-800",
    },
    {
        id: "email",
        label: "ایمیل",
        value: "support@salamat.ir",
        display: "support@salamat.ir",
        icon: Mail,
        color: "text-violet-500",
        bgColor: "bg-violet-50 dark:bg-violet-900/20",
        borderColor: "border-violet-200 dark:border-violet-800",
    },
    {
        id: "telegram",
        label: "تلگرام",
        value: "@salamat_support",
        display: "@salamat_support",
        icon: Send,
        color: "text-sky-500",
        bgColor: "bg-sky-50 dark:bg-sky-900/20",
        borderColor: "border-sky-200 dark:border-sky-800",
    },
    {
        id: "bale",
        label: "پیام‌رسان بله",
        value: "@salamat",
        display: "@salamat",
        icon: MessageCircle,
        color: "text-healing-500",
        bgColor: "bg-healing-50 dark:bg-healing-900/20",
        borderColor: "border-healing-200 dark:border-healing-800",
    },
];

// ==================== PAGE ====================

export default function SupportPage() {
    const [faqOpen, setFaqOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* ===== HERO ===== */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-trust-500 to-healing-500 shadow-lg"
            >
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 px-6 md:px-10 py-10">
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0"
                    >
                        <Headset className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </motion.div>

                    <div className="text-center sm:text-right space-y-2">
                        <h1 className="text-xl md:text-2xl font-bold text-white">
                            ما اینجا هستیم تا به شما کمک کنیم
                        </h1>
                        <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                            در صورت بروز هرگونه مشکل در استفاده از خدمات سلامت هوشمند یا داشتن هر
                            سوالی، تیم پشتیبانی ما در سریع‌ترین زمان پاسخگوی شماست.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ===== TICKETS + ACTION BOXES ===== */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* ---- Last Tickets (2/3) ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="xl:col-span-2"
                >
                    <Card className="overflow-hidden h-full">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center">
                                        <Ticket className="w-4 h-4 text-trust-500" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-sm text-foreground">آخرین تیکت‌های شما</h2>
                                        <p className="text-xs text-muted-foreground">
                                            {mockTickets.length.toLocaleString("fa-IR")} تیکت ثبت شده
                                        </p>
                                    </div>
                                </div>
                                <Link href="/dashboard/support/new-ticket">
                                    <Button
                                        size="sm"
                                        className="h-9 text-xs bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-md shadow-trust-500/20"
                                    >
                                        <MessageCirclePlus className="w-3.5 h-3.5 ml-1" />
                                        تیکت جدید
                                    </Button>
                                </Link>
                            </div>

                            {/* Ticket List */}
                            <div className="space-y-2">
                                {mockTickets.map((ticket, index) => {
                                    const status = statusConfig[ticket.status];
                                    const StatusIcon = status.icon;
                                    return (
                                        <motion.div
                                            key={ticket.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border hover:border-trust-200 dark:hover:border-trust-800 hover:bg-muted/40 transition-all"
                                        >
                                            {/* Icon */}
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

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-foreground truncate">
                                                    {ticket.subject}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <Ticket className="w-3 h-3" />
                                                        <span dir="ltr">{ticket.trackingCode}</span>
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {formatRelativeTime(ticket.date)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate mt-1">
                                                    {ticket.lastMessage}
                                                </p>
                                            </div>

                                            {/* Status + Action */}
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] gap-1", status.badge)}
                                                >
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedTicket(ticket)}
                                                    className="h-8 text-xs border-trust-200 hover:bg-trust-50 hover:text-trust-600 dark:border-trust-800 dark:hover:bg-trust-900/20"
                                                >
                                                    <Eye className="w-3.5 h-3.5 ml-1" />
                                                    دیدن
                                                </Button>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {mockTickets.length === 0 && (
                                    <div className="text-center py-10">
                                        <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">هنوز تیکتی ثبت نکرده‌اید</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* ---- 4 Action Boxes (1/3) → در xl زیر هم، در موبایل ردیفی ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:grid-cols-1 content-start"
                >
                    {/* Box 1: Call */}
                    <Card className="border-trust-200 dark:border-trust-800/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-trust-50 dark:bg-trust-900/20 flex items-center justify-center">
                                <Phone className="w-5 h-5 text-trust-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">تماس با پشتیبانی</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                    مشکل فوری دارید؟ مستقیماً با ما تماس بگیرید
                                </p>
                            </div>
                            <a href="tel:02191008800" className="w-full">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-xs border-trust-200 hover:bg-trust-50 hover:text-trust-600 dark:border-trust-800 dark:hover:bg-trust-900/20"
                                >
                                    <Phone className="w-3.5 h-3.5 ml-1" />
                                    <span dir="ltr">۰۲۱-۹۱۰۰۸۸۰۰</span>
                                </Button>
                            </a>
                        </CardContent>
                    </Card>

                    {/* Box 2: FAQ */}
                    <Card className="border-healing-200 dark:border-healing-800/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-healing-50 dark:bg-healing-900/20 flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-healing-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">سوالات متداول</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                    پاسخ پرتکرارترین سوالات کاربران
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFaqOpen(true)}
                                className="w-full h-8 text-xs border-healing-200 hover:bg-healing-50 hover:text-healing-600 dark:border-healing-800 dark:hover:bg-healing-900/20"
                            >
                                <HelpCircle className="w-3.5 h-3.5 ml-1" />
                                مشاهده سوالات
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Box 3: Report Problem */}
                    <Card className="border-red-200 dark:border-red-800/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">گزارش مشکل</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                    خرابی یا خطا در سامانه را گزارش دهید
                                </p>
                            </div>
                            <Link href="/dashboard/support/new-ticket?type=problem" className="w-full">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-xs border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/20"
                                >
                                    <AlertTriangle className="w-3.5 h-3.5 ml-1" />
                                    ثبت گزارش
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Box 4: New Question */}
                    <Card className="border-violet-200 dark:border-violet-800/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                <MessageCirclePlus className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">پرسش جدید</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                    سوال خود را از تیم پشتیبانی بپرسید
                                </p>
                            </div>
                            <Link href="/dashboard/support/new-ticket?type=question" className="w-full">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-xs border-violet-200 hover:bg-violet-50 hover:text-violet-600 dark:border-violet-800 dark:hover:bg-violet-900/20"
                                >
                                    <MessageCirclePlus className="w-3.5 h-3.5 ml-1" />
                                    مطرح کردن سوال
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ===== CONTACT METHODS ===== */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center">
                                <Headset className="w-4 h-4 text-trust-500" />
                            </div>
                            <div>
                                <h2 className="font-bold text-sm text-foreground">راه‌های ارتباطی با ما</h2>
                                <p className="text-xs text-muted-foreground">از طریق any of روش‌های زیر با ما در تماس باشید</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {contactMethods.map((method, index) => {
                                const Icon = method.icon;
                                return (
                                    <motion.div
                                        key={method.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                                        className={cn(
                                            "flex flex-col items-center text-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md",
                                            method.bgColor,
                                            method.borderColor
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/70 dark:bg-white/10 flex items-center justify-center shadow-sm">
                                            <Icon className={cn("w-5 h-5", method.color)} />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">{method.label}</span>
                                        <span className="text-[11px] text-muted-foreground" dir="ltr">
                                            {method.display}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Working Hours */}
                        <div className="mt-4 flex items-center justify-center gap-2 bg-muted/60 rounded-xl px-4 py-3">
                            <Clock className="w-4 h-4 text-healing-500" />
                            <span className="text-xs text-muted-foreground">ساعات پاسخگویی:</span>
                            <span className="text-xs font-bold text-foreground">
                                همه‌روزه از ۸ صبح تا ۱۰ شب
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* FAQ Modal */}
            <FAQModal isOpen={faqOpen} onClose={() => setFaqOpen(false)} />

            {/* Ticket Detail Modal */}
            <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        </div>
    );
}