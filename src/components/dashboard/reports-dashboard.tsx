"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Filter,
  Info,
  Loader2,
  MoreHorizontal,
  Pin,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { internalApiUrl } from "@/lib/api-urls";
import type { Shipment } from "@/lib/types";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#64748b", "#8b5cf6"];
const GRID = "gap-2"; /* 8px grid */
const CARD_SHADOW = "shadow-[0_1px_4px_rgba(0,0,0,0.08)]";
const FAVORITES_KEY = "dala-reports-favorites-v1";

type SortKey =
  | "reference"
  | "clientName"
  | "customsStatus"
  | "eta"
  | "emails"
  | "priorityScore"
  | "updatedAt";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50] as const;

const COLUMN_DEFS: { id: string; label: string; sortKey?: SortKey }[] = [
  { id: "reference", label: "Reference", sortKey: "reference" },
  { id: "client", label: "Client", sortKey: "clientName" },
  { id: "route", label: "Route" },
  { id: "status", label: "Status", sortKey: "customsStatus" },
  { id: "eta", label: "ETA", sortKey: "eta" },
  { id: "emails", label: "Emails", sortKey: "emails" },
  { id: "priority", label: "Priority", sortKey: "priorityScore" },
  { id: "risk", label: "Risk" },
  { id: "updated", label: "Updated", sortKey: "updatedAt" },
];

