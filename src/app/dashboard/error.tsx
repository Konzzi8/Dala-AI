"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50/80 px-6 py-12 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" aria-hidden />
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold text-[#0f172a] dark:text-slate-100">This view couldn&apos;t load</h2>
        <p className="text-sm text-[#64748b] dark:text-slate-400">
          Try again. If the problem continues, check your connection and Supabase configuration.
        </p>
        {process.env.NODE_ENV === "development" && error.message ? (
          <p className="break-all font-mono text-xs text-red-700 dark:text-red-300">{error.message}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
      >
        Try again
      </button>
    </div>
  );
}
