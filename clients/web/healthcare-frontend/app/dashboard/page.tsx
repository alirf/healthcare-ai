import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Slideshow from "@/components/dashboard/Slideshow";
import BigActionButtons from "@/components/dashboard/BigActionButtons";
import RecentActivity from "@/components/dashboard/RecentActivity";
import PatientWallet from "@/components/dashboard/PatientWallet";
import Reminders from "@/components/dashboard/Reminders";
import HealthSummary from "@/components/dashboard/HealthSummary";
import AIRecommendation from "@/components/dashboard/AIRecommendation";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[200px] w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] rounded-xl xl:col-span-2" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* ===== MAIN COLUMN (Larger - Right side in RTL) ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (Main Content) - takes 2/3 on xl */}
          <div className="xl:col-span-2 space-y-6">
            {/* Slideshow */}
            <Slideshow />
            
            {/* Big Action Buttons */}
            <BigActionButtons />
            
            {/* Recent Activity */}
            <RecentActivity />
          </div>

          {/* RIGHT COLUMN (Widgets) - takes 1/3 on xl */}
          <div className="space-y-4">
            {/* Patient Wallet */}
            <PatientWallet />
            
            {/* Reminders */}
            <Reminders />
            
            {/* Health Summary */}
            <HealthSummary />
            
            {/* AI Recommendation */}
            <AIRecommendation />
          </div>
        </div>
      </div>
    </Suspense>
  );
}