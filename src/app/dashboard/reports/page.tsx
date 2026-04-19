import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";

function ReportsFallback() {
  return (
    <div className="flex min-h-[320px] flex-col gap-2">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
      <div className="flex flex-1 items-center justify-center py-20 text-[#64748b]">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsFallback />}>
      <ReportsDashboard />
    </Suspense>
  );
}
