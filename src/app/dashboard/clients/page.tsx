"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Mail, Plus, Search } from "lucide-react";
import { internalApiUrl } from "@/lib/api-urls";
import type { Shipment } from "@/lib/types";

export default function ClientsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

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

  const clients = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        shipments: Shipment[];
        lastEmail: string | null;
      }
    >();
    for (const s of shipments) {
      const name = (s.clientName || "Unassigned").trim() || "Unassigned";
      const cur = map.get(name) || { name, shipments: [], lastEmail: null as string | null };
      cur.shipments.push(s);
      const em = s.emails[0]?.receivedAt;
      if (em && (!cur.lastEmail || em > cur.lastEmail)) cur.lastEmail = em;
      map.set(name, cur);
    }
    let list = [...map.values()];
    const qq = q.trim().toLowerCase();
    if (qq) list = list.filter((c) => c.name.toLowerCase().includes(qq));
    list.sort((a, b) => b.shipments.length - a.shipments.length);
    return list;
  }, [shipments, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-slate-100">Clients</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">Derived from shipment client names.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4" />
          Add client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] dark:text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          className="w-full rounded-xl border border-[#e2e8f0] dark:border-slate-700 py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-[#64748b] dark:text-slate-400">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const high = c.shipments.filter((s) => s.risks.some((r) => r.level === "high")).length;
            const risk =
              high > 0 ? "high" : c.shipments.some((s) => s.risks.some((r) => r.level === "medium"))
                ? "medium"
                : "low";
            const riskCls =
              risk === "high"
                ? "text-red-700"
                : risk === "medium"
                  ? "text-amber-700"
                  : "text-emerald-700";
            return (
              <div
                key={c.name}
                className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-[#0f172a] dark:text-slate-100">{c.name}</h2>
                    <p className="text-sm text-[#64748b] dark:text-slate-400">
                      {c.shipments.length} active shipment{c.shipments.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-[#475569] dark:text-slate-300">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#94a3b8] dark:text-slate-500" />
                    Last email:{" "}
                    {c.lastEmail ? new Date(c.lastEmail).toLocaleDateString() : "—"}
                  </p>
                  <p className={`font-medium capitalize ${riskCls}`}>Portfolio risk: {risk}</p>
                </div>
                <Link
                  href={`/dashboard/shipments?q=${encodeURIComponent(c.name)}`}
                  className="mt-4 inline-block text-sm font-semibold text-[#2563eb] hover:underline"
                >
                  View shipments
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