function parseISODate(s: string): number {
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

function statusBadgeClass(status: string | undefined): string {
  const st = status || "unknown";
  if (st === "cleared") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800";
  if (st === "held") return "bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800";
  if (st === "pending") return "bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600";
}

function riskSummary(s: Shipment): { label: string; className: string } {
  const high = s.risks.filter((r) => r.level === "high").length;
  const med = s.risks.filter((r) => r.level === "medium").length;
  if (high > 0) return { label: "High", className: "bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200" };
  if (med > 0) return { label: "Medium", className: "bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200" };
  return { label: "Low", className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200" };
}

function filterShipments(
  list: Shipment[],
  opts: {
    from: string;
    to: string;
    status: string;
    q: string;
  },
): Shipment[] {
  return list.filter((s) => {
    const t = parseISODate(s.updatedAt || s.createdAt);
    if (opts.from) {
      const ft = parseISODate(opts.from);
      if (t < ft) return false;
    }
    if (opts.to) {
      const tt = parseISODate(opts.to) + 86400000;
      if (t >= tt) return false;
    }
    if (opts.status && opts.status !== "all") {
      if ((s.customsStatus || "unknown") !== opts.status) return false;
    }
    if (opts.q.trim()) {
      const needle = opts.q.trim().toLowerCase();
      const hay = [s.reference, s.id, s.clientName, s.origin, s.destination, s.blNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

function sortShipments(list: Shipment[], key: SortKey, dir: SortDir): Shipment[] {
  const mult = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    let va: string | number = "";
    let vb: string | number = "";
    switch (key) {
      case "reference":
        va = a.reference;
        vb = b.reference;
        break;
      case "clientName":
        va = a.clientName || "";
        vb = b.clientName || "";
        break;
      case "customsStatus":
        va = a.customsStatus || "unknown";
        vb = b.customsStatus || "unknown";
        break;
      case "eta":
        va = parseISODate(a.eta || "");
        vb = parseISODate(b.eta || "");
        break;
      case "emails":
        va = a.emails.length;
        vb = b.emails.length;
        break;
      case "priorityScore":
        va = a.priorityScore;
        vb = b.priorityScore;
        break;
      case "updatedAt":
        va = parseISODate(a.updatedAt || a.createdAt);
        vb = parseISODate(b.updatedAt || b.createdAt);
        break;
      default:
        return 0;
    }
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * mult;
    return String(va).localeCompare(String(vb)) * mult;
  });
}

function toCSV(rows: Shipment[]): string {
  const headers = [
    "reference",
    "clientName",
    "origin",
    "destination",
    "customsStatus",
    "eta",
    "emails",
    "priorityScore",
    "updatedAt",
  ];
  const lines = [headers.join(",")];
  for (const s of rows) {
    const cells = headers.map((h) => {
      const v = (s as unknown as Record<string, unknown>)[h];
      const str = v === undefined || v === null ? "" : String(v);
      return `"${str.replace(/"/g, '""')}"`;
    });
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<string>) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function ReportsDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [range, setRange] = useState("30d");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const res = await fetch(internalApiUrl("/api/shipments"), { credentials: "include" });
    const data = (await res.json()) as { shipments?: Shipment[] };
    if (res.ok && Array.isArray(data.shipments)) setShipments(data.shipments);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  /* URL hydration (browser back/forward, shared links) */
  useEffect(() => {
    const f = searchParams.get("from") || "";
    const t = searchParams.get("to") || "";
    const st = searchParams.get("status") || "all";
    const q = searchParams.get("q") || "";
    const pg = parseInt(searchParams.get("page") || "1", 10);
    const ps = parseInt(searchParams.get("pageSize") || "10", 10);
    const sk = (searchParams.get("sort") as SortKey) || "updatedAt";
    const sd = (searchParams.get("dir") as SortDir) || "desc";
    const cols = searchParams.get("hideCols");
    setFrom(f);
    setTo(t);
    setStatusFilter(st);
    setSearchQ(q);
    setSearchDebounced(q);
    if (Number.isFinite(pg) && pg >= 1) setPage(pg);
    if (PAGE_SIZES.includes(ps as (typeof PAGE_SIZES)[number])) setPageSize(ps as (typeof PAGE_SIZES)[number]);
    if (["reference", "clientName", "customsStatus", "eta", "emails", "priorityScore", "updatedAt"].includes(sk))
      setSortKey(sk);
    if (sd === "asc" || sd === "desc") setSortDir(sd);
    setHiddenCols(cols ? new Set(cols.split(",").filter(Boolean)) : new Set());
  }, [searchParams]);

  const updateURL = useCallback(
    (patch: Record<string, string | number | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") p.delete(k);
        else p.set(k, String(v));
      }
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filtered = useMemo(
    () => filterShipments(shipments, { from, to, status: statusFilter, q: searchDebounced }),
    [shipments, from, to, statusFilter, searchDebounced],
  );

  const sorted = useMemo(() => {
    const pinned = [...favorites];
    const withPin = [...filtered].sort((a, b) => {
      const fa = favorites.has(a.id) ? 1 : 0;
      const fb = favorites.has(b.id) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return 0;
    });
    return sortShipments(withPin, sortKey, sortDir);
  }, [filtered, sortKey, sortDir, favorites]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  useEffect(() => {
    if (page !== pageSafe) setPage(pageSafe);
  }, [page, pageSafe]);

  const kpis = useMemo(() => {
    const n = filtered.length;
    const highRisk = filtered.filter((s) => s.risks.some((r) => r.level === "high")).length;
    const cleared = filtered.filter((s) => s.customsStatus === "cleared").length;
    const clearancePct = n ? Math.round((cleared / n) * 100) : 0;
    const emails = filtered.reduce((acc, s) => acc + s.emails.length, 0);

    const now = Date.now();
    const windowMs = 30 * 86400000;
    const prevStart = now - 2 * windowMs;
    const prevEnd = now - windowMs;
    const prevCount = shipments.filter((s) => {
      const t = parseISODate(s.updatedAt || s.createdAt);
      return t >= prevStart && t < prevEnd;
    }).length;
    const currCount = shipments.filter((s) => {
      const t = parseISODate(s.updatedAt || s.createdAt);
      return t >= prevEnd && t <= now;
    }).length;
    const trendTotal =
      prevCount > 0 ? Math.round(((currCount - prevCount) / prevCount) * 100) : currCount > 0 ? 100 : 0;

    const prevHigh = shipments.filter((s) => {
      const t = parseISODate(s.updatedAt || s.createdAt);
      return t >= prevStart && t < prevEnd && s.risks.some((r) => r.level === "high");
    }).length;
    const trendRisk = prevHigh > 0 ? Math.round(((highRisk - prevHigh) / prevHigh) * 100) : highRisk > 0 ? 100 : 0;

    return {
      total: n,
      highRisk,
      clearancePct,
      emails,
      trendTotal,
      trendRisk,
      trendClearance: 0,
      trendEmails: 0,
    };
  }, [filtered, shipments]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of filtered) {
      const st = s.customsStatus || "unknown";
      m.set(st, (m.get(st) || 0) + 1);
    }
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const activityOverTime = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const now = Date.now();
    const pts: { label: string; shipments: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      let n = 0;
      for (const s of filtered) {
        const t = parseISODate(s.updatedAt || s.createdAt);
        if (t >= dayStart && t < dayEnd) n++;
      }
      pts.push({ label, shipments: n });
    }
    return pts;
  }, [filtered, range]);

  const riskTrend = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const now = Date.now();
    const pts: { day: string; high: number; low: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      let high = 0;
      let low = 0;
      for (const s of filtered) {
        const t = parseISODate(s.updatedAt || s.createdAt);
        if (t <= d.getTime() + 86400000 && t >= d.getTime() - 86400000 * 2) {
          if (s.risks.some((r) => r.level === "high")) high++;
          else low++;
        }
      }
      pts.push({ day: label, high, low });
    }
    return pts;
  }, [filtered, range]);

  const emailVolume = useMemo(() => {
    const days = 7;
    const now = Date.now();
    const pts: { day: string; emails: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      let n = 0;
      for (const s of filtered) {
        for (const e of s.emails) {
          const t = parseISODate(e.receivedAt);
          if (t >= d.getTime() && t < d.getTime() + 86400000) n++;
        }
      }
      pts.push({ day: label, emails: n });
    }
    return pts;
  }, [filtered]);

  const byOrigin = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of filtered) {
      const o = (s.origin || "Unknown").split(",")[0]?.trim() || "Unknown";
      m.set(o, (m.get(o) || 0) + 1);
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  const transitByCarrier = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const s of filtered) {
      const c = s.clientName || "Carrier";
      if (!m.has(c)) m.set(c, []);
      const o = s.origin || "";
      const dest = s.destination || "";
      if (o && dest) m.get(c)!.push(1);
    }
    return [...m.entries()].map(([name, arr]) => ({
      name: name.slice(0, 18),
      days: arr.length ? Math.round(14 + arr.length * 3) : 0,
    }));
  }, [filtered]);

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setStatusFilter("all");
    setSearchQ("");
    setSearchDebounced("");
    setPage(1);
    router.replace(pathname, { scroll: false });
  };

  const exportFilteredCSV = () => {
    downloadCSV(toCSV(sorted), `dala-reports-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportRow = (s: Shipment) => {
    downloadCSV(toCSV([s]), `shipment-${s.reference.replace(/\W+/g, "_")}.csv`);
  };

  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey === key) {
      const next = sortDir === "asc" ? "desc" : "asc";
      setSortDir(next);
      updateURL({ sort: key, dir: next, page: 1 });
    } else {
      setSortKey(key);
      setSortDir("desc");
      updateURL({ sort: key, dir: "desc", page: 1 });
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  };

  const toggleCol = (id: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const hideCols = [...next].join(",");
      updateURL({ hideCols: next.size ? hideCols : null });
      return next;
    });
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQ("");
        setSearchDebounced("");
        setPage(1);
        updateURL({ q: null, page: 1 });
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [updateURL]);

  const Trend = ({ value, invert }: { value: number; invert?: boolean }) => {
    const up = value >= 0;
    const good = invert ? !up : up;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
        <Icon className="h-3.5 w-3.5" />
        {Math.abs(value)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`flex flex-col ${GRID}`}>
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-28 rounded-lg bg-white ${CARD_SHADOW} dark:bg-slate-900`}>
              <div className="h-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
        <div className={`h-64 rounded-lg bg-white ${CARD_SHADOW} dark:bg-slate-900`}>
          <div className="h-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className={`h-96 rounded-lg bg-white ${CARD_SHADOW} dark:bg-slate-900`}>
          <div className="h-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${GRID} max-w-full overflow-x-hidden`}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] dark:text-slate-100">Reports</h1>
          <p className="mt-1 text-[14px] text-[#64748b] dark:text-slate-400">Track performance, activity, and outcomes</p>
          {lastUpdated && (
            <p className="mt-2 text-[12px] text-[#94a3b8] dark:text-slate-500">
              Last updated {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-10 rounded-lg border border-[#e2e8f0] bg-white px-3 text-[14px] font-medium text-[#334155] shadow-sm transition hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            type="button"
            onClick={() => document.getElementById("reports-filters")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-[14px] font-medium text-[#334155] shadow-sm transition hover:bg-[#f8fafc] active:scale-[0.98] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button
            type="button"
            onClick={exportFilteredCSV}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        id="reports-filters"
        className={`flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900 md:flex-row md:flex-wrap md:items-end`}
      >
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-slate-500">From</span>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                updateURL({ from: e.target.value || null });
              }}
              className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-0 pl-9 pr-3 text-[14px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-slate-500">To</span>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
                updateURL({ to: e.target.value || null, page: 1 });
              }}
              className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-0 pl-9 pr-3 text-[14px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </label>
        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-slate-500">Customs status</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
              updateURL({ status: e.target.value === "all" ? null : e.target.value, page: 1 });
            }}
            className="h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[14px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">All statuses</option>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
            <option value="held">Held</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="flex min-w-[200px] flex-[2] flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-slate-500">
            Search <kbd className="rounded bg-slate-100 px-1 text-[10px] dark:bg-slate-800">/</kbd>
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQ}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQ(v);
                setPage(1);
                updateURL({ q: v.trim() || null, page: 1 });
              }}
              placeholder="Reference, client, ID…"
              className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-0 pl-9 pr-3 text-[14px] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="h-10 rounded-lg border border-[#e2e8f0] bg-white px-4 text-[14px] font-medium text-[#475569] transition hover:bg-[#f8fafc] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={exportFilteredCSV}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2563eb]/30 bg-[#eff6ff] px-4 text-[14px] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <p className="text-[13px] text-[#64748b] dark:text-slate-500">
        <span className="font-medium text-[#334155] dark:text-slate-300">{sorted.length}</span> results found
      </p>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
          <p className="text-[13px] font-medium text-[#64748b] dark:text-slate-400">Total shipments</p>
          <p className="mt-2 text-[32px] font-bold tabular-nums text-[#0f172a] dark:text-slate-100">{kpis.total}</p>
          <p className="mt-2 flex items-center gap-2 text-[12px] text-[#64748b]">
            vs prior period <Trend value={kpis.trendTotal} />
          </p>
        </div>
        <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
          <p className="text-[13px] font-medium text-[#64748b] dark:text-slate-400">High risk flags</p>
          <p className="mt-2 text-[32px] font-bold tabular-nums text-[#0f172a] dark:text-slate-100">{kpis.highRisk}</p>
          <p className="mt-2 flex items-center gap-2 text-[12px] text-[#64748b]">
            vs prior period <Trend value={kpis.trendRisk} invert />
          </p>
        </div>
        <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
          <p className="text-[13px] font-medium text-[#64748b] dark:text-slate-400">Clearance rate</p>
          <p className="mt-2 text-[32px] font-bold tabular-nums text-[#0f172a] dark:text-slate-100">{kpis.clearancePct}%</p>
          <p className="mt-2 text-[12px] text-[#64748b]">Of filtered shipments</p>
        </div>
        <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
          <p className="text-[13px] font-medium text-[#64748b] dark:text-slate-400">Linked emails</p>
          <p className="mt-2 text-[32px] font-bold tabular-nums text-[#0f172a] dark:text-slate-100">{kpis.emails}</p>
          <p className="mt-2 text-[12px] text-[#64748b]">Across filtered rows</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        {/* Main */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Charts */}
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
              <h2 className="text-[16px] font-semibold text-[#0f172a] dark:text-slate-100">Activity over time</h2>
              <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">Shipment updates per day (filtered)</p>
              <div className="mt-4 h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                      formatter={(v) => [v ?? 0, "Shipments"]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="shipments" name="Shipments" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
              <h2 className="text-[16px] font-semibold text-[#0f172a] dark:text-slate-100">Customs status mix</h2>
              <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">Distribution for current filters</p>
              <div className="mt-4 h-[260px] w-full min-w-0">
                {byStatus.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-[14px] text-[#64748b]">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={88}
                        paddingAngle={2}
                      >
                        {byStatus.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
              <h2 className="text-[16px] font-semibold text-[#0f172a] dark:text-slate-100">Risk signals</h2>
              <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">High vs other activity in range</p>
              <div className="mt-4 h-[240px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                    <Legend />
                    <Line type="monotone" dataKey="high" name="High" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="low" name="Other" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
              <h2 className="text-[16px] font-semibold text-[#0f172a] dark:text-slate-100">Email volume / day</h2>
              <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">Last 7 days</p>
              <div className="mt-4 h-[240px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emailVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                    <Bar dataKey="emails" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
            <h2 className="text-[16px] font-semibold text-[#0f172a] dark:text-slate-100">Shipments by origin</h2>
            <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">Top lanes (filtered)</p>
            <div className="mt-4 h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byOrigin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`rounded-lg border border-[#e2e8f0] bg-white p-6 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
            <h2 className="text-[16px] font-semibold text-[#0f172a] dark:text-slate-100">Transit proxy by client</h2>
            <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-400">Heuristic from shipment graph (demo)</p>
            <div className="mt-4 h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transitByCarrier}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="days" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className={`overflow-hidden rounded-lg border border-[#e2e8f0] bg-white ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
            <div className="flex flex-col gap-3 border-b border-[#e2e8f0] p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[16px] font-semibold text-[#0f172a] dark:text-slate-100">Shipment register</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setColumnMenuOpen((o) => !o);
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] font-medium text-[#475569] hover:bg-[#f1f5f9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Columns3 className="h-4 w-4" />
                    Columns
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {columnMenuOpen && (
                    <div
                      className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {COLUMN_DEFS.map((c) => (
                        <label key={c.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#f8fafc] dark:hover:bg-slate-700">
                          <input
                            type="checkbox"
                            checked={!hiddenCols.has(c.id)}
                            onChange={() => toggleCol(c.id)}
                            className="rounded border-slate-300"
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const rows = sorted.filter((s) => selected.has(s.id));
                      downloadCSV(toCSV(rows), `dala-selected-${selected.size}.csv`);
                    }}
                    className="h-9 rounded-lg bg-[#2563eb] px-3 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
                  >
                    Export selected ({selected.size})
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[min(520px,60vh)] overflow-auto">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <SlidersHorizontal className="h-12 w-12 text-[#cbd5e1] dark:text-slate-600" />
                  <p className="text-[15px] font-medium text-[#334155] dark:text-slate-300">No reports found</p>
                  <p className="max-w-sm text-[14px] text-[#64748b] dark:text-slate-400">Try adjusting your filters or date range.</p>
                </div>
              ) : (
                <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
                  <thead className="sticky top-0 z-10 bg-[#f8fafc] shadow-sm dark:bg-slate-800">
                    <tr>
                      <th className="w-10 border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300"
                          checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelected(new Set([...selected, ...pageRows.map((r) => r.id)]));
                            } else {
                              setSelected((prev) => {
                                const next = new Set(prev);
                                for (const r of pageRows) next.delete(r.id);
                                return next;
                              });
                            }
                          }}
                        />
                      </th>
                      {!hiddenCols.has("reference") && (
                        <th className="border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                          <button type="button" onClick={() => toggleSort("reference")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] hover:text-[#2563eb]">
                            Reference
                            {sortKey === "reference" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </button>
                        </th>
                      )}
                      {!hiddenCols.has("client") && (
                        <th className="border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                          <button type="button" onClick={() => toggleSort("clientName")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                            Client
                            {sortKey === "clientName" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </button>
                        </th>
                      )}
                      {!hiddenCols.has("route") && (
                        <th className="border-b border-[#e2e8f0] p-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:border-slate-700">Route</th>
                      )}
                      {!hiddenCols.has("status") && (
                        <th className="border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                          <button type="button" onClick={() => toggleSort("customsStatus")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                            Status
                            {sortKey === "customsStatus" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </button>
                        </th>
                      )}
                      {!hiddenCols.has("eta") && (
                        <th className="border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                          <button type="button" onClick={() => toggleSort("eta")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                            ETA
                            {sortKey === "eta" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </button>
                        </th>
                      )}
                      {!hiddenCols.has("emails") && (
                        <th className="border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                          <button type="button" onClick={() => toggleSort("emails")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                            Emails
                            {sortKey === "emails" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </button>
                        </th>
                      )}
                      {!hiddenCols.has("priority") && (
                        <th className="border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                          <button type="button" onClick={() => toggleSort("priorityScore")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                            Priority
                            {sortKey === "priorityScore" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </button>
                        </th>
                      )}
                      {!hiddenCols.has("risk") && (
                        <th className="border-b border-[#e2e8f0] p-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:border-slate-700">Risk</th>
                      )}
                      {!hiddenCols.has("updated") && (
                        <th className="border-b border-[#e2e8f0] p-3 dark:border-slate-700">
                          <button type="button" onClick={() => toggleSort("updatedAt")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                            Updated
                            {sortKey === "updatedAt" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </button>
                        </th>
                      )}
                      <th className="w-12 border-b border-[#e2e8f0] p-3 dark:border-slate-700" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((s, idx) => {
                      const rr = riskSummary(s);
                      const zebra = idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-[#f8fafc]/80 dark:bg-slate-900/50";
                      return (
                        <tr key={s.id} className={`group border-b border-[#f1f5f9] transition hover:bg-[#eff6ff]/60 dark:border-slate-800 dark:hover:bg-slate-800/50 ${zebra}`}>
                          <td className="p-3 align-middle">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={selected.has(s.id)}
                              onChange={(e) => {
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(s.id);
                                  else next.delete(s.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          {!hiddenCols.has("reference") && (
                            <td className="p-3 align-middle">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  title={favorites.has(s.id) ? "Unpin" : "Pin to top"}
                                  onClick={() => toggleFavorite(s.id)}
                                  className="text-[#94a3b8] hover:text-amber-500"
                                >
                                  {favorites.has(s.id) ? <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> : <Star className="h-4 w-4" />}
                                </button>
                                <span className="font-semibold text-[#0f172a] dark:text-slate-100">{s.reference}</span>
                              </div>
                            </td>
                          )}
                          {!hiddenCols.has("client") && (
                            <td className="p-3 align-middle text-[#475569] dark:text-slate-300">{s.clientName || "—"}</td>
                          )}
                          {!hiddenCols.has("route") && (
                            <td className="p-3 align-middle">
                              <span className="text-[#334155] dark:text-slate-300">{(s.origin || "—").split(",")[0]}</span>
                              <span className="text-[#94a3b8]"> → </span>
                              <span className="text-[#64748b]">{(s.destination || "—").split(",")[0]}</span>
                            </td>
                          )}
                          {!hiddenCols.has("status") && (
                            <td className="p-3 align-middle">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${statusBadgeClass(s.customsStatus)}`}>
                                {s.customsStatus || "unknown"}
                              </span>
                            </td>
                          )}
                          {!hiddenCols.has("eta") && (
                            <td className="p-3 align-middle text-[#64748b] dark:text-slate-400">{s.eta ? new Date(s.eta).toLocaleDateString() : "—"}</td>
                          )}
                          {!hiddenCols.has("emails") && (
                            <td className="p-3 align-middle tabular-nums text-[#334155] dark:text-slate-300">{s.emails.length}</td>
                          )}
                          {!hiddenCols.has("priority") && (
                            <td className="p-3 align-middle tabular-nums text-[#334155] dark:text-slate-300">{s.priorityScore}</td>
                          )}
                          {!hiddenCols.has("risk") && (
                            <td className="p-3 align-middle">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium ${rr.className}`}>{rr.label}</span>
                            </td>
                          )}
                          {!hiddenCols.has("updated") && (
                            <td className="p-3 align-middle text-[13px] text-[#64748b] dark:text-slate-400">
                              {new Date(s.updatedAt || s.createdAt).toLocaleString()}
                            </td>
                          )}
                          <td className="relative p-3 align-middle">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="Quick export row"
                                onClick={() => exportRow(s)}
                                className="rounded p-1.5 text-[#64748b] opacity-0 transition hover:bg-[#e2e8f0] group-hover:opacity-100 dark:hover:bg-slate-700"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded p-1.5 text-[#64748b] hover:bg-[#e2e8f0] dark:hover:bg-slate-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId((id) => (id === s.id ? null : s.id));
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {openMenuId === s.id && (
                                <div
                                  className="absolute right-0 top-full z-20 mt-0.5 w-44 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link
                                    href={`/dashboard/shipments?highlight=${encodeURIComponent(s.id)}`}
                                    className="block px-3 py-2 text-[13px] hover:bg-[#f8fafc] dark:hover:bg-slate-700"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    View in Shipments
                                  </Link>
                                  <button type="button" className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f8fafc] dark:hover:bg-slate-700" onClick={() => exportRow(s)}>
                                    Export row (CSV)
                                  </button>
                                  <button type="button" className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f8fafc] dark:hover:bg-slate-700" onClick={() => toggleFavorite(s.id)}>
                                    {favorites.has(s.id) ? "Remove pin" : "Pin to top"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {sorted.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-[#e2e8f0] p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#64748b]">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const ps = Number(e.target.value) as (typeof PAGE_SIZES)[number];
                      setPageSize(ps);
                      setPage(1);
                      updateURL({ pageSize: ps, page: 1 });
                    }}
                    className="rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-[14px] dark:border-slate-600 dark:bg-slate-900"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageSafe <= 1}
                    onClick={() => {
                      const p = Math.max(1, pageSafe - 1);
                      setPage(p);
                      updateURL({ page: p });
                    }}
                    className="inline-flex h-9 items-center rounded-lg border border-[#e2e8f0] px-2 disabled:opacity-40 dark:border-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[13px] tabular-nums text-[#64748b]">
                    Page {pageSafe} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageSafe >= totalPages}
                    onClick={() => {
                      const p = Math.min(totalPages, pageSafe + 1);
                      setPage(p);
                      updateURL({ page: p });
                    }}
                    className="inline-flex h-9 items-center rounded-lg border border-[#e2e8f0] px-2 disabled:opacity-40 dark:border-slate-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-full shrink-0 space-y-2 lg:w-[280px]">
          <div className={`rounded-lg border border-[#e2e8f0] bg-white p-4 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
            <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#0f172a] dark:text-slate-100">
              <Pin className="h-4 w-4 text-[#2563eb]" />
              Pinned
            </h3>
            <p className="mt-1 text-[12px] text-[#64748b] dark:text-slate-400">Quick access from this device</p>
            <ul className="mt-3 space-y-2">
              {favorites.size === 0 ? (
                <li className="text-[13px] text-[#94a3b8]">No pinned rows yet</li>
              ) : (
                [...favorites].map((id) => {
                  const row = shipments.find((x) => x.id === id);
                  if (!row) return null;
                  return (
                    <li key={id}>
                      <Link href={`/dashboard/shipments?highlight=${encodeURIComponent(id)}`} className="block truncate rounded-md px-2 py-1.5 text-[13px] font-medium text-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-slate-800">
                        {row.reference}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
          <div className={`rounded-lg border border-[#e2e8f0] bg-white p-4 ${CARD_SHADOW} dark:border-slate-700 dark:bg-slate-900`}>
            <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#0f172a] dark:text-slate-100">
              <Info className="h-4 w-4 text-[#64748b]" />
              Data source
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748b] dark:text-slate-400">
              All metrics derive from the same live shipment feed as the rest of the workspace. Filters apply client-side to the loaded snapshot.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
