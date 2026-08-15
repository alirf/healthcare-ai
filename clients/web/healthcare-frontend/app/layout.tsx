import type { Metadata } from "next";
import { Vazirmatn, Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const vazirmatn = Vazirmatn({
  subsets: ["latin", "arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سلامت هوشمند | پلتفرم ویزیت آنلاین پزشکی با هوش مصنوعی",
  description: "پلتفرم ویزیت آنلاین پزشکی با تحلیل هوشمند شرح حال توسط AI.",
  keywords: ["ویزیت آنلاین", "پزشکی", "هوش مصنوعی", "سلامت", "داروخانه آنلاین"],
  openGraph: {
    title: "سلامت هوشمند | پلتفرم ویزیت آنلاین پزشکی",
    description: "ویزیت آنلاین با تحلیل هوشمند AI",
    type: "website",
    locale: "fa_IR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${vazirmatn.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}