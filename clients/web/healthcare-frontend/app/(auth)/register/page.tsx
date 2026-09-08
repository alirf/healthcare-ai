"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  Phone,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { register, verifyOTP } from "@/lib/auth-api"; // ← تغییر: requestOTP حذف شد
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Step = "info" | "otp" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  
  const [step, setStep] = useState<Step>("info");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }
    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      return;
    }

    setLoading(true);
    const result = await register({ phone_number: phone, password, email, role: "PATIENT" });
    
    if (result.success) {
      setStep("otp"); // ← تغییر: register خودش OTP ساخت، نیازی به requestOTP نیست
      startCountdown();
    } else {
      setError(result.error || "خطا در ثبت‌نام");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await verifyOTP({ phone_number: phone, code: otpCode });
    
    if (result.success) {
      router.push("/dashboard"); // ← تغییر: مستقیم برو داشبورد (توکن ذخیره شده)
    } else {
      setError(result.error || "کد نامعتبر است");
    }
    setLoading(false);
  };

  const progressValue = step === "info" ? 33 : step === "otp" ? 66 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-trust-500" />}
        </Button>
      </div>

      <Card className="shadow-xl border-trust-100 dark:border-trust-800">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-lg">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">سلامت هوشمند</CardTitle>
            <CardDescription>ایجاد حساب کاربری جدید</CardDescription>
          </div>
          <Progress value={progressValue} className="h-1" />
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-lg text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "info" && (
              <motion.form
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">شماره موبایل</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ایمیل</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">رمز عبور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۸ کاراکتر"
                      className="w-full pr-10 pl-12 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">تکرار رمز عبور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 h-12 text-base font-semibold shadow-lg shadow-trust-500/25"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ادامه و دریافت کد<ArrowLeft className="w-5 h-5 mr-2" /></>}
                </Button>
              </motion.form>
            )}

            {step === "otp" && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">کد ۶ رقمی به شماره {phone} ارسال شد</p> {/* ← تغییر: ۵ → ۶ */}
                </div>

                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((i) => ( // ← تغییر: 5 رقم → 6 رقم
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otpCode[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        const newCode = otpCode.split("");
                        newCode[i] = val;
                        setOtpCode(newCode.join(""));
                        if (val && i < 5) { // ← تغییر: i < 4 → i < 5
                          (e.target.nextElementSibling as HTMLInputElement)?.focus();
                        }
                      }}
                      className="w-12 h-14 text-center text-xl rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all"
                    />
                  ))}
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <span className="text-sm text-muted-foreground">{countdown} ثانیه تا ارسال مجدد</span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => { // ← تغییر: requestOTP حذف شد
                        setLoading(true);
                        // TODO: نیاز به endpoint جداگانه برای ارسال مجدد OTP ثبت‌نام
                        startCountdown();
                        setLoading(false);
                      }}
                      className="text-sm text-trust-500 hover:text-trust-600"
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || otpCode.length !== 6} // ← تغییر: !== 5 → !== 6
                  className="w-full bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 h-12 text-base font-semibold"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>تأیید و ثبت‌نام<ArrowLeft className="w-5 h-5 mr-2" /></>}
                </Button>
              </motion.form>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-8"
              >
                <div className="w-20 h-20 rounded-full bg-healing-100 dark:bg-healing-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-healing-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">ثبت‌نام با موفقیت انجام شد!</h3>
                <p className="text-sm text-muted-foreground">در حال انتقال به صفحه ورود...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "success" && (
            <div className="text-center">
              <Link href="/login" className="text-sm text-trust-500 hover:text-trust-600 transition-colors">
                قبلاً ثبت‌نام کرده‌ام - ورود
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}