"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Download, X } from "lucide-react";
import { completionPct, ensureDocumentSlots } from "@/lib/dashboard-utils";
import { internalApiUrl } from "@/lib/api-urls";
import type { Shipment } from "@/lib/types";

const COLS = [
  "Bill of Lading",
  "Commercial Invoice",
  "Packing List",
  "Customs Declaration",
  "Certificate of Origin",
];

export default function DocumentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

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

  const overall = useMemo(() => {
    if (shipments.length === 0) return 0;
    const sum = shipments.reduce((acc, s) => acc + completionPct(s), 0);
    return Math.round(sum / shipments.length);
  }, [shipments]);

  const rows = useMemo(() => {
    let list = shipments.map((s) => ({
      s,
      slots: ensureDocumentSlots(s),
      pct: completionPct(s),
    }));
    if (onlyIncomplete) list = list.filter((r) => r.pct < 100);
    return list.sort((a, b) => a.pct - b.pct);
  }, [shipments, onlyIncomplete]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-slate-100">Documents</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">Checklist status across all shipments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm text-[#475569] dark:text-slate-300">
            <input
              type="checkbox"
              checked={onlyIncomplete}
              onChange={(e) => setOnlyIncomplete(e.target.checked)}
            />
            Incomplete only
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-[#f8fafc] dark:bg-slate-900/60"
          >
            <Download className="h-4 w-4" />
            Export report
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">Overall completion</p>
        <div className="mt-2 flex items-center gap-4">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
            <div
              className="h-full rounded-full bg-[#16a34a] transition-[width]"
              style={{ width: `${overall}%` }}
            />
          </div>
          <span className="text-2xl font-bold tabular-nums text-[#0f172a] dark:text-slate-100">{overall}%</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/60 text-xs font-semibold uppercase tracking-wide text-[#64748b] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Shipment</th>
                {COLS.map((c) => (
                  <th key={c} className="px-4 py-3">
                    {c}
                  </th>
                ))}
                <th className="px-4 py-3">%</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                    No rows.
                  </td>
                </tr>
              ) : (
                rows.map(({ s, slots, pct }) => (
                  <tr key={s.id} className="border-b border-[#f1f5f9] dark:border-slate-700">
                    <td className="px-4 py-3 font-mono font-medium">
                      <Link href={`/dashboard/shipments?id=${encodeURIComponent(s.id)}`} className="text-[#2563eb] hover:underline">
                        {s.reference}
                      </Link>
                    </td>
                    {COLS.map((name) => {
                      const slot = slots.find((d) => d.name === name);
                      const ok = slot?.received ?? false;
                      return (
                        <td key={name} className="px-4 py-3">
                          {ok ? (
                            <Check className="h-5 w-5 text-[#16a34a]" aria-label="Yes" />
                          ) : (
                            <X className="h-5 w-5 text-[#dc2626]" aria-label="No" />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 font-semibold tabular-nums">{pct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
