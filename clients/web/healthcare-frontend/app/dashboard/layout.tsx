import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import Footer from "@/components/layout/Footer";

export default async function DashboardLayout({
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
      <div className="flex flex-1 pt-[60px]">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 p-4 md:p-6 lg:pr-[280px] lg:pl-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}