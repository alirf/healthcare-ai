"use client";
import Link from "next/link";
import { Stethoscope, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-trust-500 to-healing-500 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">سلامت هوشمند</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">درباره ما</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">قوانین</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">حریم خصوصی</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">تماس</Link>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>© ۲۰۲۶</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>سلامت هوشمند</span>
          </div>
        </div>
      </div>
    </footer>
  );
}