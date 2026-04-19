"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV } from "./dashboard-nav";

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#e2e8f0] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 md:hidden">
      <div className="relative flex w-full items-stretch justify-around">
        {MOBILE_NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                active ? "text-[#2563eb]" : "text-[#64748b] dark:text-slate-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-[#2563eb]" : ""}`} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
