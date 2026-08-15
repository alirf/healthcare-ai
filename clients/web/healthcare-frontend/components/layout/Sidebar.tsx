"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  MessageSquare,
  FileText,
  ClipboardList,
  Pill,
  Receipt,
  Settings,
  HeadphonesIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { id: "dashboard", label: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { id: "smart-visit", label: "ویزیت هوشمند", href: "/dashboard/visit", icon: Stethoscope },
  { id: "appointments", label: "نوبت‌ها", href: "/dashboard/appointments", icon: CalendarDays },
  { id: "chat-doctor", label: "گفتگو با پزشک", href: "/dashboard/chat-doctor", icon: MessageSquare },
  { id: "medical-record", label: "پرونده پزشکی", href: "/dashboard/records", icon: FileText },
  { id: "history", label: "سوابق و نتایج", href: "/dashboard/history", icon: ClipboardList },
  { id: "pharmacy", label: "خرید دارو", href: "/dashboard/pharmacy", icon: Pill },
  { id: "transactions", label: "تراکنش‌ها", href: "/dashboard/transactions", icon: Receipt },
  { id: "settings", label: "تنظیمات", href: "/dashboard/settings", icon: Settings },
  { id: "support", label: "پشتیبانی", href: "/dashboard/support", icon: HeadphonesIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isCollapsed, toggle, close, setCollapsed } = useSidebarStore();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 260,
          x: isOpen || !isMobile ? 0 : 260,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed top-[60px] bottom-0 right-0 z-30 bg-card border-l border-border shadow-lg",
          "flex flex-col overflow-hidden",
          isMobile && "top-0"
        )}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold text-foreground">منوی اصلی</span>
            <Button variant="ghost" size="icon" onClick={close} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Sidebar Header (Desktop only) */}
        {!isMobile && !isCollapsed && (
          <div className="px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-foreground">منوی اصلی</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link key={item.id} href={item.href} onClick={() => isMobile && close()}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-trust-500 text-white shadow-md shadow-trust-500/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-white")} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="sidebarActive"
                      className="mr-auto w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button */}
        {!isMobile && (
          <div className="p-3 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={() => setCollapsed(!isCollapsed)}
              className={cn(
                "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
                isCollapsed && "justify-center"
              )}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-xs font-medium">بستن منو</span>
                </>
              )}
            </Button>
          </div>
        )}
      </motion.aside>

      {/* Mobile Toggle Button (Floating) */}
      {isMobile && !isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => useSidebarStore.getState().open()}
          className="fixed top-[72px] right-4 z-20 w-10 h-10 rounded-full bg-trust-500 text-white shadow-lg flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
      )}
    </>
  );
}
