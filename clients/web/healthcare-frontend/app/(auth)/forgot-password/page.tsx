"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  Phone,
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sun,
  Moon,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { forgotPassword, resetPassword, verifyForgotPasswordOTP } from "@/lib/auth-api"; // ← تغییر: requestOTP → verifyForgotPasswordOTP
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = "phone" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]); // ← تغییر: 5 → 6
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [shake, setShake] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const startCountdown = () => setCountdown(60);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return /^09\d{9}$/.test(cleaned);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(phone)) {
      setError("شماره موبایل را صحیح وارد کنید");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");

    const result = await forgotPassword({ phone_number: phone });

    if (result.success) {
      setStep("otp");
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setError(result.error || "خطا در ارسال کد");
      triggerShake();
    }
    setLoading(false);
  };

  const handleVerifyOTPAndProceed = async (e: React.FormEvent) => { // ← تغییر: sync → async
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length !== 6) { // ← تغییر: !== 5 → !== 6
      setError("کد ۶ رقمی را کامل وارد کنید"); // ← تغییر: ۵ → ۶
      triggerShake();
      return;
    }
    setLoading(true); // ← تغییر: اضافه شد
    setError(""); // ← تغییر: اضافه شد
    const result = await verifyForgotPasswordOTP({ phone_number: phone, code }); // ← تغییر: verify در بک‌اند
    setLoading(false); // ← تغییر: اضافه شد
    if (result.success) {
      setStep("reset");
    } else {
      setError(result.error || "کد نامعتبر است");
      triggerShake();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      triggerShake();
      return;
    }
    if (newPassword.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      triggerShake();
      return;
    }

    setLoading(true);
    const result = await resetPassword({
      phone_number: phone,
      code: otpCode.join(""),
      new_password: newPassword,
    });

    if (result.success) {
      setStep("success");
      setTimeout(() => router.push("/login"), 3000);
    } else {
      setError(result.error || "خطا در تغییر رمز");
      triggerShake();
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);
    if (value && index < 5) { // ← تغییر: index < 4 → index < 5
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); // ← تغییر: slice(0,5) → slice(0,6)
    const newCode = [...otpCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setOtpCode(newCode);
    const focusIndex = Math.min(pasted.length, 5); // ← تغییر: Math.min(...,4) → Math.min(...,5)
    otpRefs.current[focusIndex]?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-trust-500" />}
        </Button>
      </div>

      <Card className="shadow-2xl border-trust-100 dark:border-trust-800/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
        <CardHeader className="text-center space-y-4 pb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-lg shadow-trust-500/25"
          >
            <Stethoscope className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-trust-600 to-healing-600 bg-clip-text text-transparent">
              سلامت هوشمند
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {step === "phone" ? "بازیابی رمز عبور" : step === "otp" ? "تأیید کد" : step === "reset" ? "رمز عبور جدید" : "تغییر رمز با موفقیت"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className={cn(
                  "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2",
                  shake && "animate-shake"
                )}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRequestReset}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    شماره موبایل
                  </label>
                  <div className="relative group">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-trust-500 transition-colors" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border bg-background/50 focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all duration-200"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 h-12 text-base font-semibold shadow-lg shadow-trust-500/25 transition-all duration-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ارسال کد تأیید<ArrowLeft className="w-5 h-5 mr-2" /></>}
                </Button>
              </motion.form>
            )}

            {step === "otp" && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTPAndProceed}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6 text-trust-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    کد ۶ رقمی به <span className="font-medium text-foreground ltr">{phone}</span> ارسال شد {/* ← تغییر: ۵ → ۶ */}
                  </p>
                </div>

                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {[0, 1, 2, 3, 4, 5].map((i) => ( // ← تغییر: 5 رقم → 6 رقم
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpCode[i]}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-semibold rounded-xl border bg-background/50 focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all duration-200"
                    />
                  ))}
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <span className="text-sm text-muted-foreground">{countdown} ثانیه تا ارسال مجدد</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestReset}
                      disabled={loading}
                      className="text-sm text-trust-500 hover:text-trust-600 font-medium transition-colors"
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || otpCode.join("").length !== 6} // ← تغییر: !== 5 → !== 6
                  className="w-full bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 h-12 text-base font-semibold shadow-lg shadow-trust-500/25 transition-all duration-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ادامه<ArrowLeft className="w-5 h-5 mr-2" /></>}
                </Button>
              </motion.form>
            )}

            {step === "reset" && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    رمز عبور جدید
                  </label>
                  <div className="relative group">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-trust-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="حداقل ۸ کاراکتر"
                      className="w-full pr-10 pl-12 py-3 rounded-xl border bg-background/50 focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all duration-200"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    تکرار رمز عبور جدید
                  </label>
                  <div className="relative group">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-trust-500 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full pr-10 pl-12 py-3 rounded-xl border bg-background/50 focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all duration-200",
                        confirmPassword && newPassword !== confirmPassword && "border-red-300 focus:border-red-400 focus:ring-red-500/30"
                      )}
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">رمز عبور و تکرار آن یکسان نیستند</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 h-12 text-base font-semibold shadow-lg shadow-trust-500/25 transition-all duration-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>تغییر رمز عبور<ArrowLeft className="w-5 h-5 mr-2" /></>}
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-healing-100 dark:bg-healing-900/30 flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-healing-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground">رمز عبور با موفقیت تغییر یافت!</h3>
                <p className="text-sm text-muted-foreground">در حال انتقال به صفحه ورود...</p>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-full bg-healing-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "success" && (
            <div className="text-center pt-2">
              <Link href="/login" className="text-sm text-trust-500 hover:text-trust-600 transition-colors font-medium">
                بازگشت به صفحه ورود
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground mt-6"
      >
        © ۲۰۲۶ سلامت هوشمند - تمامی حقوق محفوظ است
      </motion.p>
    </motion.div>
  );
}