"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Key, Moon, Shield, Sun, User } from "lucide-react";
import { internalApiUrl } from "@/lib/api-urls";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";

type Tab = "profile" | "integrations" | "notifications";

export default function SettingsPage() {
  const { theme, setTheme } = useDashboardTheme();
  const [tab, setTab] = useState<Tab>("profile");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [syncFreq, setSyncFreq] = useState("15");
  const [notif, setNotif] = useState({
    emailNew: true,
    risk: true,
    doc: true,
    eta: true,
    daily: false,
  });

  const load = useCallback(async () => {
    const res = await fetch(internalApiUrl("/api/me"), { credentials: "include" });
    const data = (await res.json()) as { firstName?: string; email?: string; fullName?: string | null };
    if (res.ok) {
      if (data.email) setEmail(data.email);
      if (data.fullName) setFullName(data.fullName);
      else if (data.firstName) setFullName(data.firstName);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dala-notif-prefs");
      if (raw) setNotif((n) => ({ ...n, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dala-notif-prefs", JSON.stringify(notif));
    } catch {
      /* ignore */
    }
  }, [notif]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "integrations", label: "Integrations" },
    { id: "notifications", label: "Notifications" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-slate-100">Settings</h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400">Account, integrations, and notification preferences.</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-white text-[#0f172a] shadow-sm ring-1 ring-[#e2e8f0] dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
                : "text-[#64748b] hover:text-[#0f172a] dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[#0f172a] dark:text-slate-100">
            <User className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/40 p-4">
            <p className="text-sm font-medium text-[#0f172a] dark:text-slate-100">Appearance</p>
            <p className="mt-1 text-xs text-[#64748b] dark:text-slate-400">Applies to the dashboard only.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                  theme === "light"
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                    : "border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#64748b] dark:text-slate-300"
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                  theme === "dark"
                    ? "border-[#2563eb] bg-[#1e3a5f] text-sky-200"
                    : "border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#64748b] dark:text-slate-300"
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] dark:text-slate-300">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] dark:text-slate-300">Email</label>
              <input
                value={email}
                readOnly
                className="mt-1 w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/60 px-4 py-2.5 text-sm text-[#64748b] dark:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] dark:text-slate-300">Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-4 py-2.5 text-sm"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] dark:text-slate-300">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-4 py-2.5 text-sm"
                placeholder="Leave blank to keep current"
              />
            </div>
            <button
              type="button"
              className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Save changes
            </button>
            <p className="text-xs text-[#94a3b8] dark:text-slate-500">Profile updates persist to Supabase when wired to profiles update API.</p>
          </div>
        </div>
      )}

      {tab === "integrations" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#2563eb]" />
              <h2 className="text-lg font-semibold text-[#0f172a] dark:text-slate-100">Microsoft Outlook</h2>
            </div>
            <p className="mt-2 text-sm text-[#64748b] dark:text-slate-400">
              Connect your inbox for automatic parsing and email-linked shipments.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/api/integrations/microsoft/start"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Connect Outlook
              </a>
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Last sync: check server logs
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#475569] dark:text-slate-300">Sync frequency</label>
                <select
                  value={syncFreq}
                  onChange={(e) => setSyncFreq(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-3 py-2 text-sm"
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] dark:text-slate-300">Folders</label>
                <p className="mt-2 text-sm text-[#64748b] dark:text-slate-400">Inbox (default) — extend in Graph sync config.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a] dark:text-slate-100">Supabase</h2>
            <p className="mt-2 text-sm text-[#64748b] dark:text-slate-400">
              Database connection uses your session. <Link href="/dashboard" className="text-[#2563eb] hover:underline">View dashboard</Link>
            </p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Connected (when env keys are valid)
            </p>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#2563eb]" />
              <h2 className="text-lg font-semibold text-[#0f172a] dark:text-slate-100">Claude AI</h2>
            </div>
            <p className="mt-2 text-sm text-[#64748b] dark:text-slate-400">
              Copilot uses <code className="rounded bg-[#f1f5f9] px-1 text-xs">ANTHROPIC_API_KEY</code> on the server.
            </p>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0f172a] dark:text-slate-100">Notification preferences</h2>
          <p className="mt-1 text-sm text-[#64748b] dark:text-slate-400">Stored locally in this browser until you add a Supabase table.</p>
          <ul className="mt-6 space-y-4">
            {(
              [
                ["emailNew", "New email received", notif.emailNew] as const,
                ["risk", "High risk shipment detected", notif.risk] as const,
                ["doc", "Missing document alert", notif.doc] as const,
                ["eta", "ETA change detected", notif.eta] as const,
                ["daily", "Daily summary email", notif.daily] as const,
              ] as const
            ).map(([key, label, on]) => (
              <li
                key={key}
                className="flex items-center justify-between gap-4 border-b border-[#f1f5f9] dark:border-slate-700 pb-4 last:border-0"
              >
                <span className="text-sm font-medium text-[#334155] dark:text-slate-300">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() =>
                    setNotif((n) => ({
                      ...n,
                      [key]: !n[key as keyof typeof n],
                    }))
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    on ? "bg-[#2563eb]" : "bg-[#cbd5e1]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white dark:bg-slate-900 shadow transition ${
                      on ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
