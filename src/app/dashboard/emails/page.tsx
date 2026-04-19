"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, Search, Sparkles } from "lucide-react";
import { internalApiUrl } from "@/lib/api-urls";

type EmailRow = {
  id: string;
  subject: string;
  sender: string;
  body: string;
  parsed: unknown;
  shipmentId: string | null;
  shipmentReference: string | null;
  receivedAt: string;
  isUrgent: boolean;
};

function EmailsInner() {
  const searchParams = useSearchParams();
  const initialE = searchParams.get("e") || "";

  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(initialE);
  const [dateFilter, setDateFilter] = useState("all");

  const refresh = useCallback(async () => {
    const res = await fetch(internalApiUrl("/api/emails"), { credentials: "include" });
    const data = (await res.json()) as { emails?: EmailRow[] };
    if (res.ok && Array.isArray(data.emails)) setEmails(data.emails);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    if (initialE) setSelectedId(initialE);
  }, [initialE]);

  const filtered = useMemo(() => {
    let list = emails;
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(qq) ||
          e.sender.toLowerCase().includes(qq) ||
          (e.shipmentReference || "").toLowerCase().includes(qq),
      );
    }
    if (dateFilter === "7d") {
      const t = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((e) => new Date(e.receivedAt).getTime() >= t);
    }
    return list;
  }, [emails, q, dateFilter]);

  const selected = filtered.find((e) => e.id === selectedId) || filtered[0] || null;

  const parsed = selected?.parsed as Record<string, unknown> | undefined;
  const parseStatus = selected?.isUrgent ? "needs review" : "parsed";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm lg:max-w-md">
        <div className="border-b border-[#e2e8f0] dark:border-slate-700 p-4">
          <h1 className="text-lg font-bold text-[#0f172a] dark:text-slate-100">Parsed emails</h1>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] dark:text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subject, sender…"
              className="w-full rounded-lg border border-[#e2e8f0] dark:border-slate-700 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#64748b] dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
        </div>
        <ul className="max-h-[60vh] flex-1 overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
          {loading ? (
            <li className="px-4 py-8 text-center text-sm text-[#64748b] dark:text-slate-400">Loading…</li>
          ) : filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-[#64748b] dark:text-slate-400">No emails.</li>
          ) : (
            filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full border-b border-[#f1f5f9] dark:border-slate-700 px-4 py-3 text-left transition hover:bg-[#f8fafc] dark:bg-slate-900/60 ${
                    selected?.id === e.id ? "bg-[#eff6ff] ring-1 ring-inset ring-[#2563eb]/20" : ""
                  }`}
                >
                  <p className="line-clamp-2 font-medium text-[#0f172a] dark:text-slate-100">{e.subject}</p>
                  <p className="text-xs text-[#64748b] dark:text-slate-400">{e.sender}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#94a3b8] dark:text-slate-500">
                    <time dateTime={e.receivedAt}>{new Date(e.receivedAt).toLocaleString()}</time>
                    {e.shipmentReference && (
                      <span className="font-mono text-[#2563eb]">{e.shipmentReference}</span>
                    )}
                    {e.isUrgent && (
                      <span className="rounded bg-amber-100 px-1.5 font-semibold text-amber-800">
                        Risk
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        {!selected ? (
          <p className="text-[#64748b] dark:text-slate-400">Select an email.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e8f0] dark:border-slate-700 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0f172a] dark:text-slate-100">{selected.subject}</h2>
                <p className="mt-1 text-sm text-[#64748b] dark:text-slate-400">{selected.sender}</p>
                <p className="mt-2 text-xs text-[#94a3b8] dark:text-slate-500">
                  {new Date(selected.receivedAt).toLocaleString()} · Status: {parseStatus}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={
                    selected.shipmentId
                      ? `/dashboard/shipments?id=${encodeURIComponent(selected.shipmentId)}`
                      : "/dashboard/shipments"
                  }
                  className="rounded-lg border border-[#e2e8f0] dark:border-slate-700 px-3 py-2 text-sm font-semibold text-[#0f172a] dark:text-slate-100 hover:bg-[#f8fafc] dark:bg-slate-900/60"
                >
                  Link to shipment
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  <Sparkles className="h-4 w-4" />
                  Draft reply (AI)
                </Link>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-[#0f172a] dark:text-slate-100">Original</h3>
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/60 p-4 text-xs text-[#334155] dark:text-slate-300">
                  {selected.body || "(empty)"}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0f172a] dark:text-slate-100">AI extracted</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between gap-4 border-b border-[#f1f5f9] dark:border-slate-700 py-2">
                    <dt className="text-[#64748b] dark:text-slate-400">Shipment ref</dt>
                    <dd className="font-mono text-[#0f172a] dark:text-slate-100">
                      {selected.shipmentReference || (parsed?.reference as string) || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#f1f5f9] dark:border-slate-700 py-2">
                    <dt className="text-[#64748b] dark:text-slate-400">ETA</dt>
                    <dd>{(parsed?.eta as string) || "—"}</dd>
                  </div>
                  <div className="rounded-lg bg-[#f8fafc] dark:bg-slate-900/60 p-3 text-xs text-[#475569] dark:text-slate-300">
                    <p className="font-semibold text-[#0f172a] dark:text-slate-100">Raw parsed JSON</p>
                    <pre className="mt-2 max-h-40 overflow-auto">
                      {JSON.stringify(selected.parsed || {}, null, 2)}
                    </pre>
                  </div>
                </dl>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-[#64748b] dark:text-slate-400">Loading…</div>
      }
    >
      <EmailsInner />
    </Suspense>
  );
}
