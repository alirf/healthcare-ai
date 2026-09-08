"use client";

import { motion } from "framer-motion";
import { Lightbulb, ChevronLeft, Heart, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HealthTips() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="overflow-hidden border-amber-200 dark:border-amber-800/30">
        <CardContent className="p-5 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />

          <div className="relative z-10 space-y-4">
            {/* Header with decorative icon */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground leading-tight">
                  همیشه پرونده‌هات رو بروز نگه دار
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  با ثبت منظم اطلاعات، تشخیص دقیق‌تر و درمان بهتری داشته باشی
                </p>
              </div>
            </div>

            {/* Decorative illustration placeholder */}
            <div className="flex justify-center py-2">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-healing-100 to-trust-100 dark:from-healing-900/30 dark:to-trust-900/30 flex items-center justify-center">
                <ShieldCheck className="w-12 h-12 text-healing-500/60" />
              </div>
            </div>

            {/* CTA Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-amber-800 dark:hover:bg-amber-900/20 gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              مشاهده نکات مهم
              <ChevronLeft className="w-3.5 h-3.5 mr-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}