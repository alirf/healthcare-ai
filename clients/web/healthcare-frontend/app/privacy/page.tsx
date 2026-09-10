"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Database,
  Brain,
  Share2,
  Lock,
  Cookie,
  UserCheck,
  PhoneCall,
  ChevronLeft,
  CalendarDays,
  Eye,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ==================== SECTIONS DATA ====================

const sections = [
  {
    id: "intro",
    title: "مقدمه",
    icon: FileText,
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
  },
  {
    id: "data-collection",
    title: "اطلاعاتی که جمع‌آوری می‌کنیم",
    icon: Database,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    id: "data-usage",
    title: "نحوه استفاده از اطلاعات",
    icon: Eye,
    color: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
  },
  {
    id: "ai-analysis",
    title: "تحلیل هوش مصنوعی",
    icon: Brain,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-50 dark:bg-fuchsia-900/20",
  },
  {
    id: "sharing",
    title: "اشتراک‌گذاری اطلاعات",
    icon: Share2,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    id: "security",
    title: "امنیت و نگهداری داده‌ها",
    icon: Lock,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    id: "cookies",
    title: "کوکی‌ها و داده‌های ناوبری",
    icon: Cookie,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    id: "rights",
    title: "حقوق شما",
    icon: UserCheck,
    color: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-900/20",
  },
  {
    id: "contact",
    title: "تماس با ما",
    icon: PhoneCall,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll Spy — تشخیص بخش فعال هنگام اسکرول
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
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
            <ShieldCheck className="w-10 h-10 text-white" />
          </motion.div>
          <div className="text-center sm:text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-white">حریم خصوصی</h1>
            <p className="text-sm text-white/80 mt-2 max-w-2xl leading-relaxed">
              حفاظت از اطلاعات شخصی و پزشکی شما برای ما اولویت اول است. در این
              صفحه نحوه جمع‌آوری، استفاده، نگهداری و محافظت از داده‌های شما را
              شفاف توضیح می‌دهیم.
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
                  <nav className="space-y-0.5">
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
            {/* ============ 1. مقدمه ============ */}
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
                  <SectionHeader
                    icon={<FileText className="w-5 h-5 text-trust-500" />}
                    title="مقدمه"
                  />
                  <p className="text-sm text-muted-foreground leading-7">
                    سلامت هوشمند (&quot;ما&quot;، &quot;سامانه&quot;) یک پلتفرم ویزیت آنلاین پزشکی است که
                    خدماتی مانند ویزیت هوشمند، گفتگو با پزشک، پرونده پزشکی دیجیتال و
                    داروخانه آنلاین را ارائه می‌دهد. با استفاده از این سامانه، شما
                    (&quot;کاربر&quot;) به شرایط این سیاست حریم خصوصی پایبند هستید.
                  </p>
                  <p className="text-sm text-muted-foreground leading-7">
                    ما متعهد به حفاظت از داده‌های شخصی و حساس پزشکی شما طبق قوانین
                    جمهوری اسلامی ایران و استانداردهای بین‌المللی حفاظت از داده
                    (از جمله GDPR به‌عنوان مرجع) هستیم. این سیاست ممکن است بروزرسانی
                    شود و آخرین نسخه همیشه در همین صفحه در دسترس خواهد بود.
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 2. اطلاعاتی که جمع‌آوری می‌کنیم ============ */}
            <motion.section
              id="data-collection"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader
                    icon={<Database className="w-5 h-5 text-violet-500" />}
                    title="اطلاعاتی که جمع‌آوری می‌کنیم"
                  />

                  <InfoBlock title="اطلاعات هویتی و تماس">
                    شماره موبایل، ایمیل، رمز عبور (به‌صورت رمزنگاری‌شده) و نقش
                    کاربری (بیمار/پزشک) هنگام ثبت‌نام و ورود.
                  </InfoBlock>

                  <InfoBlock title="اطلاعات پزشکی و سلامت">
                    شرح حال و پیام‌های متنی شما در ویزیت هوشمند، علائم ثبت‌شده
                    (نوع علامت، شدت، ناحیه بدن، مدت)، نسخه‌ها، آزمایش‌ها، تصاویر
                    پزشکی و سوابق ویزیت.
                  </InfoBlock>

                  <InfoBlock title="اطلاعات مالی">
                    سوابق تراکنش‌ها و کیف پول داخلی. اطلاعات کارت بانکی شما
                    تنها در درگاه پرداخت بانکی پردازش می‌شود و هرگز در سرورهای
                    ما ذخیره نمی‌شود.
                  </InfoBlock>

                  <InfoBlock title="اطلاعات فنی و ناوبری">
                    آدرس IP، نوع دستگاه و مرورگر، نسخه سیستم‌عامل و نحوه
                    استفاده از سامانه — صرفاً برای بهبود عملکرد و امنیت.
                  </InfoBlock>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 3. نحوه استفاده ============ */}
            <motion.section
              id="data-usage"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader
                    icon={<Eye className="w-5 h-5 text-healing-500" />}
                    title="نحوه استفاده از اطلاعات شما"
                  />
                  <ul className="space-y-2.5">
                    {[
                      "ارائه خدمات ویزیت آنلاین، گفتگو با پزشک و نسخه‌پیچی",
                      "تحلیل علائم و آماده‌سازی شرح حال برای پزشک متخصص",
                      "مدیریت پرونده پزشکی دیجیتال و سوابق شما",
                      "پردازش سفارش دارو و ارسال به آدرس ثبت‌شده",
                      "ارسال کدهای تأیید، اعلان‌های ویزیت و پاسخ تیکت‌های پشتیبانی",
                      "بهبود کیفیت خدمات و تجربه کاربری از طریق تحلیل آماری ناشناس",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-healing-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-6">
                      داده‌های پزشکی شما هرگز برای تبلیغات، فروش به اشخاص ثالث
                      یا اهداف غیردرمانی استفاده نمی‌شود.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 4. هوش مصنوعی ============ */}
            <motion.section
              id="ai-analysis"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader
                    icon={<Brain className="w-5 h-5 text-fuchsia-500" />}
                    title="تحلیل هوش مصنوعی"
                  />
                  <p className="text-sm text-muted-foreground leading-7">
                    پیام‌های متنی شما در ویزیت هوشمند با استفاده از مدل‌های پردازش
                    زبان فارسی (از جمله ParsBERT) تحلیل می‌شوند تا علائم پزشکی
                    استخراج و شرح حال ساختاریافته‌ای برای پزشک آماده شود.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "تحلیل AI صرفاً جنبه کمکی دارد و جایگزین تشخیص پزشک نیست",
                      "خروجی AI همیشه توسط پزشک متخصص بازبینی و تأیید می‌شود",
                      "متن شما برای آموزش مدل‌ها بدون رضایت صریح استفاده نمی‌شود؛ در صورت استفاده، اطلاعات هویتی به‌صورت کامل ناشناس‌سازی می‌شود",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-fuchsia-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 5. اشتراک‌گذاری ============ */}
            <motion.section
              id="sharing"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader
                    icon={<Share2 className="w-5 h-5 text-amber-500" />}
                    title="اشتراک‌گذاری اطلاعات"
                  />
                  <p className="text-sm text-muted-foreground leading-7">
                    اطلاعات شما تنها در موارد زیر و به حداقل داده ممکن (Data
                    Minimization) به اشتراک گذاشته می‌شود:
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "پزشک معالج شما — علائم و شرح حال مربوط به همان ویزیت",
                      "داروخانه طرف قرارداد — تنها نسخه و آدرس ارسال",
                      "مراجع قانونی — فقط در صورت درخواست کتبی مراجع ذی‌صلاح قضایی",
                      "داده‌های آماری ناشناس — بدون هیچ گونه شناسه شخصی",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <ChevronLeft className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 6. امنیت ============ */}
            <motion.section
              id="security"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader
                    icon={<Lock className="w-5 h-5 text-emerald-500" />}
                    title="امنیت و نگهداری داده‌ها"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: "رمزنگاری توکن‌ها", desc: "احراز هویت با الگوریتم RS256 و توکن‌های کوتاه‌مدت" },
                      { title: "جداسازی داده‌ها", desc: "معماری Database-per-Service؛ هر سرویس دیتابیس اختصاصی خود را دارد" },
                      { title: "فایل‌های رمزنگاری‌شده", desc: "تصاویر و مدارک پزشکی در فضای ذخیره‌سازی امن (MinIO) نگهداری می‌شوند" },
                      { title: "کنترل دسترسی", desc: "دسترسی نقش‌محور (RBAC) — هر کاربر تنها به داده‌های مجاز خود دسترسی دارد" },
                      { title: "مسدودسازی نرخ درخواست", desc: "Rate Limiting روی Gateway برای جلوگیری از حملات brute-force" },
                      { title: "ثبت و پایش رخدادها", desc: "لاگ‌گیری کامل درخواست‌ها برای تشخیص و جلوگیری از دسترسی غیرمجاز" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30"
                      >
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-500" />
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-5">
                          {item.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 7. کوکی‌ها ============ */}
            <motion.section
              id="cookies"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader
                    icon={<Cookie className="w-5 h-5 text-orange-500" />}
                    title="کوکی‌ها و داده‌های ناوبری"
                  />
                  <p className="text-sm text-muted-foreground leading-7">
                    از کوکی‌ها صرفاً برای موارد ضروری استفاده می‌کنیم:
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "توکن احراز هویت (access token) برای حفظ نشست ورود شما",
                      "ترجیحات ظاهری مانند حالت تاریک/روشن",
                      "وضعیت رابط کاربری مانند باز/بسته بودن منوی کناری",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-6">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground leading-7">
                    ما از کوکی‌های تبلیغاتی یا ردیابی اشخاص ثالث استفاده
                    نمی‌کنیم.
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 8. حقوق شما ============ */}
            <motion.section
              id="rights"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionHeader
                    icon={<UserCheck className="w-5 h-5 text-sky-500" />}
                    title="حقوق شما"
                  />
                  <p className="text-sm text-muted-foreground leading-7">
                    طبق قوانین حمایت از داده‌های شخصی، شما حق دارید:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: "دسترسی", desc: "دریافت کپی از اطلاعات شخصی و پزشکی خود" },
                      { title: "اصلاح", desc: "به‌روزرسانی اطلاعات ناقص یا نادرست از بخش پروفایل" },
                      { title: "حذف", desc: "درخواست حذف حساب کاربری و داده‌های مرتبط با آن" },
                      { title: "اعتراض", desc: "اعتراض به پردازش داده‌ها و ثبت شکایت از طریق پشتیبانی" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4 text-sky-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-5">
                            {item.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-7">
                    برای اعمال هر یک از این حقوق، از بخش تنظیمات حساب کاربری یا
                    تیکت پشتیبانی اقدام کنید. درخواست‌های حذف حساب حداکثر ظرف
                    ۱۵ روز کاری پردازش می‌شود.
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* ============ 9. تماس ============ */}
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
                  <SectionHeader
                    icon={<PhoneCall className="w-5 h-5 text-rose-500" />}
                    title="تماس با ما"
                  />
                  <p className="text-sm text-muted-foreground leading-7">
                    درباره این سیاست یا نحوه پردازش داده‌های خود سؤالی دارید؟ تیم
                    حریم خصوصی ما پاسخگوی شماست:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-4 h-4 text-trust-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">تلفن پشتیبانی</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">
                          ۰۲۱-۹۱۰۰۸۸۰۰
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">ایمیل حریم خصوصی</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">
                          privacy@salamat.ir
                        </p>
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
            آخرین بروزرسانی سیاست: شهریور ۱۴۰۵
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

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
      <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <CheckCircle2 className="w-4 h-4 text-trust-500" />
        {title}
      </p>
      <p className="text-xs text-muted-foreground leading-6 mt-1.5">{children}</p>
    </div>
  );
}