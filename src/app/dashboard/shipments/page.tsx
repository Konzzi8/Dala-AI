"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Package,
  Plus,
  Search,
} from "lucide-react";
import { ShipmentDetailPanel } from "@/components/dashboard/shipment-detail-panel";
import { internalApiUrl } from "@/lib/api-urls";
import { formatEtaDisplay, parseEtaDate } from "@/lib/format-date";
import type { Shipment } from "@/lib/types";

function shipmentRiskLevel(s: Shipment): "high" | "medium" | "low" {
  if (s.risks.some((r) => r.level === "high")) return "high";
  if (s.risks.some((r) => r.level === "medium")) return "medium";
  return "low";
}

const PAGE_SIZE = 10;

type SortKey = "reference" | "client" | "origin" | "destination" | "eta" | "risk" | "status";

function ShipmentsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const idParam = searchParams.get("id") || "";
  const etaParam = searchParams.get("eta") || "";
  const highlightParam = searchParams.get("highlight") || "";

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(qParam);
  const [sortKey, setSortKey] = useState<SortKey>("reference");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Shipment | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterCarrier, setFilterCarrier] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDest, setFilterDest] = useState("");
  const [flashRowId, setFlashRowId] = useState<string | null>(null);

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

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  useEffect(() => {
    if (!idParam) {
      setSelected(null);
      return;
    }
    const s = shipments.find((x) => x.id === idParam);
    if (s) setSelected(s);
  }, [idParam, shipments]);

  useEffect(() => {
    if (!highlightParam) {
      setFlashRowId(null);
      return;
    }
    setFlashRowId(highlightParam);
    const scrollEl = document.querySelector(`[data-shipment-row="${highlightParam}"]`);
    scrollEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const t = setTimeout(() => {
      setFlashRowId(null);
      const p = new URLSearchParams(window.location.search);
      p.delete("highlight");
      const qs = p.toString();
      router.replace(qs ? `/dashboard/shipments?${qs}` : "/dashboard/shipments");
    }, 2600);
    return () => clearTimeout(t);
  }, [highlightParam, router]);

  const carriers = useMemo(() => {
    const set = new Set<string>();
    for (const s of shipments) {
      if (s.clientName) set.add(s.clientName);
    }
    return [...set].sort();
  }, [shipments]);

  const filtered = useMemo(() => {
    let list = [...shipments];
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (s) =>
          s.reference.toLowerCase().includes(qq) ||
          (s.clientName || "").toLowerCase().includes(qq) ||
          (s.origin || "").toLowerCase().includes(qq) ||
          (s.destination || "").toLowerCase().includes(qq) ||
          s.containerNumbers.some((c) => c.toLowerCase().includes(qq)),
      );
    }
    if (filterStatus !== "all") {
      list = list.filter((s) => (s.customsStatus || "unknown") === filterStatus);
    }
    if (filterRisk !== "all") {
      list = list.filter((s) => shipmentRiskLevel(s) === filterRisk);
    }
    if (filterCarrier) {
      list = list.filter((s) => (s.clientName || "").toLowerCase().includes(filterCarrier.toLowerCase()));
    }
    if (filterOrigin) {
      list = list.filter((s) => (s.origin || "").toLowerCase().includes(filterOrigin.toLowerCase()));
    }
    if (filterDest) {
      list = list.filter((s) => (s.destination || "").toLowerCase().includes(filterDest.toLowerCase()));
    }
    if (etaParam === "week") {
      const now = Date.now();
      const week = 7 * 24 * 60 * 60 * 1000;
      list = list.filter((s) => {
        if (!s.eta) return false;
        const d = parseEtaDate(s.eta);
        const t = d?.getTime();
        return t !== undefined && Number.isFinite(t) && t >= now && t <= now + week;
      });
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "reference":
          cmp = a.reference.localeCompare(b.reference);
          break;
        case "client":
          cmp = (a.clientName || "").localeCompare(b.clientName || "");
          break;
        case "origin":
          cmp = (a.origin || "").localeCompare(b.origin || "");
          break;
        case "destination":
          cmp = (a.destination || "").localeCompare(b.destination || "");
          break;
        case "eta":
          cmp = (a.eta || "").localeCompare(b.eta || "");
          break;
        case "risk":
          cmp = a.priorityScore - b.priorityScore;
          break;
        case "status":
          cmp = (a.customsStatus || "").localeCompare(b.customsStatus || "");
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [
    shipments,
    q,
    filterStatus,
    filterRisk,
    filterCarrier,
    filterOrigin,
    filterDest,
    etaParam,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, filterStatus, filterRisk, etaParam]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  function riskBadge(s: Shipment) {
    const lvl = s.risks.some((r) => r.level === "high")
      ? "high"
      : s.risks.some((r) => r.level === "medium")
        ? "medium"
        : "low";
    const cls =
      lvl === "high"
        ? "border border-[#fecaca] bg-[#fef2f2] text-[#dc2626]"
        : lvl === "medium"
          ? "border border-[#fde68a] bg-[#fffbeb] text-[#d97706]"
          : "border border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]";
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium capitalize ${cls}`}>
        {lvl}
      </span>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] gap-0">
      <aside className="hidden w-56 shrink-0 border-r border-[#e2e8f0] dark:border-slate-700 pr-4 lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] dark:text-slate-100">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="held">Held</option>
            <option value="cleared">Cleared</option>
            <option value="unknown">Unknown</option>
          </select>
          <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400">Risk</label>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400">Carrier / client</label>
          <select
            value={filterCarrier}
            onChange={(e) => setFilterCarrier(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {carriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400">Origin contains</label>
          <input
            value={filterOrigin}
            onChange={(e) => setFilterOrigin(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-3 py-2 text-sm"
            placeholder="e.g. Shanghai"
          />
          <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400">Destination contains</label>
          <input
            value={filterDest}
            onChange={(e) => setFilterDest(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-3 py-2 text-sm"
            placeholder="e.g. Los Angeles"
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[36px] font-bold leading-[1.2] tracking-[-0.02em] text-[#0f172a] dark:text-slate-100">
              Shipments
            </h1>
            <p className="mt-4 text-[14px] text-[#64748b] dark:text-slate-400">
              Showing {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-[#475569] dark:text-slate-300 shadow-sm hover:bg-[#f8fafc] dark:bg-slate-900/60"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
            >
              <Plus className="h-4 w-4" />
              Add shipment
            </Link>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] dark:text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search table…"
            className="w-full rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-[14px]">
              <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[12px] font-semibold uppercase tracking-[0.05em] text-[#64748b] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
                <tr>
                  <th className="min-w-[9rem] px-5 py-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 whitespace-nowrap"
                      onClick={() => toggleSort("reference")}
                    >
                      Reference <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </th>
                  <th className="px-5 py-4">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("client")}>
                      Client <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("origin")}>
                      Origin <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("destination")}>
                      Destination <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4">Carrier</th>
                  <th className="min-w-[6.5rem] px-5 py-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 whitespace-nowrap"
                      onClick={() => toggleSort("eta")}
                    >
                      ETA <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </th>
                  <th className="px-5 py-4">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>
                      Status <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("risk")}>
                      Risk <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-[#64748b] dark:text-slate-400">
                      Loading…
                    </td>
                  </tr>
                ) : pageSlice.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="h-10 w-10 text-[#94a3b8]" aria-hidden />
                        <p className="text-[15px] font-semibold text-[#0f172a] dark:text-slate-100">No shipments match</p>
                        <p className="max-w-md text-[14px] text-[#64748b] dark:text-slate-400">
                          Adjust filters or add data via Outlook sync or ingest.
                        </p>
                        <Link
                          href="/dashboard"
                          className="mt-2 inline-flex h-10 items-center rounded-lg bg-[#2563eb] px-5 text-[14px] font-medium text-white hover:bg-[#1d4ed8]"
                        >
                          Back to dashboard
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageSlice.map((s) => (
                    <tr
                      key={s.id}
                      data-shipment-row={s.id}
                      className={`group cursor-pointer border-b border-[#f1f5f9] transition odd:bg-white even:bg-[#f8fafc] hover:bg-[#f1f5f9] dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/80 ${
                        flashRowId === s.id ? "shipment-row-highlight" : ""
                      }`}
                      onClick={() => {
                        setSelected(s);
                        window.history.replaceState(null, "", `/dashboard/shipments?id=${encodeURIComponent(s.id)}`);
                      }}
                    >
                      <td
                        className="min-h-[56px] max-w-[14rem] px-5 py-4 font-mono text-[13px] font-medium leading-snug text-[#0f172a] dark:text-slate-100"
                        title={s.reference}
                      >
                        <span className="line-clamp-2 break-all">{s.reference}</span>
                      </td>
                      <td className="px-5 py-4 text-[14px] text-[#475569] dark:text-slate-300">{s.clientName || "—"}</td>
                      <td className="px-5 py-4 text-[14px] text-[#475569] dark:text-slate-300">{s.origin || "—"}</td>
                      <td className="px-5 py-4 text-[14px] text-[#475569] dark:text-slate-300">{s.destination || "—"}</td>
                      <td className="px-5 py-4 text-[14px] text-[#475569] dark:text-slate-300">—</td>
                      <td className="whitespace-nowrap px-5 py-4 text-[14px] tabular-nums text-[#475569] dark:text-slate-300">
                        {formatEtaDisplay(s.eta)}
                      </td>
                      <td className="px-5 py-4 text-[14px] capitalize text-[#475569] dark:text-slate-300">
                        {s.customsStatus || "—"}
                      </td>
                      <td className="px-5 py-4">{riskBadge(s)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/shipments/${s.id}`}
                          className="font-medium text-[#2563eb] opacity-0 transition group-hover:opacity-100 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] px-5 py-4 text-[14px] text-[#64748b] dark:border-slate-700 dark:text-slate-400">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
              results · Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-3 py-1.5 font-medium disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-3 py-1.5 font-medium disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShipmentDetailPanel
        shipment={selected}
        onClose={() => {
          setSelected(null);
          window.history.replaceState(null, "", "/dashboard/shipments");
        }}
        onRefresh={refresh}
      />
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-[#64748b] dark:text-slate-400">Loading…</div>
      }
    >
      <ShipmentsPageInner />
    </Suspense>
  );
}
