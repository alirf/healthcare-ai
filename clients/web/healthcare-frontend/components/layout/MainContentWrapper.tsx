"use client";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();
  return (
    <main
      className={cn(
        "flex-1 transition-all duration-300 h-[calc(100vh-60px)] overflow-hidden",
      )}
    >
      {children}
    </main>
  );
}