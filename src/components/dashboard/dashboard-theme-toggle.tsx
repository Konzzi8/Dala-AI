"use client";

import { Moon, Sun } from "lucide-react";
import { useDashboardTheme } from "./dashboard-theme-provider";

/** Theme control for the authenticated dashboard only (not marketing/login). */
export function DashboardThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useDashboardTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white dark:bg-slate-900 text-[#475569] transition hover:bg-[#f8fafc] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${className}`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
