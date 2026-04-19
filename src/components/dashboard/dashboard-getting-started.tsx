"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Mail, Plug, Sparkles } from "lucide-react";
import type { PublicAppConfig } from "@/lib/public-config";

export function DashboardGettingStarted() {
  const [cfg, setCfg] = useState<PublicAppConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/config");
        const data = (await res.json()) as PublicAppConfig;
        if (!cancelled) setCfg(data);
      } catch {
        if (!cancelled) setCfg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const f = cfg?.features;

  return (
    <div className="rounded-xl border border-[#bfdbfe] bg-gradient-to-br from-[#eff6ff] to-white p-5 shadow-sm dark:border-slate-600 dark:from-slate-900 dark:to-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a] dark:text-slate-100">Get started</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#475569] dark:text-slate-400">
            You don&apos;t have shipments yet. Connect your stack so Dala can parse mail and build your board.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="shrink-0 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
        >
          Open settings
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        <li className="flex gap-3 rounded-lg border border-white/80 bg-white/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/60">
          <Plug className="mt-0.5 h-5 w-5 shrink-0 text-[#2563eb]" aria-hidden />
          <div>
            <p className="text-sm font-medium text-[#0f172a] dark:text-slate-100">Microsoft Outlook</p>
            <p className="mt-0.5 text-xs text-[#64748b] dark:text-slate-400">
              {f?.outlookOAuth
                ? "OAuth is configured on the server — connect your account in Settings → Integrations."
                : "Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET on the server, then connect."}
            </p>
            {f && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#64748b] dark:text-slate-400">
                {f.outlookOAuth ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-slate-400" />
                )}
                Server OAuth {f.outlookOAuth ? "ready" : "not configured"}
              </p>
            )}
          </div>
        </li>
        <li className="flex gap-3 rounded-lg border border-white/80 bg-white/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/60">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#2563eb]" aria-hidden />
          <div>
            <p className="text-sm font-medium text-[#0f172a] dark:text-slate-100">AI copilot & parsing</p>
            <p className="mt-0.5 text-xs text-[#64748b] dark:text-slate-400">
              Anthropic powers chat and (with your key) email extraction; OpenAI is an optional fallback for
              ingest. Heuristics always apply if neither is set.
            </p>
            {f && (
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#64748b] dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  {f.aiChat ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5" />}
                  Chat
                </span>
                <span className="inline-flex items-center gap-1">
                  {f.aiEmailParse ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5" />}
                  Parse
                </span>
              </p>
            )}
          </div>
        </li>
        <li className="flex gap-3 rounded-lg border border-white/80 bg-white/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/60 sm:col-span-2">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#2563eb]" aria-hidden />
          <div>
            <p className="text-sm font-medium text-[#0f172a] dark:text-slate-100">Scheduled sync</p>
            <p className="mt-0.5 text-xs text-[#64748b] dark:text-slate-400">
              {f?.cronSync
                ? "CRON_SECRET is set — schedule GET /api/cron/sync-outlook with your host."
                : "Set CRON_SECRET and run the Outlook sync route on a schedule."}
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
