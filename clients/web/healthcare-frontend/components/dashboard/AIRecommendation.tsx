"use client";

import { motion } from "framer-motion";
import { Lightbulb, Brain, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AIRecommendation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="overflow-hidden border-amber-200 dark:border-amber-800/30">
        <CardContent className="p-5 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-bold text-sm text-foreground">توصیه هوش مصنوعی</span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                بر اساس آخرین تحلیل، توصیه می‌شود که روزانه ۳۰ دقیقه پیاده‌روی داشته باشید. این کار به بهبود فشار خون و کاهش استرس کمک می‌کند.
              </p>
              
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Brain className="w-3.5 h-3.5" />
                <span>اطمینان تحلیل: ۸۵٪</span>
              </div>
            </div>

            {/* CTA */}
            <Link href="/dashboard/ai-chat">
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs h-9"
              >
                <Brain className="w-3.5 h-3.5 ml-1.5" />
                سوال از AI
                <ChevronLeft className="w-3.5 h-3.5 mr-auto" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}