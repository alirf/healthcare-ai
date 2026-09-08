"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Stethoscope, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SymptomChat from "@/components/visit/SymptomChat";
import VisitSidebar from "@/components/visit/VisitSidebar";
import { mockVisitHistory } from "@/components/visit/SymptomTemplates";
import type { VisitHistory } from "@/types/visit";

export default function VisitPage() {
  const { isOpen, isCollapsed, open, setCollapsed } = useSidebarStore();
  const [selectedVisit, setSelectedVisit] = useState<VisitHistory | undefined>();
  const [showVisitList, setShowVisitList] = useState(true);

  const handleNewVisit = () => {
    setSelectedVisit(undefined);
    // Reset chat state would go here
  };

  return (
    <div className="h-full flex">
      {/* Visit Sidebar (Left side in RTL) */}
      <AnimatePresence>
        {showVisitList && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0 h-full border-l border-border overflow-hidden"
          >
            <VisitSidebar
              visits={mockVisitHistory}
              selectedVisitId={selectedVisit?.id}
              onSelectVisit={setSelectedVisit}
              onNewVisit={handleNewVisit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toggle Visit List Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVisitList(!showVisitList)}
          className={cn(
            "absolute top-3 z-10 w-8 h-8 rounded-lg border shadow-sm bg-card",
            showVisitList ? "left-3" : "right-3"
          )}
        >
          <Menu className="w-4 h-4" />
        </Button>

        <SymptomChat onSendToDoctor={() => console.log("Sending to doctor...")} />
      </div>
    </div>
  );
}