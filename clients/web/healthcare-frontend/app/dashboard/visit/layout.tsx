import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import MainContentWrapper from "@/components/layout/MainContentWrapper"; // ← این import رو اضافه کن

export default async function VisitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 overflow-hidden">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}