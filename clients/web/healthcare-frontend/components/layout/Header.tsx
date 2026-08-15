"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
  Settings,
  X,
  Stethoscope,
  Check,
  Clock,
  MessageSquare,
  Pill,
  AlertCircle,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/new-layout";

// Mock notifications
const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "پیام جدید",
    message: "دکتر احمدی پیام جدیدی برای شما ارسال کرد",
    type: "chat",
    isRead: false,
    createdAt: "2026-08-13T10:30:00Z",
    link: "/dashboard/chat-doctor",
  },
  {
    id: "n2",
    title: "ویزیت تکمیل شد",
    message: "ویزیت شما با دکتر کریمی با موفقیت تکمیل شد",
    type: "visit",
    isRead: false,
    createdAt: "2026-08-12T14:00:00Z",
    link: "/dashboard/visit/v2",
  },
  {
    id: "n3",
    title: "دارو در راه است",
    message: "سفارش داروی شما ارسال شد و به زودی می‌رسد",
    type: "order",
    isRead: true,
    createdAt: "2026-08-12T09:00:00Z",
    link: "/dashboard/orders",
  },
];

const notificationIcons = {
  chat: MessageSquare,
  visit: Stethoscope,
  order: Pill,
  system: AlertCircle,
  reminder: Clock,
};

const notificationColors = {
  chat: "bg-sky-500/10 text-sky-600",
  visit: "bg-healing-500/10 text-healing-600",
  order: "bg-amber-500/10 text-amber-600",
  system: "bg-trust-500/10 text-trust-600",
  reminder: "bg-violet-500/10 text-violet-600",
};

export default function Header() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebarStore();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
    : "U";

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-card/95 backdrop-blur-md border-b border-border shadow-sm"
    >
      <div className="h-full flex items-center px-4 gap-3">
        
        {/* ===== LEFT SIDE (RTL: actually right side visually) ===== */}
        {/* Dropdown Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="rounded-full hover:bg-muted w-8 h-8"
        >
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
        </Button>

        {/* User Name & Phone */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-[11px] text-muted-foreground leading-tight">
            {user?.phone || "۰۹۱۲۳۴۵۶۷۸۹"}
          </span>
        </div>

        {/* User Avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center focus:outline-none"
          >
            <Avatar className="w-9 h-9 ring-2 ring-trust-200 dark:ring-trust-800 cursor-pointer hover:ring-trust-400 transition-all">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-trust-500 to-healing-500 text-white text-sm font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* User Dropdown */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-popover shadow-xl p-2 z-50"
              >
                <div className="px-3 py-2.5 border-b border-border/50">
                  <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors cursor-pointer">
                      <User className="w-4 h-4 text-muted-foreground" />
                      پروفایل
                    </div>
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors cursor-pointer">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      تنظیمات
                    </div>
                  </Link>
                </div>
                <div className="border-t border-border/50 pt-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                    خروج از حساب
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical Divider */}
        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full hover:bg-muted w-9 h-9"
          aria-label={isDark ? "حالت روشن" : "حالت تاریک"}
        >
          {isDark ? (
            <Sun className="w-[18px] h-[18px] text-amber-400" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-trust-500" />
          )}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen(!notifOpen)}
            className="rounded-full hover:bg-muted w-9 h-9 relative"
          >
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-amber-500 text-[10px] text-white flex items-center justify-center font-bold border-2 border-card">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-full mt-2 w-80 rounded-xl border bg-popover shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                  <span className="font-semibold text-sm">اعلان‌ها</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-trust-500 hover:text-trust-600">
                    همه را خواندم
                  </Button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {mockNotifications.map((notif) => {
                    const NotifIcon = notificationIcons[notif.type];
                    return (
                      <Link key={notif.id} href={notif.link || "#"} onClick={() => setNotifOpen(false)}>
                        <div className={cn(
                          "flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer border-b border-border/30 last:border-0",
                          !notif.isRead && "bg-trust-50/50 dark:bg-trust-900/10"
                        )}>
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", notificationColors[notif.type])}>
                            <NotifIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{notif.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(notif.createdAt).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-trust-500 shrink-0 mt-1" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <div className={cn(
            "flex items-center bg-muted rounded-full transition-all duration-300",
            searchOpen ? "ring-2 ring-trust-500/30" : ""
          )}>
            <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="w-full bg-transparent py-2 pl-4 pr-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="ml-2 p-1 rounded-full hover:bg-muted-foreground/10">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center shadow-md">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="hidden lg:block text-sm font-bold bg-gradient-to-r from-trust-600 to-healing-600 bg-clip-text text-transparent">
            سلامت هوشمند
          </span>
        </Link>
      </div>
    </motion.header>
  );
}