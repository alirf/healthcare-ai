"use client";

import { motion } from "framer-motion";
import { Wallet, User, MapPin, Heart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PatientWallet() {
  const balance = 2540010;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden border-trust-200 dark:border-trust-800/30">
        <CardContent className="p-5 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-trust-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-trust-100 dark:bg-trust-900/30 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-trust-500" />
              </div>
              <span className="font-bold text-sm text-foreground">کیف پول بیمار</span>
            </div>

            {/* Balance */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                {balance.toLocaleString("fa-IR")}
              </span>
              <span className="text-sm text-muted-foreground">تومان</span>
            </div>

            {/* Trend */}
            <div className="flex items-center gap-1 text-xs text-healing-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+۱۵٪ نسبت به ماه گذشته</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Link href="/dashboard/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs border-trust-200 hover:bg-trust-50 hover:text-trust-600 dark:border-trust-800 dark:hover:bg-trust-900/20"
                >
                  <User className="w-3.5 h-3.5 ml-1" />
                  اطلاعات من
                </Button>
              </Link>
              <Link href="/dashboard/addresses">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs border-healing-200 hover:bg-healing-50 hover:text-healing-600 dark:border-healing-800 dark:hover:bg-healing-900/20"
                >
                  <MapPin className="w-3.5 h-3.5 ml-1" />
                  آدرس‌ها
                </Button>
              </Link>
              <Link href="/dashboard/favorites">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-amber-800 dark:hover:bg-amber-900/20"
                >
                  <Heart className="w-3.5 h-3.5 ml-1" />
                  علاقه‌مندی‌ها
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}