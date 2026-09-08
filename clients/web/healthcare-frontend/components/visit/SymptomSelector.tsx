"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Thermometer,
  Wind,
  Activity,
  Brain,
  UtensilsCrossed,
  Scan,
  Heart,
  Droplets,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { symptomCategories } from "./SymptomTemplates";
import type { SymptomCategory, SymptomOption } from "@/types/visit";

const iconMap = {
  Thermometer,
  Wind,
  Activity,
  Brain,
  UtensilsCrossed,
  Scan,
  Heart,
  Droplets,
  Plus,
};

interface SymptomSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (symptoms: SymptomOption[]) => void;
  existingTypes: string[];
}

export default function SymptomSelector({ isOpen, onClose, onAdd, existingTypes }: SymptomSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((s) => s !== symptomId) : [...prev, symptomId]
    );
  };

  const handleAdd = () => {
    const allSymptoms = symptomCategories.flatMap((cat) => cat.symptoms);
    const selected = allSymptoms.filter((s) => selectedSymptoms.includes(s.id));
    onAdd(selected);
    setSelectedSymptoms([]);
    setSearchQuery("");
  };

  const filteredCategories = searchQuery
    ? symptomCategories.map((cat) => ({
        ...cat,
        symptoms: cat.symptoms.filter(
          (s) =>
            s.label.includes(searchQuery) ||
            s.description?.includes(searchQuery)
        ),
      })).filter((cat) => cat.symptoms.length > 0)
    : symptomCategories;

  const currentCategory = filteredCategories.find((c) => c.id === selectedCategory) || filteredCategories[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">اضافه کردن علامت</h3>
                <p className="text-xs text-muted-foreground">علائم مورد نظر خود را انتخاب کنید</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="جستجوی علامت..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-trust-500/30 focus:border-trust-500 text-sm"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Categories Sidebar */}
              {!searchQuery && (
                <div className="w-48 border-l border-border overflow-y-auto p-2 space-y-1">
                  {symptomCategories.map((cat) => {
                    const Icon = iconMap[cat.icon as keyof typeof iconMap] || Plus;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          selectedCategory === cat.id
                            ? "bg-trust-500 text-white shadow-md"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Symptoms Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2">
                  {(searchQuery ? filteredCategories.flatMap((c) => c.symptoms) : currentCategory?.symptoms || []).map(
                    (symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom.id);
                      const isExisting = existingTypes.includes(symptom.type);
                      return (
                        <button
                          key={symptom.id}
                          onClick={() => !isExisting && toggleSymptom(symptom.id)}
                          disabled={isExisting}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border text-right transition-all",
                            isSelected
                              ? "border-trust-500 bg-trust-50 dark:bg-trust-900/20 shadow-sm"
                              : isExisting
                              ? "border-muted bg-muted/30 opacity-50 cursor-not-allowed"
                              : "border-border hover:border-trust-300 hover:bg-trust-50/50 dark:hover:bg-trust-900/10"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                            isSelected
                              ? "bg-trust-500 border-trust-500"
                              : "border-muted-foreground/30"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{symptom.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{symptom.description}</p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
              <span className="text-sm text-muted-foreground">
                {selectedSymptoms.length} علامت انتخاب شده
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="h-9">
                  انصراف
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={selectedSymptoms.length === 0}
                  className="h-9 bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  اضافه کردن
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}