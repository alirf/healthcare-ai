"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Wind,
  Activity,
  Brain,
  UtensilsCrossed,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Zap,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SymptomData } from "@/types/visit";
import BodyAnatomy from "./BodyAnatomy";

const iconMap = {
  Thermometer,
  Wind,
  Activity,
  Brain,
  UtensilsCrossed,
  Scan,
  Zap,
};

interface SymptomBoxProps {
  symptom: SymptomData;
  onUpdate: (symptom: SymptomData) => void;
  onRemove: (id: string) => void;
  index: number;
}

export default function SymptomBox({ symptom, onUpdate, onRemove, index }: SymptomBoxProps) {
  const [expanded, setExpanded] = useState(!symptom.completed);
  const [showAnatomy, setShowAnatomy] = useState(false);

  const config = {
    fever: { icon: "Thermometer", gradient: "from-rose-400 to-red-500" },
    cough: { icon: "Wind", gradient: "from-amber-400 to-orange-500" },
    pain: { icon: "Activity", gradient: "from-red-400 to-rose-500" },
    headache: { icon: "Brain", gradient: "from-violet-400 to-purple-500" },
    vomiting: { icon: "UtensilsCrossed", gradient: "from-orange-400 to-red-500" },
    skin_lesion: { icon: "Scan", gradient: "from-pink-400 to-rose-500" },
  }[symptom.type] || { icon: "Zap", gradient: "from-trust-400 to-healing-500" };

  const Icon = iconMap[config.icon as keyof typeof iconMap] || Activity;

  const handleSeverityChange = (severity: number) => {
    onUpdate({
      ...symptom,
      details: { ...symptom.details, severity: severity as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 },
    });
  };

  const handleBodyPartsChange = (parts: string[]) => {
    onUpdate({
      ...symptom,
      details: { ...symptom.details, bodyParts: parts },
    });
  };

  const handleComplete = () => {
    onUpdate({ ...symptom, completed: true });
    setExpanded(false);
  };

  const isHighImportance = symptom.importance === "high";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "relative rounded-2xl border-2 overflow-hidden transition-all duration-300",
        symptom.completed
          ? "border-opacity-50"
          : "border-opacity-100 shadow-lg",
        symptom.borderColor,
        symptom.bgColor
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 cursor-pointer",
          isHighImportance && "bg-gradient-to-r opacity-10"
        )}
        onClick={() => symptom.requiresDetails && setExpanded(!expanded)}
      >
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-md",
          config.gradient
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-foreground">{symptom.label}</h4>
            {isHighImportance && (
              <Badge variant="outline" className="text-[10px] h-5 border-rose-300 text-rose-500">
                <Zap className="w-3 h-3 ml-0.5" />
                مهم
              </Badge>
            )}
          </div>
          {symptom.completed && symptom.details?.severity && (
            <p className="text-xs text-muted-foreground">
              شدت: {symptom.details.severity}/10
              {symptom.details.bodyParts && symptom.details.bodyParts.length > 0 && (
                ` • ${symptom.details.bodyParts.length} ناحیه`
              )}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {symptom.completed ? (
            <div className="w-6 h-6 rounded-full bg-healing-500/20 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-healing-500" />
            </div>
          ) : (
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )} />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(symptom.id); }}
            className="w-6 h-6 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && symptom.requiresDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Severity Slider */}
              {symptom.details?.severity !== undefined && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    شدت علامت (۱ تا ۱۰)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">خفیف</span>
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleSeverityChange(level)}
                          className={cn(
                            "flex-1 h-8 rounded-lg text-xs font-bold transition-all duration-200",
                            symptom.details?.severity === level
                              ? "bg-gradient-to-r from-trust-500 to-healing-500 text-white shadow-md scale-105"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">شدید</span>
                  </div>
                </div>
              )}

              {/* Body Anatomy */}
              {symptom.details?.bodyParts !== undefined && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    نواحی درگیر
                  </label>
                  {!showAnatomy ? (
                    <div className="space-y-2">
                      {symptom.details.bodyParts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {symptom.details.bodyParts.map((part) => (
                            <Badge
                              key={part}
                              variant="outline"
                              className="text-[10px] border-trust-200 text-trust-600"
                            >
                              {part}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">هیچ ناحیه‌ای انتخاب نشده</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAnatomy(true)}
                        className="w-full h-9 text-xs border-dashed border-trust-300 hover:bg-trust-50 dark:hover:bg-trust-900/20"
                      >
                        <Activity className="w-3.5 h-3.5 ml-1" />
                        انتخاب از روی بدن
                      </Button>
                    </div>
                  ) : (
                    <BodyAnatomy
                      selectedParts={symptom.details.bodyParts}
                      onPartsChange={handleBodyPartsChange}
                      onComplete={() => setShowAnatomy(false)}
                      onCancel={() => setShowAnatomy(false)}
                      title={`ناحیه ${symptom.label} را مشخص کنید`}
                    />
                  )}
                </div>
              )}

              {/* Complete Button */}
              <Button
                onClick={handleComplete}
                className="w-full h-10 text-sm bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25"
              >
                <Check className="w-4 h-4 ml-1.5" />
                تکمیل علامت
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}