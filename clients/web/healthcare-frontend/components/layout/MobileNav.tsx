"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Stethoscope, Pill, FileText, Brain, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", label: "خانه", icon: Home },
  { href: "/dashboard/visit", label: "ویزیت", icon: Stethoscope },
  { href: "/dashboard/pharmacy", label: "داروخانه", icon: Pill },
  { href: "/dashboard/records", label: "پرونده", icon: FileText },
  { href: "/dashboard/ai-chat", label: "AI", icon: Brain },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={cn("flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px]", isActive ? "text-trust-500" : "text-muted-foreground hover:text-foreground")}>
              <div className="relative">
                <item.icon className={cn("w-5 h-5", isActive && "text-trust-500")} />
                {isActive && (
                  <motion.div layoutId="mobileNavIndicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-trust-500" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "text-trust-500")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}