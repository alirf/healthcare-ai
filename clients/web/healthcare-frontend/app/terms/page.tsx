"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scale,
  Stethoscope,
  ArrowRight,
  ScrollText,
  UserCheck,
  Video,
  CalendarX,
  Wallet,
  Pill,
  AlertTriangle,
  Copyright,
  ShieldAlert,
  UserX,
  RefreshCw,
  PhoneCall,
  ChevronLeft,
  CalendarDays,
  CheckCircle2,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ==================== SECTIONS DATA ====================

const sections = [
  { id: "intro", title: "پذیرش قوانین", icon: ScrollText, color: "text-trust-500" },
  { id: "eligibility", title: "شرایط حساب کاربری", icon: UserCheck, color: "text-sky-500" },
  { id: "visit", title: "ویزیت آنلاین", icon: Video, color: "text-healing-500" },
  { id: "cancel", title: "نوبت‌ها و لغو ویزیت", icon: CalendarX, color: "text-amber-500" },
  { id: "payment", title: "پرداخت و بازگشت وجه", icon: Wallet, color: "text-emerald-500" },
  { id: "pharmacy", title: "داروخانه و سفارش دارو", icon: Pill, color: "text-violet-500" },
  { id: "user-duties", title: "مسئولیت‌های کاربر", icon: AlertTriangle, color: "text-orange-500" },
  { id: "ip", title: "مالکیت معنوی", icon: Copyright, color: "text-fuchsia-500" },
  { id: "liability", title: "محدودیت مسئولیت", icon: ShieldAlert, color: "text-red-500" },
  { id: "suspension", title: "فسخ و تعلیق حساب", icon: UserX, color: "text-rose-500" },
  { id: "changes", title: "تغییرات قوانین", icon: RefreshCw, color: "text-teal-500" },
  { id: "contact", title: "حل اختلاف و تماس", icon: PhoneCall, color: "text-indigo-500" },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll Spy
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-trust-50/50 via-background to-healing-50/50 dark:from-trust-900/5 dark:via-background dark:to-healing-900/5">
      {/* ===== Top Bar ===== */}
      <header className="sticky top-0 z-40 h-[60px] bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-md">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-bold bg-gradient-to-r from-trust-600 to-healing-600 bg-clip-text text-transparent">
              سلامت هوشمند
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] text-muted-foreground hidden sm:flex">
              <CalendarDays className="w-3 h-3 ml-1" />
              آخرین بروزرسانی: شهریور ۱۴۰۵
            </Badge>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                بازگشت
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-l from-trust-500 to-healing-500"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-14 flex flex-col sm:flex-row items-center gap-6">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
            className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0"
          >
            <Scale className="w-10 h-10 text-white" />
          </motion.div>
          <div className="text-center sm:text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-white">قوانین و شرایط استفاده</h1>
            <p className="text-sm text-white/80 mt-2 max-w-2xl leading-relaxed">
              با استفاده از سامانه سلامت هوشمند، شما این قوانین را می‌پذیرید. لطفاً
              پیش از استفاده از خدمات، این صفحه را با دقت مطالعه کنید.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ===== Content ===== */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ---- TOC Sidebar ---- */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <Card className="overflow-hidden">
                <CardContent className="p-3">
                  <p className="text-xs font-bold text-foreground px-2 py-2">فهرست موضوعات</p>
                  <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => scrollTo(section.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-right text-xs font-medium transition-all",
                            isActive
                              ? "bg-trust-500 text-white shadow-md shadow-trust-500/20"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : section.color)} />
                          <span className="truncate">{section.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ---- Sections ---- */}
          <div className="lg:col-span-3 space-y-6">
            {/* ============ 1. پذیرش قوانین ============ */}
            <motion.section
              id="intro"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<ScrollText className="w-5 h-5 text-trust-500" />} title="پذیرش قوانین" />
                  <p className="text-sm text-muted-foreground leading-7">
                    این قوانین، قراردادی میان شما (&quot;کاربر&quot;) و سلامت هوشمند
                    (&quot;سامانه&quot;) است. با ثبت‌نام، ورود یا استفاده از هر یک از
                    خدمات سامانه (ویزیت آنلاین، گفتگو با پزشک، پرونده پزشکی،
                    داروخانه آنلاین و سایر خدمات)، شما پذیرش کامل این قوانین را
                    اعلام می‌کنید.
                  </p>
                  <p className="text-sm text-muted-foreground leading-7">
                    در صورت عدم پذیرش هر بخش از این قوانین، لطفاً از استفاده از
                    سامانه خودداری کنید. این قوانین مکمل{" "}
                    <Link href="/privacy" className="text-trust-500 hover:text-trust-600 font-medium">
                      سیاست حریم خصوصی
                    </Link>{" "}
                    است که به‌صورت جداگانه منتشر شده است.
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 2. شرایط حساب کاربری ============ */}
            <motion.section
              id="eligibility"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<UserCheck className="w-5 h-5 text-sky-500" />} title="شرایط حساب کاربری" />
                  <ul className="space-y-2.5">
                    {[
                      "حداقل سن استفاده از سامانه ۱۸ سال تمام است؛ افراد زیر ۱۸ سال فقط با حساب ولی (والدین) مجاز به استفاده هستند",
                      "مسئولیت صحت شماره موبایل و ایمیل ثبت‌شده بر عهده کاربر است؛ کدهای تأیید تنها به این شماره ارسال می‌شود",
                      "هر کاربر مجاز به داشتن یک حساب کاربری واقعی است؛ ایجاد حساب‌های جعلی، متعدد یا با اطلاعات غیرواقعی ممنوع است",
                      "حفظ امنیت رمز عبور بر عهده کاربر است و سامانه هرگز رمز عبور شما را نمی‌پرسد",
                      "انتقال یا فروش حساب کاربری به شخص دیگر ممنوع است",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 3. ویزیت آنلاین ============ */}
            <motion.section
              id="visit"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<Video className="w-5 h-5 text-healing-500" />} title="ویزیت آنلاین و محدودیت‌های پزشکی" />
                  <p className="text-sm text-muted-foreground leading-7">
                    سامانه سلامت هوشمند یک پلتفرم ارتباطی میان بیمار و پزشک است و
                    تحلیل‌های هوش مصنوعی صرفاً جنبه کمکی دارند:
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "تحلیل AI جایگزین معاینه بالینی، تشخیص و نظر پزشک نیست",
                      "در موارد اورژانسی (درد قفسه سینه شدید، افت هوشیاری، خونریزی و...) بلافاصله با اورژانس (۱۱۵) تماس بگیرید؛ سامانه برای موارد اورژانسی طراحی نشده است",
                      "ارائه اطلاعات ناقص یا نادرست توسط کاربر، مسئولیت عواقب آن را بر عهده کاربر می‌گذارد",
                      "نسخه صادرشده در ویزیت آنلاین معتبر است، اما پزشک پس از معاینه حضوری می‌تواند آن را تغییر دهد",
                      "در ویزیت متنی، پاسخ پزشک معمولاً ظرف چند ساعت و در ساعات کاری ارائه می‌شود",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <ChevronLeft className="w-4 h-4 text-healing-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl p-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-400 leading-6">
                      سلامت هوشمند یک نهاد درمانی با پزشکان مسئول مستقل است؛
                      مسئولیت نهایی تشخیص و درمان طبق قانون پزشکی بر عهده پزشک
                      معالج می‌باشد.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 4. نوبت‌ها و لغو ============ */}
            <motion.section
              id="cancel"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<CalendarX className="w-5 h-5 text-amber-500" />} title="نوبت‌ها و لغو ویزیت" />
                  <ul className="space-y-2.5">
                    {[
                      "لغو نوبت تا ۲ ساعت قبل از زمان ویزیت، بدون کسر هزینه انجام می‌شود",
                      "عدم حضور در زمان ویزیت (No-Show) به منزله انجام خدمت تلقی و هزینه آن قابل بازگشت نیست",
                      "اگر پزشک نوبت را لغو کند، مبلغ کامل ظرف ۲۴ تا ۷۲ ساعت به کیف پول شما بازگردانده می‌شود",
                      "زمان پاسخگویی پزشک در ویزیت متنی بسته به تخصص و ساعت کاری متفاوت است",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 5. پرداخت ============ */}
            <motion.section
              id="payment"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<Wallet className="w-5 h-5 text-emerald-500" />} title="پرداخت، کیف پول و بازگشت وجه" />
                  <ul className="space-y-2.5">
                    {[
                      "کلیه پرداخت‌ها از طریق درگاه‌های رسمی بانکی و کیف پول داخلی سامانه انجام می‌شود",
                      "هزینه ویزیت پیش از شروع، به‌صورت شفاف نمایش داده می‌شود و پرداخت به منزله پذیرش آن است",
                      "موجودی کیف پول قابل برداشت نقدی نیست و صرفاً برای خدمات سامانه قابل استفاده است",
                      "بازگشت وجه به کیف پول حداکثر تا ۷۲ ساعت و به حساب بانکی تا ۷ روز کاری انجام می‌شود",
                      "در صورت مغایرت مالی، از بخش «تراکنش‌ها» یا تیکت پشتیبانی پیگیری کنید",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 6. داروخانه ============ */}
            <motion.section
              id="pharmacy"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<Pill className="w-5 h-5 text-violet-500" />} title="داروخانه و سفارش دارو" />
                  <ul className="space-y-2.5">
                    {[
                      "فروش داروهای بدون نسخه (OTC) بدون نیاز به مدرک انجام می‌شود",
                      "داروهای نسخه‌ای صرفاً با ارائه نسخه معتبر الکترونیک یا تصویر نسخه پزشک عرضه می‌شوند",
                      "داروسخانه مجاز دارای مجوز از سازمان غذا و دارو، سفارش‌ها را بررسی و ارسال می‌کند",
                      "ارسال در تهران و شهرهای تحت پوشش طبق بازه اعلام‌شده انجام می‌شود؛ تأخیر در شرایط خاص (ترافیک، هواشناسی) خارج از مسئولیت سامانه است",
                      "داروهای یخچالی با رعایت زنجیره سرد ارسال می‌شوند",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <ChevronLeft className="w-4 h-4 text-violet-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 7. مسئولیت‌های کاربر ============ */}
            <motion.section
              id="user-duties"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} title="مسئولیت‌های کاربر" />
                  <p className="text-sm text-muted-foreground leading-7">کاربر متعهد می‌شود:</p>
                  <ul className="space-y-2.5">
                    {[
                      "اطلاعات هویتی و پزشکی صحیح و به‌روز ارائه دهد",
                      "از سامانه برای اهداف غیرقانونی، مزاحمت برای پزشکان یا سایر کاربران استفاده نکند",
                      "محتوای نامناسب، توهین‌آمیز یا خلاف عفت عمومی در چت‌ها بارگذاری نکند",
                      "به سیستم‌های سامانه آسیب نرساند یا تلاش برای نفوذ، خرابکاری یا استخراج داده نکند",
                      "داروهای تجویزشده را صرفاً طبق دستور پزشک مصرف کند و خوددرمانی نکند",
                      "در صورت بروز عارضه پس از مصرف دارو، به پزشک یا داروسخانه اطلاع دهد",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 8. مالکیت معنوی ============ */}
            <motion.section
              id="ip"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<Copyright className="w-5 h-5 text-fuchsia-500" />} title="مالکیت معنوی" />
                  <p className="text-sm text-muted-foreground leading-7">
                    کلیه حقوق مالکیت معنوی سامانه شامل نام تجاری «سلامت هوشمند»،
                    لوگو، طراحی رابط کاربری، کد، مدل‌های هوش مصنوعی و محتوای
                    آموزشی متعلق به سلامت هوشمند است. کپی‌برداری، بازتولید یا
                    استفاده تجاری بدون کسب مجوز کتبی ممنوع است.
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 9. محدودیت مسئولیت ============ */}
            <motion.section
              id="liability"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<ShieldAlert className="w-5 h-5 text-red-500" />} title="محدودیت مسئولیت سامانه" />
                  <ul className="space-y-2.5">
                    {[
                      "سامانه در نقش واسطه فناوری عمل می‌کند و مسئولیت تشخیص، تجویز و درمان بر عهده پزشک دارای پروانه مطب است",
                      "سامانه در قبال تصمیمات خودسرانه کاربر در مصرف دارو یا عدم مراجعه حضومی به‌موقع مسئولیتی ندارد",
                      "خدمات ممکن است به‌طور مقطعی به دلیل نگهداری یا اختلال زیرساخت از دسترس خارج شود؛ سامانه تلاش می‌کند اختلال‌ها به حداقل برسد",
                      "مسئولیت صحت اطلاعات واردشده توسط کاربر، بر عهده خود کاربر است",
                      "حداکثر مسئولیت مالی سامانه در هر claims، معادل مبلغ همان تراکنش است",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <ChevronLeft className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 10. فسخ و تعلیق ============ */}
            <motion.section
              id="suspension"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<UserX className="w-5 h-5 text-rose-500" />} title="فسخ حساب و تعلیق دسترسی" />
                  <p className="text-sm text-muted-foreground leading-7">
                    سامانه می‌تواند در موارد زیر بدون اطلاع قبلی، حساب کاربری را
                    تعلیق یا فسخ کند:
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "ثبت اطلاعات جعلی یا انتحال هویت",
                      "سوءاستفاده از پزشکان، داروسخانه یا سایر کاربران",
                      "تلاش برای نفوذ، خرابکاری یا دور زدن مکانیزم‌های امنیتی",
                      "سوءاستفاده مالی از درگاه پرداخت یا کیف پول",
                      "تکرار تخلف پس از اخطار",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground leading-7">
                    کاربر نیز می‌تواند هر زمان از بخش تنظیمات، درخواست حذف حساب
                    خود را ثبت کند. حذف حساب، منجر به غیرقابل دسترس شدن پرونده
                    پزشکی طبق ضوابط نگهداری سوابق پزشکی می‌شود.
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 11. تغییرات قوانین ============ */}
            <motion.section
              id="changes"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<RefreshCw className="w-5 h-5 text-teal-500" />} title="تغییرات قوانین" />
                  <p className="text-sm text-muted-foreground leading-7">
                    سلامت هوشمند حق بروزرسانی این قوانین را در هر زمان دارد.
                    تغییرات مهم از طریق اعلان داخل سامانه، پیامک یا ایمیل به
                    اطلاع کاربران می‌رسد. ادامه استفاده از سامانه پس از
                    بروزرسانی، به منزله پذیرش نسخه جدید است. تاریخ آخرین
                    بروزرسانی همیشه در بالای همین صفحه درج می‌شود.
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 12. حل اختلاف و تماس ============ */}
            <motion.section
              id="contact"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card className="border-trust-200 dark:border-trust-800/30">
                <CardContent className="p-6 space-y-4">
                  <SectionHeader icon={<Gavel className="w-5 h-5 text-indigo-500" />} title="حل اختلاف و تماس با ما" />
                  <p className="text-sm text-muted-foreground leading-7">
                    هرگونه اختلاف میان کاربر و سامانه در مرحله نخست از طریق
                    مذاکره با پشتیبانی حل‌وفصل می‌شود. در صورت عدم توافق، مرجع
                    رسیدگی، مراجع قضایی صالح جمهوری اسلامی ایران هستند. برای
                    طرح سؤال درباره این قوانین با ما در تماس باشید:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-4 h-4 text-trust-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">تلفن پشتیبانی</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">۰۲۱-۹۱۰۰۸۸۰۰</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <ScrollText className="w-4 h-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">ایمیل قوانین</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">legal@salamat.ir</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/dashboard/support">
                    <Button
                      size="sm"
                      className="h-9 text-xs bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white"
                    >
                      ارسال تیکت به پشتیبانی
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.section>
          </div>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border bg-card/50 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">
              © ۱۴۰۵ سلامت هوشمند — تمامی حقوق محفوظ است
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            آخرین بروزرسانی قوانین: شهریور ۱۴۰۵
          </p>
        </div>
      </footer>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-border">
      {icon}
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
  );
}