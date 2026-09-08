"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bodyParts } from "./SymptomTemplates";
import { cn } from "@/lib/utils";

interface BodyAnatomyProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
  onComplete: () => void;
  onCancel: () => void;
  title?: string;
}

export default function BodyAnatomy({
  selectedParts,
  onPartsChange,
  onComplete,
  onCancel,
  title = "بخش‌های مورد نظر را انتخاب کنید",
}: BodyAnatomyProps) {
  const [localParts, setLocalParts] = useState<string[]>(selectedParts);

  const togglePart = (partId: string) => {
    setLocalParts((prev) =>
      prev.includes(partId) ? prev.filter((p) => p !== partId) : [...prev, partId]
    );
  };

  const handleComplete = () => {
    onPartsChange(localParts);
    onComplete();
  };

  // SVG Body Silhouette
  const BodySVG = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Head */}
      <ellipse
        cx="50" cy="8" rx="8" ry="10"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("head") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("head")}
      />
      {/* Neck */}
      <rect
        x="46" y="16" width="8" height="6" rx="2"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("neck") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("neck")}
      />
      {/* Shoulders/Chest */}
      <rect
        x="32" y="22" width="36" height="8" rx="4"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("shoulders") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("shoulders")}
      />
      {/* Chest */}
      <rect
        x="36" y="30" width="28" height="14" rx="6"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("chest") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("chest")}
      />
      {/* Abdomen */}
      <rect
        x="38" y="44" width="24" height="12" rx="6"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("abdomen") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("abdomen")}
      />
      {/* Back (shown as outline behind) */}
      <rect
        x="38" y="34" width="24" height="16" rx="4"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80 opacity-50",
          localParts.includes("back") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("back")}
      />
      {/* Left Arm */}
      <rect
        x="22" y="30" width="10" height="26" rx="5"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("left_arm") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("left_arm")}
      />
      {/* Right Arm */}
      <rect
        x="68" y="30" width="10" height="26" rx="5"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("right_arm") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("right_arm")}
      />
      {/* Left Hand */}
      <circle
        cx="19" cy="60" r="5"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("left_hand") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("left_hand")}
      />
      {/* Right Hand */}
      <circle
        cx="81" cy="60" r="5"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("right_hand") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("right_hand")}
      />
      {/* Left Leg */}
      <rect
        x="38" y="56" width="12" height="32" rx="6"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("left_leg") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("left_leg")}
      />
      {/* Right Leg */}
      <rect
        x="50" y="56" width="12" height="32" rx="6"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("right_leg") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("right_leg")}
      />
      {/* Left Foot */}
      <ellipse
        cx="36" cy="92" rx="6" ry="4"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("left_foot") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("left_foot")}
      />
      {/* Right Foot */}
      <ellipse
        cx="64" cy="92" rx="6" ry="4"
        className={cn(
          "transition-all duration-200 cursor-pointer hover:opacity-80",
          localParts.includes("right_foot") ? "fill-rose-400" : "fill-slate-300 dark:fill-slate-600"
        )}
        onClick={() => togglePart("right_foot")}
      />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-xl p-5 space-y-4"
    >
      <h4 className="font-bold text-sm text-foreground text-center">{title}</h4>

      {/* Body Diagram */}
      <div className="relative w-48 h-64 mx-auto">
        <BodySVG />
      </div>

      {/* Selected Parts List */}
      {localParts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {localParts.map((partId) => {
            const part = bodyParts.find((p) => p.id === partId);
            return (
              <span
                key={partId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-medium"
              >
                {part?.label}
                <button
                  onClick={() => togglePart(partId)}
                  className="hover:text-rose-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1 h-9 text-xs"
        >
          <X className="w-3.5 h-3.5 ml-1" />
          انصراف
        </Button>
        <Button
          size="sm"
          onClick={handleComplete}
          className="flex-1 h-9 text-xs bg-trust-500 hover:bg-trust-600 text-white"
        >
          <Check className="w-3.5 h-3.5 ml-1" />
          ثبت انتخاب
        </Button>
      </div>
    </motion.div>
  );
}