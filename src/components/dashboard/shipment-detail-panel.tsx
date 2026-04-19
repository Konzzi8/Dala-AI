"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { Shipment } from "@/lib/types";
import { internalApiUrl } from "@/lib/api-urls";
import { ensureDocumentSlots } from "@/lib/dashboard-utils";
import { formatEtaDisplay } from "@/lib/format-date";
import { useState } from "react";

type Props = {
  shipment: Shipment | null;
  onClose: () => void;
  onRefresh?: () => void;
};

const DOCS = [
  "Bill of Lading",
  "Commercial Invoice",
  "Packing List",
  "Customs Declaration",
  "Certificate of Origin",
];

export function ShipmentDetailPanel({ shipment, onClose, onRefresh }: Props) {
  const [draftBusy, setDraftBusy] = useState(false);
  const [draft, setDraft] = useState("");

  async function runDraft() {
    if (!shipment) return;
    setDraftBusy(true);
    setDraft("");
    try {
      const res = await fetch(internalApiUrl("/api/draft"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId: shipment.id }),
      });
      const data = (await res.json()) as { draft?: string };
      setDraft(data.draft || "");
    } finally {
      setDraftBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {shipment && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            aria-label="Close panel"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-[#e2e8f0] bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-[#64748b]">Shipment</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0f172a]">{shipment.reference}</h2>
                <p className="mt-0.5 truncate text-sm text-[#475569]">{shipment.clientName || "—"}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-[#f1f5f9] py-2">
                  <span className="text-[#64748b]">Route</span>
                  <span className="text-right font-medium text-[#0f172a]">
                    {shipment.origin || "—"} → {shipment.destination || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#f1f5f9] py-2">
                  <span className="text-[#64748b]">ETA</span>
                  <span className="text-right font-medium tabular-nums">{formatEtaDisplay(shipment.eta)}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#f1f5f9] py-2">
                  <span className="text-[#64748b]">Containers</span>
                  <span className="text-right font-mono text-xs">
                    {shipment.containerNumbers.join(", ") || "—"}
                  </span>
                </div>
              </div>

              <section className="mt-6">
                <h3 className="text-sm font-semibold text-[#0f172a]">Risk flags</h3>
                <ul className="mt-2 space-y-2">
                  {shipment.risks.length === 0 ? (
                    <li className="text-sm text-[#64748b]">No flags recorded.</li>
                  ) : (
                    shipment.risks.map((r) => (
                      <li
                        key={r.id}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          r.level === "high"
                            ? "border-red-200 bg-red-50 text-red-900"
                            : r.level === "medium"
                              ? "border-amber-200 bg-amber-50 text-amber-900"
                              : "border-emerald-200 bg-emerald-50 text-emerald-900"
                        }`}
                      >
                        {r.message}
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="mt-6">
                <h3 className="text-sm font-semibold text-[#0f172a]">Document checklist</h3>
                <ul className="mt-2 space-y-1.5">
                  {DOCS.map((name) => {
                    const slots = ensureDocumentSlots(shipment);
                    const slot = slots.find((d) => d.name === name);
                    const ok = slot?.received ?? false;
                    return (
                      <li key={name} className="flex items-center justify-between text-sm">
                        <span className="text-[#475569]">{name}</span>
                        <span className={ok ? "text-[#16a34a]" : "text-[#dc2626]"}>
                          {ok ? "Yes" : "No"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="mt-6">
                <h3 className="text-sm font-semibold text-[#0f172a]">Linked emails</h3>
                <ul className="mt-2 space-y-2">
                  {shipment.emails.length === 0 ? (
                    <li className="text-sm text-[#64748b]">None linked.</li>
                  ) : (
                    shipment.emails.map((e) => (
                      <li key={e.id} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm">
                        <p className="font-medium text-[#0f172a]">{e.subject}</p>
                        <p className="text-xs text-[#64748b]">{e.from}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              {draft && (
                <section className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Draft reply</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-[#334155]">{draft}</pre>
                </section>
              )}
            </div>

            <div className="border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={draftBusy}
                  onClick={() => void runDraft()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:bg-[#f1f5f9] disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {draftBusy ? "Drafting…" : "Draft reply"}
                </button>
                <Link
                  href={`/dashboard/emails`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
                  onClick={onClose}
                >
                  <Sparkles className="h-4 w-4" />
                  Ask AI (chat)
                </Link>
              </div>
              <p className="mt-2 text-center text-[10px] text-[#94a3b8]">
                Full page:{" "}
                <Link
                  href={`/dashboard/shipments/${shipment.id}`}
                  className="font-medium text-[#2563eb] hover:underline"
                  onClick={() => onRefresh?.()}
                >
                  Open shipment
                </Link>
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
