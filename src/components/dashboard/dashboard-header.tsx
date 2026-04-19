"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDashboardHeaderDateLine, formatDashboardHeaderTimeLine } from "@/lib/format-date";
import { internalApiUrl } from "@/lib/api-urls";
import { DashboardThemeToggle } from "./dashboard-theme-toggle";

type NotifRow = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  time: string;
};

type Props = {
  firstName: string;
  email: string;
};

export function DashboardHeader({ firstName, email }: Props) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [q, setQ] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<NotifRow[]>([]);
  const [badge, setBadge] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(internalApiUrl("/api/notifications"), { credentials: "include" });
        const data = (await res.json()) as { items?: NotifRow[]; badgeCount?: number };
        if (!cancelled && res.ok) {
          setNotifItems(Array.isArray(data.items) ? data.items : []);
          setBadge(typeof data.badgeCount === "number" ? data.badgeCount : 0);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const s = q.trim();
    if (!s) return;
    router.push(`/dashboard/shipments?q=${encodeURIComponent(s)}`);
  }

  const avatarLetter = firstName.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-[#e2e8f0] bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-16 min-w-0 items-center gap-3 px-4 sm:gap-4 sm:px-8">
        <form
          onSubmit={onSearch}
          className="relative min-w-0 max-w-[320px] shrink sm:w-[320px] sm:shrink-0"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shipments, emails, clients..."
            className="h-10 w-full rounded-lg border border-transparent bg-[#f1f5f9] py-0 pl-10 pr-4 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] transition duration-150 ease-out focus:border-[#2563eb] focus:outline-none focus:ring-[3px] focus:ring-[rgba(37,99,235,0.1)] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>

        <div className="min-w-0 flex-1" aria-hidden="true" />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
          <div
            className="hidden shrink-0 text-right lg:block"
            title={`${formatDashboardHeaderDateLine(now)} ${formatDashboardHeaderTimeLine(now)}`}
          >
            <time
              dateTime={now.toISOString()}
              className="inline-flex flex-col items-end gap-0.5 tabular-nums"
            >
              <span className="whitespace-nowrap text-[12px] font-medium leading-none text-[#475569] dark:text-slate-400">
                {formatDashboardHeaderDateLine(now)}
              </span>
              <span className="whitespace-nowrap text-[12px] font-medium leading-none text-[#94a3b8] dark:text-slate-500">
                {formatDashboardHeaderTimeLine(now)}
              </span>
            </time>
          </div>

          <DashboardThemeToggle />

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                setUserOpen(false);
              }}
              title="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] transition duration-150 ease-out hover:bg-[#f8fafc] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Bell className="h-[18px] w-[18px]" />
              {badge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[11px] font-bold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 z-50 w-[min(100vw-2rem,380px)] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[var(--shadow-card-hover)] dark:border-slate-600 dark:bg-slate-800">
                <div className="border-b border-[#e2e8f0] px-5 py-4 dark:border-slate-600">
                  <p className="text-[15px] font-semibold text-[#0f172a] dark:text-slate-100">Notifications</p>
                  <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">Emails, risk, documents, ETA</p>
                </div>
                <ul className="max-h-80 overflow-y-auto scroll-sleek">
                  {notifItems.length === 0 ? (
                    <li className="px-5 py-10 text-center text-[14px] text-[#64748b] dark:text-slate-400">
                      You&apos;re all caught up.
                    </li>
                  ) : (
                    notifItems.map((n) => (
                      <li
                        key={n.id}
                        className="border-b border-[#f1f5f9] px-5 py-4 text-[14px] last:border-0 hover:bg-[#f8fafc] dark:border-slate-600 dark:hover:bg-slate-700/80"
                      >
                        <p className="font-medium text-[#0f172a] dark:text-slate-100">{n.title}</p>
                        {n.subtitle && <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">{n.subtitle}</p>}
                        <p className="mt-2 text-[11px] text-[#94a3b8]">
                          {new Date(n.time).toLocaleString()}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => {
                setUserOpen((o) => !o);
                setNotifOpen(false);
              }}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white py-0 pl-1.5 pr-2 text-left transition duration-150 ease-out hover:bg-[#f8fafc] dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 sm:pr-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff] text-[13px] font-semibold text-[#2563eb] dark:bg-slate-700 dark:text-sky-300">
                {avatarLetter}
              </div>
              <span className="hidden max-w-[140px] truncate text-[14px] font-medium text-[#0f172a] dark:text-slate-100 sm:inline">
                {firstName}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-[#94a3b8] sm:block" />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-[var(--shadow-card-hover)] dark:border-slate-600 dark:bg-slate-800">
                <div className="border-b border-[#f1f5f9] px-5 py-4 dark:border-slate-600">
                  <p className="truncate text-[14px] font-semibold text-[#0f172a] dark:text-slate-100">{firstName}</p>
                  <p className="truncate text-[13px] text-[#64748b] dark:text-slate-400">{email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-5 py-3 text-[14px] text-[#334155] transition hover:bg-[#f8fafc] dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setUserOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile settings
                </Link>
                <a
                  href="/api/integrations/microsoft/start"
                  className="flex items-center gap-2 px-5 py-3 text-[14px] text-[#334155] transition hover:bg-[#f8fafc] dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Connect Outlook
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
