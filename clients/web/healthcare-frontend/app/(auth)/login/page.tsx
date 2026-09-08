"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { login, requestLoginOTP, verifyLoginOTP } from "@/lib/auth-api"; // ← تغییر: requestOTP → requestLoginOTP
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LoginMethod = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  
  const [method, setMethod] = useState<LoginMethod>("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOTP = async () => {
    if (!phone || phone.length < 11) {
      setError("شماره موبایل را صحیح وارد کنید");
      return;
    }
    setLoading(true);
    setError("");
    
    const result = await requestLoginOTP({ phone_number: phone }); // ← تغییر: requestOTP → requestLoginOTP
    
    if (result.success) {
      setOtpSent(true);
      startCountdown();
    } else {
      setError(result.error || "خطا در ارسال کد");
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let result;
    if (method === "password") {
      result = await login({ phone_number: phone, password });
    } else {
      result = await verifyLoginOTP({ phone_number: phone, code: otpCode });
    }

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "خطا در ورود");
    }
    setLoading(false);
  };

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
            <CardDescription>ورود به حساب کاربری</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex bg-muted rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMethod("password"); setOtpSent(false); setError(""); }}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                method === "password" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <Lock className="w-4 h-4 inline ml-1" />
              رمز عبور
            </button>
            <button
              type="button"
              onClick={() => { setMethod("otp"); setError(""); }}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                method === "otp" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4 inline ml-1" />
              کد یکبار مصرف
            </button>
          </div>

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

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">شماره موبایل</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {method === "password" ? (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium">رمز عبور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-10 pl-12 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 transition-all"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {!otpSent ? (
                    <Button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={loading || countdown > 0}
                      className="w-full bg-trust-500 hover:bg-trust-600 h-12"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دریافت کد یکبار مصرف"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">کد تأیید</label>
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
                            onClick={handleRequestOTP}
                            className="text-sm text-trust-500 hover:text-trust-600"
                          >
                            ارسال مجدد کد
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {(method === "password" || (method === "otp" && otpSent)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  type="submit"
                  disabled={loading || (method === "otp" && otpCode.length !== 6)} // ← تغییر: !== 5 → !== 6
                  className="w-full bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 h-12 text-base font-semibold shadow-lg shadow-trust-500/25"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      ورود
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-trust-500 hover:text-trust-600 transition-colors">
              رمز عبور را فراموش کردم
            </Link>
            <Link href="/register" className="text-healing-500 hover:text-healing-600 transition-colors font-medium">
              ثبت‌نام
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        © ۲۰۲۶ سلامت هوشمند - تمامی حقوق محفوظ است
      </p>
    </motion.div>
  );
}