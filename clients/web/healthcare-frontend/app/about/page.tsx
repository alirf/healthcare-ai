"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Stethoscope,
  ArrowRight,
  Target,
  Eye,
  Gem,
  Users,
  CalendarDays,
  ChevronLeft,
  Brain,
  ShieldCheck,
  Clock,
  Award,
  TrendingUp,
  PhoneCall,
  Mail,
  Quote,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ==================== DATA ====================

const stats = [
  { id: "s1", value: "+۵۰٬۰۰۰", label: "ویزیت آنلاین موفق", icon: Stethoscope, color: "text-trust-500", bgColor: "bg-trust-50 dark:bg-trust-900/20" },
  { id: "s2", value: "+۲٬۵۰۰", label: "پزشک متخصص", icon: Users, color: "text-healing-500", bgColor: "bg-healing-50 dark:bg-healing-900/20" },
  { id: "s3", value: "+۱۲۰٬۰۰۰", label: "نسخه صادرشده", icon: Award, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
  { id: "s4", value: "۹۸٪", label: "رضایت کاربران", icon: TrendingUp, color: "text-violet-500", bgColor: "bg-violet-50 dark:bg-violet-900/20" },
];

const values = [
  {
    id: "v1",
    title: "سلامت، پیش از هر چیز",
    description: "تصمیمات فنی و تجاری ما همیشه با معیار «آیا به سلامت کاربر کمک می‌کند؟» سنجیده می‌شود.",
    icon: HeartPulse,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
  {
    id: "v2",
    title: "اعتماد و شفافیت",
    description: "هزینه‌ها پیش از پرداخت شفاف نمایش داده می‌شوند و داده‌های پزشکی هرگز بدون اجازه استفاده نمی‌شوند.",
    icon: ShieldCheck,
    color: "text-trust-500",
    bgColor: "bg-trust-50 dark:bg-trust-900/20",
    borderColor: "border-trust-200 dark:border-trust-800",
  },
  {
    id: "v3",
    title: "نوآوری با هوش مصنوعی",
    description: "با پردازش زبان فارسی (ParsBERT)، علائم کاربران را استخراج و شرح حال دقیق برای پزشک آماده می‌کنیم.",
    icon: Brain,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  {
    id: "v4",
    title: "دسترسی همیشگی",
    description: "ویزیت و مشاوره ۲۴ ساعته در ۷ روز هفته، بدون مرز جغرافیایی و بدون نیاز به خروج از منزل.",
    icon: Clock,
    color: "text-healing-500",
    bgColor: "bg-healing-50 dark:bg-healing-900/20",
    borderColor: "border-healing-200 dark:border-healing-800",
  },
];

const team = [
  { id: "t1", name: "دکتر سارا محمدی", role: "هم‌بنیان‌گذار و مدیر پزشکی", specialty: "متخصص داخلی", color: "from-trust-500 to-healing-500" },
  { id: "t2", name: "مهندس علی رضایی", role: "هم‌بنیان‌گذار و مدیر فنی", specialty: "معماری نرم‌افزار و AI", color: "from-violet-500 to-purple-500" },
  { id: "t3", name: "دکتر امیر حسینی", role: "مدیر محصول", specialty: "پزشکی دیجیتال", color: "from-amber-500 to-orange-500" },
  { id: "t4", name: "مهندس نگار کریمی", role: "مدیر تجربه کاربری", specialty: "طراحی محصول", color: "from-rose-500 to-pink-500" },
];

const milestones = [
  { id: "m1", year: "۱۴۰۲", title: "تأسیس سلامت هوشمند", description: "شروع با یک ایده ساده: دسترسی همه به پزشک متخصص" },
  { id: "m2", year: "۱۴۰۳", title: "راه‌اندازی ویزیت هوشمند", description: "عرضه اولین سامانه تحلیل علائم با پردازش زبان فارسی" },
  { id: "m3", year: "۱۴۰۴", title: "+۱۰ هزار ویزیت ماهانه", description: "گسترش به ۲۰ استان و اتصال بیش از ۱۰۰۰ پزشک" },
  { id: "m4", year: "۱۴۰۵", title: "داروخانه و پرونده یکپارچه", description: "راه‌اندازی داروخانه آنلاین و پرونده پزشکی هوشمند" },
];

export default function AboutPage() {
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

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
            className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl"
          >
            <HeartPulse className="w-12 h-12 text-white" />
          </motion.div>

          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-2xl md:text-4xl font-bold text-white"
            >
              درباره سلامت هوشمند
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-sm md:text-base text-white/85 max-w-2xl mx-auto leading-8"
            >
              ما باور داریم دسترسی به پزشک متخصص، حق همه است — نه امتیاز.
              سلامت هوشمند با توانمندی هوش مصنوعی، پل میان شما و بهترین پزشکان
              ایران است؛ هر زمان که نیاز داشتید، هر جا که بودید.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <Link href="/dashboard/visit">
              <Button className="h-10 text-sm bg-white text-trust-600 hover:bg-white/90 font-bold shadow-lg">
                شروع ویزیت هوشمند
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-10 text-sm border-white/40 text-white hover:bg-white/10 hover:text-white">
                تماس با ما
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ===== Content ===== */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* ---- Mission & Vision ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full border-trust-200 dark:border-trust-800/30">
              <CardContent className="p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-trust-50 dark:bg-trust-900/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-trust-500" />
                </div>
                <h2 className="text-base font-bold text-foreground">مأموریت ما</h2>
                <p className="text-sm text-muted-foreground leading-7">
                  کاهش بار مراجعه حضوری به مراکز درمانی با ارائه ویزیت آنلاین
                  دقیق و مقرون‌به‌صرفه؛ به‌گونه‌ای که هر ایرانی، فارغ از موقعیت
                  جغرافیایی، در کمترین زمان به پزشک متخصص دسترسی داشته باشد.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full border-healing-200 dark:border-healing-800/30">
              <CardContent className="p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-healing-50 dark:bg-healing-900/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-healing-500" />
                </div>
                <h2 className="text-base font-bold text-foreground">چشم‌انداز ما</h2>
                <p className="text-sm text-muted-foreground leading-7">
                  تبدیل شدن به بزرگ‌ترین پلتفرم سلامت دیجیتال منطقه تا سال ۱۴۱۰؛
                  جایی که هر شهروند با یک گوشی موبایل، کل زنجیره سلامت خود را —
                  از علائم تا دارو — مدیریت کند.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ---- Stats ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                >
                  <Card className={cn("border", stat.bgColor, "border-transparent")}>
                    <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                      <Icon className={cn("w-5 h-5", stat.color)} />
                      <span className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</span>
                      <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ---- Values ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-trust-500 text-xs font-bold">
              <Gem className="w-4 h-4" />
              ارزش‌های ما
            </div>
            <h2 className="text-xl font-bold text-foreground">چه چیزی ما را متفاوت می‌کند؟</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <Card className={cn("h-full border-2 transition-all hover:shadow-lg hover:-translate-y-0.5", value.borderColor)}>
                    <CardContent className="p-5 space-y-3">
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", value.bgColor)}>
                        <Icon className={cn("w-5 h-5", value.color)} />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{value.title}</h3>
                      <p className="text-xs text-muted-foreground leading-6">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ---- Milestones ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-healing-500 text-xs font-bold">
              <CalendarDays className="w-4 h-4" />
              مسیر ما
            </div>
            <h2 className="text-xl font-bold text-foreground">سفری که با شما ساختیم</h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-[19px] md:right-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-trust-300 to-healing-300 md:translate-x-1/2" />

            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className={cn(
                    "relative flex gap-4 md:w-1/2",
                    index % 2 === 0
                      ? "md:pr-0 md:pl-8"
                      : "md:mr-auto md:pr-8"
                  )}
                >
                  {/* Dot */}
                  <div className="absolute right-[11px] md:right-auto md:left-[-9px] top-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-trust-500 to-healing-500 border-4 border-background shadow-md shrink-0" />

                  <Card className="flex-1 mr-8 md:mr-0">
                    <CardContent className="p-5">
                      <Badge className="bg-gradient-to-r from-trust-500 to-healing-500 text-white text-[10px] mb-2">
                        {milestone.year}
                      </Badge>
                      <h3 className="text-sm font-bold text-foreground">{milestone.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-6">
                        {milestone.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ---- Team ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-violet-500 text-xs font-bold">
              <Users className="w-4 h-4" />
              تیم ما
            </div>
            <h2 className="text-xl font-bold text-foreground">افرادی که این مسیر را ساختند</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="text-center group hover:shadow-lg hover:-translate-y-1 transition-all">
                  <CardContent className="p-5 space-y-3">
                    {/* Avatar */}
                    <div className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br mx-auto flex items-center justify-center shadow-md group-hover:scale-105 transition-transform",
                      member.color
                    )}>
                      <span className="text-white font-bold text-lg">
                        {member.name.split(" ").slice(-1)[0][0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{member.name}</h3>
                      <p className="text-xs text-trust-500 font-medium mt-0.5">{member.role}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{member.specialty}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ---- Quote ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-l from-trust-500 to-healing-500 border-0">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
            <CardContent className="p-8 md:p-10 relative z-10 text-center space-y-4">
              <Quote className="w-8 h-8 text-white/50 mx-auto" />
              <p className="text-lg md:text-xl text-white font-medium leading-9 max-w-2xl mx-auto">
                «وقتی فناوری در خدمت سلامت باشد، فاصله میان بیمار و پزشک فقط یک
                کلیک است.»
              </p>
              <p className="text-xs text-white/70">
                دکتر سارا محمدی — هم‌بنیان‌گذار و مدیر پزشکی
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---- CTA ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-trust-200 dark:border-trust-800/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-lg shadow-trust-500/25 shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      آماده‌اید تجربه متفاوت سلامت را شروع کنید؟
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-6">
                      همین حالا ویزیت هوشمند خود را آغاز کنید یا برای همکاری و
                      سوالات بیشتر با ما در تماس باشید.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Link href="/dashboard/visit">
                    <Button className="w-full sm:w-auto h-10 text-xs bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25">
                      شروع ویزیت هوشمند
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full sm:w-auto h-10 text-xs">
                      <PhoneCall className="w-3.5 h-3.5 ml-1" />
                      تماس با ما
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              حریم خصوصی
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              قوانین
            </Link>
            <a href="mailto:info@salamat.ir" className="hover:text-foreground transition-colors flex items-center gap-1" dir="ltr">
              <Mail className="w-3 h-3" />
              info@salamat.ir
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}