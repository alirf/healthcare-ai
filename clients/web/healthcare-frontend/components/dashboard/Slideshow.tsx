"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Stethoscope, Brain, Pill, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Slide } from "@/types/new-layout";

const slides: Slide[] = [
  {
    id: "1",
    title: "ویزیت آنلاین با پزشکان متخصص",
    subtitle: "۲۴ ساعته، ۷ روز هفته",
    description: "با پزشکان متخصص در هر ساعت از شبانه‌روز در ارتباط باشید. بدون نیاز به حضور فیزیکی.",
    bgColor: "from-trust-500/10 via-trust-500/5 to-transparent",
    textColor: "text-trust-600",
    ctaText: "شروع ویزیت",
    ctaLink: "/dashboard/visit",
  },
  {
    id: "2",
    title: "تحلیل هوشمند با AI",
    subtitle: "دقت بالا، سرعت فوق‌العاده",
    description: "هوش مصنوعی ما شرح حال شما را تحلیل کرده و احتمالات تشخیصی را ارائه می‌دهد.",
    bgColor: "from-violet-500/10 via-violet-500/5 to-transparent",
    textColor: "text-violet-600",
    ctaText: "گفتگو با AI",
    ctaLink: "/dashboard/ai-chat",
  },
  {
    id: "3",
    title: "داروخانه آنلاین",
    subtitle: "ارسال سریع به درب منزل",
    description: "داروهای مورد نیاز خود را به راحتی سفارش دهید و در سریع‌ترین زمان دریافت کنید.",
    bgColor: "from-healing-500/10 via-healing-500/5 to-transparent",
    textColor: "text-healing-600",
    ctaText: "خرید دارو",
    ctaLink: "/dashboard/pharmacy",
  },
  {
    id: "4",
    title: "پرونده پزشکی دیجیتال",
    subtitle: "همیشه در دسترس",
    description: "تمام سوابق پزشکی، آزمایش‌ها و نتایج شما در یک مکان امن و قابل دسترس.",
    bgColor: "from-amber-500/10 via-amber-500/5 to-transparent",
    textColor: "text-amber-600",
    ctaText: "مشاهده پرونده",
    ctaLink: "/dashboard/records",
  },
];

const slideIcons = [Stethoscope, Brain, Pill, Shield];

export default function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];
  const SlideIcon = slideIcons[current];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full h-[200px] md:h-[220px] rounded-2xl overflow-hidden bg-gradient-to-br shadow-md border border-border">
      {/* Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", slide.bgColor)} />
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-trust-500/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-healing-500/5 blur-3xl translate-y-1/2 -translate-x-1/4" />

      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10"
        >
          <div className="flex items-start gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white/80 shadow-sm", slide.textColor)}>
              <SlideIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground">{slide.title}</h3>
                <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
              </div>
              <p className="text-sm text-muted-foreground max-w-md hidden sm:block">{slide.description}</p>
              <Button
                size="sm"
                className={cn("mt-2 text-xs", slide.textColor.replace("text-", "bg-").replace("600", "500") + " text-white hover:opacity-90")}
              >
                {slide.ctaText}
                <ChevronLeft className="w-3 h-3 mr-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition-colors z-20"
      >
        <ChevronRight className="w-4 h-4 text-foreground" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition-colors z-20"
      >
        <ChevronLeft className="w-4 h-4 text-foreground" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > current ? 1 : -1);
              setCurrent(i);
            }}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === current ? "w-6 bg-trust-500" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
