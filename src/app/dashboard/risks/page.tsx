"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Anchor, Clock, FileWarning, Sparkles, Train } from "lucide-react";
import { internalApiUrl } from "@/lib/api-urls";
import type { RiskFlag, Shipment } from "@/lib/types";

function matchRiskFilter(r: RiskFlag, filter: string): boolean {
  if (filter === "all") return true;
  const m = r.message.toLowerCase();
  if (filter === "delay") return m.includes("delay") || m.includes("eta");
  if (filter === "customs") return m.includes("customs") || m.includes("hold");
  if (filter === "document") return m.includes("doc");
  return true;
}

function iconFor(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("customs")) return Anchor;
  if (m.includes("doc")) return FileWarning;
  if (m.includes("eta") || m.includes("delay")) return Clock;
  if (m.includes("port") || m.includes("congest")) return Train;
  return AlertTriangle;
}

export default function RisksPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const refresh = useCallback(async () => {
    const res = await fetch(internalApiUrl("/api/shipments"), { credentials: "include" });
    const data = (await res.json()) as { shipments?: Shipment[] };
    if (res.ok && Array.isArray(data.shipments)) setShipments(data.shipments);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const alerts = useMemo(() => {
    const rows: { shipment: Shipment; risk: RiskFlag; days: number | null }[] = [];
    for (const s of shipments) {
      for (const r of s.risks) {
        if (r.level === "low") continue;
        if (!matchRiskFilter(r, filter)) continue;
        const etaMs = s.eta ? new Date(s.eta).getTime() : NaN;
        const days =
          Number.isFinite(etaMs) ? Math.ceil((etaMs - Date.now()) / (86400000)) : null;
        rows.push({ shipment: s, risk: r, days });
      }
    }
    rows.sort((a, b) => b.shipment.priorityScore - a.shipment.priorityScore);
    return rows;
  }, [shipments, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-slate-100">Risk alerts</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">High and medium priority, sorted by urgency.</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium"
        >
          <option value="all">All types</option>
          <option value="delay">Delay</option>
          <option value="customs">Customs</option>
          <option value="document">Documents</option>
        </select>
      </div>

      {loading ? (
        <p className="text-[#64748b] dark:text-slate-400">Loading…</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center text-emerald-800">
          No active risk alerts match this filter.
        </div>
      ) : (
        <ul className="space-y-4">
          {alerts.map(({ shipment: s, risk: r, days }) => {
            const Icon = iconFor(r.message);
            const tone =
              r.level === "high"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50";
            return (
              <li
                key={`${s.id}-${r.id}`}
                className={`rounded-xl border p-5 shadow-sm ${tone}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-black/5">
                      <Icon className="h-6 w-6 text-[#dc2626]" />
                    </div>
                    <div>
                      <p className="font-mono text-lg font-bold text-[#0f172a] dark:text-slate-100">{s.reference}</p>
                      <p className="mt-1 text-sm font-medium text-[#0f172a] dark:text-slate-100">{r.message}</p>
                      <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">{s.clientName || "—"}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#64748b] dark:text-slate-400">
                        {days !== null && (
                          <span className="rounded-full bg-white dark:bg-slate-900/80 px-2 py-0.5 font-medium ring-1 ring-black/5">
                            {days >= 0 ? `${days}d to ETA` : "ETA passed"}
                          </span>
                        )}
                        <span>ETA {s.eta || "—"}</span>
                      </div>
                      <p className="mt-3 text-sm text-[#334155] dark:text-slate-300">
                        <strong>Recommended:</strong> confirm documents, contact carrier, update client.
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-[#0f172a] dark:text-slate-100 shadow-sm hover:bg-[#f8fafc] dark:bg-slate-900/60"
                    >
                      Resolve
                    </button>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Ask AI
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
