"use client";

import { Copy, FileText, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatMarkdown } from "./chat-markdown";
import { formatEtaChatLong } from "@/lib/format-date";
import { normalizeShipmentReference, SHIPMENT_REFERENCE_REGEX } from "@/lib/shipment-reference";
import type { Shipment } from "@/lib/types";
import { internalApiUrl } from "@/lib/api-urls";
import type { ChatMessage } from "./chat-context";

type Props = {
  message: ChatMessage;
  shipmentsByReference: Map<string, Shipment>;
  onRefreshShipments: () => void;
  onQuickReply: (text: string) => void;
};

const QUICK_REPLIES = [
  "Tell me more",
  "Draft an email for this",
  "Show all risks",
  "What needs attention today?",
];

function uniqueRefsFromText(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const r = new RegExp(SHIPMENT_REFERENCE_REGEX.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) {
    const up = normalizeShipmentReference(m[1]);
    if (!seen.has(up)) {
      seen.add(up);
      out.push(up);
    }
  }
  return out;
}

function shipmentRiskLevel(s: Shipment): "high" | "medium" | "low" {
  if (s.risks.some((r) => r.level === "high")) return "high";
  if (s.risks.some((r) => r.level === "medium")) return "medium";
  return "low";
}

function RiskBadge({ level }: { level: "high" | "medium" | "low" }) {
  const cls =
    level === "high"
      ? "bg-red-100 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900/50"
      : level === "medium"
        ? "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40"
        : "bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/40";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${cls}`}
    >
      {level}
    </span>
  );
}

export function ChatAssistantMessage({
  message,
  shipmentsByReference,
  onRefreshShipments,
  onQuickReply,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [draftOpen, setDraftOpen] = useState<Shipment | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const navigateToShipment = useCallback(
    (id: string) => {
      const onShipments =
        pathname === "/dashboard/shipments" || pathname?.startsWith("/dashboard/shipments");
      const qs = new URLSearchParams();
      qs.set("id", id);
      qs.set("highlight", id);
      const target = `/dashboard/shipments?${qs.toString()}`;
      if (onShipments) {
        router.replace(target);
      } else {
        router.push(target);
      }
    },
    [pathname, router],
  );

  const refKeys = useMemo(() => uniqueRefsFromText(message.content), [message.content]);
  const matchedShipments = useMemo(() => {
    const list: Shipment[] = [];
    const seen = new Set<string>();
    for (const k of refKeys) {
      const s = shipmentsByReference.get(k);
      if (s && !seen.has(s.id)) {
        seen.add(s.id);
        list.push(s);
      }
    }
    return list;
  }, [refKeys, shipmentsByReference]);

  async function runDraft(s: Shipment) {
    setDraftBusy(true);
    setDraftText("");
    try {
      const res = await fetch(internalApiUrl("/api/draft"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId: s.id, tone: "professional and concise" }),
      });
      const data = (await res.json()) as { draft?: string; error?: string };
      if (res.ok && data.draft) {
        setDraftText(data.draft);
        setDraftOpen(s);
      } else {
        setToast(data.error || "Draft failed");
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setDraftBusy(false);
    }
  }

  async function markReviewed(s: Shipment) {
    try {
      const res = await fetch(internalApiUrl(`/api/shipments/${encodeURIComponent(s.id)}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed: true }),
      });
      if (res.ok) {
        setToast(`Marked ${s.reference} as reviewed`);
        onRefreshShipments();
      } else {
        setToast("Could not mark reviewed");
      }
    } catch {
      setToast("Could not mark reviewed");
    }
    setTimeout(() => setToast(null), 4000);
  }

  function handleQuickReply(label: string) {
    if (label === "Draft an email for this" && matchedShipments[0]) {
      void runDraft(matchedShipments[0]);
      return;
    }
    onQuickReply(label);
  }

  const firstShipment = matchedShipments[0];

  return (
    <>
      <div className="group/msg relative max-w-full rounded-[18px] rounded-bl-[4px] border border-[#e2e8f0] bg-gradient-to-b from-white to-[#f8fafc] px-4 py-3 pt-9 shadow-sm dark:border-slate-600 dark:from-slate-800 dark:to-slate-900">
        <button
          type="button"
          title="Copy message"
          onClick={() => void navigator.clipboard.writeText(message.content)}
          className="absolute right-2 top-2 rounded-md p-1.5 text-[#64748b] opacity-0 transition hover:bg-[#f1f5f9] hover:text-[#0f172a] group-hover/msg:opacity-100 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <div className="break-words">
          <ChatMarkdown
            content={message.content}
            shipmentsByReference={shipmentsByReference}
            onShipmentClick={navigateToShipment}
          />
        </div>

        {matchedShipments.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-[#e2e8f0] pt-3 dark:border-slate-600">
            {matchedShipments.map((s) => {
              const risk = shipmentRiskLevel(s);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-3 text-left shadow-sm dark:border-slate-600 dark:bg-slate-900/90"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[13px] font-semibold text-[#0f172a] dark:text-slate-100">
                          {s.reference}
                        </p>
                        <RiskBadge level={risk} />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] capitalize text-[#64748b]">
                        Status: {s.customsStatus || "unknown"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#64748b]">
                        ETA{" "}
                        <span className="font-semibold tabular-nums text-[#0f172a] dark:text-slate-200">
                          {formatEtaChatLong(s.eta)}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#94a3b8]">
                        {(s.origin || "—") + " → " + (s.destination || "—")}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 shrink-0 text-[#38bdf8]" aria-hidden />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigateToShipment(s.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#2563eb] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      disabled={draftBusy}
                      onClick={() => void runDraft(s)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-[11px] font-medium text-[#0f172a] hover:bg-[#f1f5f9] disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Mail className="h-3 w-3" />
                      Draft email
                    </button>
                    <button
                      type="button"
                      onClick={() => void markReviewed(s)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Mark reviewed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {firstShipment && (
          <div className="mt-3 border-t border-[#e2e8f0] pt-3 dark:border-slate-600">
            <button
              type="button"
              onClick={() => navigateToShipment(firstShipment.id)}
              className="w-full rounded-lg border border-[#2563eb]/30 bg-[#eff6ff] py-2 text-[12px] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
            >
              Take action — open {firstShipment.reference}
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#e2e8f0] pt-3 dark:border-slate-600">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleQuickReply(q)}
              className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#475569] transition hover:border-[#93c5fd] hover:bg-[#eff6ff] hover:text-[#1d4ed8] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {q}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] tabular-nums text-[#94a3b8] dark:text-slate-500">
          {new Date(message.time).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {toast && (
        <p className="mt-1.5 text-[11px] text-[#64748b]" role="status">
          {toast}
        </p>
      )}

      {draftOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="max-h-[min(70vh,480px)] w-full max-w-lg overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] dark:text-slate-100">
                <FileText className="h-4 w-4 text-[#2563eb]" />
                Draft — {draftOpen.reference}
              </div>
              <button
                type="button"
                onClick={() => setDraftOpen(null)}
                className="rounded-lg px-2 py-1 text-[12px] text-[#64748b] hover:bg-[#f1f5f9]"
              >
                Close
              </button>
            </div>
            <textarea
              readOnly
              className="h-[min(50vh,320px)] w-full resize-none border-0 bg-[#f8fafc] p-4 font-mono text-[13px] text-[#0f172a] focus:outline-none dark:bg-slate-950 dark:text-slate-100"
              value={draftText}
            />
            <div className="border-t border-[#e2e8f0] px-4 py-2 dark:border-slate-700">
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(draftText)}
                className="text-[12px] font-medium text-[#2563eb] hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
