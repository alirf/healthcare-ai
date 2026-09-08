import { ThemeProvider } from "next-themes";
import "../globals.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-trust-50 via-background to-healing-50 dark:from-trust-900/10 dark:via-background dark:to-healing-900/10 p-4">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </div>
  );
}