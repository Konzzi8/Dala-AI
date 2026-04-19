"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Mail,
  Package,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { DashboardGettingStarted } from "@/components/dashboard/dashboard-getting-started";
import { WorldMapPreview } from "@/components/dashboard/world-map-preview";
import { internalApiUrl } from "@/lib/api-urls";
import {
  buildActivityFeed,
  countArrivingThisWeek,
  deltaVsYesterdayLabel,
} from "@/lib/dashboard-utils";
import type { Shipment } from "@/lib/types";

type EmailRow = {
  id: string;
  subject: string;
  sender: string;
  receivedAt: string;
  shipmentReference: string | null;
  isUrgent: boolean;
};

function MetricCard({
  title,
  value,
  delta,
  href,
  accent,
  icon: Icon,
  pulse,
}: {
  title: string;
  value: number;
  delta: string;
  href: string;
  accent: "blue" | "red" | "amber" | "green";
  icon: typeof Package;
  pulse?: boolean;
}) {
  const ring =
    accent === "blue"
      ? "border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#2563eb]/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-900"
      : accent === "red"
        ? "border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-red-200 dark:border-slate-700 dark:bg-slate-900"
        : accent === "amber"
          ? "border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-amber-200 dark:border-slate-700 dark:bg-slate-900"
          : "border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-900";
  const iconBg =
    accent === "blue"
      ? "bg-[#eff6ff] text-[#2563eb]"
      : accent === "red"
        ? "bg-red-50 text-[#dc2626]"
        : accent === "amber"
          ? "bg-amber-50 text-[#d97706]"
          : "bg-emerald-50 text-[#16a34a]";

  return (
    <Link
      href={href}
      className={`group flex min-h-[120px] flex-col rounded-xl border p-6 transition duration-150 ease-out hover:-translate-y-px ${ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#64748b] dark:text-slate-400">{title}</p>
          <p
            className={`mt-2 text-[36px] font-bold tabular-nums leading-none tracking-tight text-[#0f172a] dark:text-slate-100 ${
              pulse ? "motion-safe:animate-pulse" : ""
            }`}
          >
            {value}
          </p>
          <p className="mt-2 flex items-center gap-1 text-[13px] text-[#94a3b8] dark:text-slate-500">
            <TrendingUp className="h-3.5 w-3.5" />
            {delta} {deltaVsYesterdayLabel()}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} transition group-hover:scale-105`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardHomePage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("there");

  const [unreadEmails, setUnreadEmails] = useState(0);

  const refresh = useCallback(async () => {
    const safeJson = async <T,>(res: Response): Promise<T | null> => {
      try {
        return (await res.json()) as T;
      } catch {
        return null;
      }
    };

    const [sRes, eRes, meRes, nRes] = await Promise.all([
      fetch(internalApiUrl("/api/shipments"), { credentials: "include" }),
      fetch(internalApiUrl("/api/emails"), { credentials: "include" }),
      fetch(internalApiUrl("/api/me"), { credentials: "include" }),
      fetch(internalApiUrl("/api/notifications"), { credentials: "include" }),
    ]);
    const sData = await safeJson<{ shipments?: Shipment[] }>(sRes);
    const eData = await safeJson<{
      emails?: Array<{
        id: string;
        subject: string;
        sender: string;
        receivedAt: string;
        shipmentReference: string | null;
        isUrgent: boolean;
      }>;
    }>(eRes);
    const meData = await safeJson<{ firstName?: string }>(meRes);
    const nData = await safeJson<{ unreadEmails?: number }>(nRes);
    if (nRes.ok && nData && typeof nData.unreadEmails === "number") setUnreadEmails(nData.unreadEmails);
    if (sRes.ok && sData && Array.isArray(sData.shipments)) setShipments(sData.shipments);
    if (eRes.ok && eData && Array.isArray(eData.emails))
      setEmails(
        eData.emails.slice(0, 8).map((e) => ({
          id: e.id,
          subject: e.subject,
          sender: e.sender,
          receivedAt: e.receivedAt,
          shipmentReference: e.shipmentReference,
          isUrgent: e.isUrgent,
        })),
      );
    if (meRes.ok && meData?.firstName) setFirstName(meData.firstName);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch {
        /* network / abort — still show dashboard shell */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const metrics = useMemo(() => {
    const high = shipments.filter((s) => s.risks.some((r) => r.level === "high")).length;
    const week = countArrivingThisWeek(shipments);
    return {
      active: shipments.length,
      high,
      pendingEmails: unreadEmails,
      week,
    };
  }, [shipments, unreadEmails]);

  const attention = useMemo(() => {
    return [...shipments]
      .filter((s) => s.risks.some((r) => r.level === "high" || r.level === "medium"))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 6);
  }, [shipments]);

  const activity = useMemo(() => buildActivityFeed(shipments), [shipments]);
  const recentEmails = emails.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 rounded-lg skeleton-b2b dark:opacity-80" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[120px] rounded-xl skeleton-b2b dark:opacity-80" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-72 rounded-xl skeleton-b2b dark:opacity-80" />
          <div className="h-72 rounded-xl skeleton-b2b dark:opacity-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-[36px] font-bold leading-[1.2] tracking-[-0.02em] text-[#0f172a] dark:text-slate-100">
          Good morning, {firstName}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-[#64748b] dark:text-slate-400">
          Here is what needs your attention today.
        </p>
      </div>

      {shipments.length === 0 ? <DashboardGettingStarted /> : null}

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Shipments"
          value={metrics.active}
          delta="+0"
          href="/dashboard/shipments"
          accent="blue"
          icon={Package}
        />
        <MetricCard
          title="High Risk Shipments"
          value={metrics.high}
          delta="+0"
          href="/dashboard/risks"
          accent="red"
          icon={AlertTriangle}
          pulse={metrics.high > 0}
        />
        <MetricCard
          title="Emails Pending Review"
          value={metrics.pendingEmails}
          delta="+0"
          href="/dashboard/emails"
          accent="amber"
          icon={Mail}
        />
        <MetricCard
          title="Arriving This Week"
          value={metrics.week}
          delta="+0"
          href="/dashboard/shipments?eta=week"
          accent="green"
          icon={Calendar}
        />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[18px] font-semibold leading-snug text-[#0f172a] dark:text-slate-100">Needs attention now</h2>
            <Link
              href="/dashboard/risks"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#2563eb] hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {attention.length === 0 ? (
              <li className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-emerald-800">
                <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">All shipments on track</p>
                  <p className="text-sm text-emerald-700/90">No high-priority risks in your queue.</p>
                </div>
              </li>
            ) : (
              attention.map((s) => {
                const top = s.risks.find((r) => r.level === "high") || s.risks[0];
                const tone = top?.level === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50";
                return (
                  <li key={s.id}>
                    <Link
                      href={`/dashboard/shipments?id=${encodeURIComponent(s.id)}`}
                      className={`flex flex-col gap-1 rounded-lg border px-4 py-3 transition hover:shadow-sm ${tone}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-[#0f172a] dark:text-slate-100">{s.reference}</span>
                        <span className="text-xs text-[#64748b] dark:text-slate-400">{s.eta || "—"}</span>
                      </div>
                      <p className="text-sm text-[#475569] dark:text-slate-300">{top?.message || "Risk"}</p>
                      <p className="text-xs text-[#64748b] dark:text-slate-400">{s.clientName || "Client"}</p>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[18px] font-semibold leading-snug text-[#0f172a] dark:text-slate-100">Recent email activity</h2>
            <Link
              href="/dashboard/emails"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#2563eb] hover:underline"
            >
              View all emails
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentEmails.length === 0 ? (
              <li className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-900/40">
                <Mail className="mb-4 h-10 w-10 text-[#94a3b8]" aria-hidden />
                <p className="text-[15px] font-semibold text-[#0f172a] dark:text-slate-100">No emails yet</p>
                <p className="mt-2 max-w-sm text-[14px] leading-[1.6] text-[#64748b] dark:text-slate-400">
                  Connect Outlook or ingest a sample email to populate this feed.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#2563eb] px-5 text-[14px] font-medium text-white transition hover:bg-[#1d4ed8]"
                >
                  Open integrations
                </Link>
              </li>
            ) : (
              recentEmails.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/dashboard/emails?e=${encodeURIComponent(e.id)}`}
                    className="block rounded-lg border border-[#f1f5f9] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/60 px-4 py-3 transition hover:border-[#cbd5e1]"
                  >
                    <p className="line-clamp-1 font-medium text-[#0f172a] dark:text-slate-100">{e.subject}</p>
                    <p className="text-xs text-[#64748b] dark:text-slate-400">{e.sender}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#94a3b8] dark:text-slate-500">
                      <time dateTime={e.receivedAt}>
                        {new Date(e.receivedAt).toLocaleString()}
                      </time>
                      {e.shipmentReference && (
                        <span className="rounded bg-white dark:bg-slate-900 px-1.5 py-0.5 font-mono text-[#2563eb] ring-1 ring-[#e2e8f0]">
                          {e.shipmentReference}
                        </span>
                      )}
                      <span
                        className={
                          e.isUrgent ? "font-semibold text-amber-700" : "text-[#16a34a]"
                        }
                      >
                        {e.isUrgent ? "Needs review" : "Parsed"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-[18px] font-semibold text-[#0f172a] dark:text-slate-100">Shipment map</h2>
          <p className="mt-4 text-[14px] leading-[1.5] text-[#64748b] dark:text-slate-400">
            Active routes by risk (sample projection).
          </p>
          <div className="mt-4">
            <WorldMapPreview shipments={shipments} />
          </div>
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-[18px] font-semibold text-[#0f172a] dark:text-slate-100">Activity timeline</h2>
          </div>
          <ul className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {activity.length === 0 ? (
              <li className="text-sm text-[#64748b] dark:text-slate-400">No recent activity.</li>
            ) : (
              activity.map((a) => (
                <li
                  key={a.id}
                  className="flex gap-3 border-l-2 border-[#e2e8f0] dark:border-slate-700 pl-3 text-sm text-[#475569] dark:text-slate-300"
                >
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      a.type === "email"
                        ? "bg-[#2563eb]"
                        : a.type === "document"
                          ? "bg-[#dc2626]"
                          : "bg-[#16a34a]"
                    }`}
                  />
                  <div>
                    <p>{a.message}</p>
                    <time className="text-xs text-[#94a3b8] dark:text-slate-500" dateTime={a.time}>
                      {new Date(a.time).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
