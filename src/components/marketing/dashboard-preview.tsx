"use client";

import { motion } from "framer-motion";
import { Bot, Send } from "lucide-react";

const rows = [
  { ref: "FF-2026-441", route: "Shanghai → Los Angeles", risk: "high" as const, eta: "Apr 8" },
  { ref: "BCO-2024-112", route: "Rotterdam → New York", risk: "medium" as const, eta: "Apr 12" },
  { ref: "HAP-2025-903", route: "Busan → Seattle", risk: "low" as const, eta: "Apr 15" },
];

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.12 }}
      className="relative mx-auto w-full max-w-[920px]"
    >
      <div className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04]">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
          </div>
          <span className="ml-2 font-mono text-xs text-[#64748b]">dala.ai/dashboard</span>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live sync
          </span>
        </div>

        <div className="border-b border-[#e2e8f0] bg-[#fafbff] px-4 py-2 text-center">
          <p className="text-[10px] font-medium text-[#64748b]">
            <span className="text-[#2563eb]">14 carrier emails</span> parsed this week · ETAs & risk flags updated
            automatically
          </p>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_minmax(220px,280px)]">
          <div className="border-b border-[#e2e8f0] p-4 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2563eb]">Active shipments</p>
              <span className="rounded-md bg-[#eff6ff] px-2 py-0.5 font-mono text-[10px] font-medium text-[#1d4ed8]">
                3 need attention
              </span>
            </div>
            <motion.div className="space-y-2" variants={stagger} initial="hidden" animate="show">
              {rows.map((row) => (
                <motion.div
                  key={row.ref}
                  variants={item}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm shadow-sm transition ${
                    row.risk === "high"
                      ? "border-red-200/80 bg-gradient-to-r from-red-50/90 to-white ring-1 ring-red-100/60"
                      : "border-[#e2e8f0] bg-[#f8fafc]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#0f172a]">{row.ref}</p>
                    <p className="truncate text-xs text-[#64748b]">{row.route}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        row.risk === "high"
                          ? "bg-red-100 text-[#b91c1c] ring-1 ring-red-200/80"
                          : row.risk === "medium"
                            ? "bg-amber-50 text-[#b45309] ring-1 ring-amber-100"
                            : "bg-emerald-50 text-[#15803d] ring-1 ring-emerald-100"
                      }`}
                    >
                      {row.risk}
                    </span>
                    <p className="mt-1 text-[10px] tabular-nums text-[#94a3b8]">ETA {row.eta}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="flex flex-col bg-gradient-to-b from-white to-[#f8fafc] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2563eb]">Copilot</p>
              <Bot className="h-4 w-4 text-[#2563eb]" />
            </div>
            <div className="min-h-[120px] flex-1 space-y-2 rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm">
              <div className="rounded-md bg-[#f8fafc] px-3 py-2 text-xs text-[#0f172a] ring-1 ring-[#e2e8f0]">
                Which shipments are at risk of delay this week?
              </div>
              <div className="rounded-md border border-[#dbeafe] bg-gradient-to-br from-[#eff6ff] to-white px-3 py-2.5 text-xs leading-relaxed text-[#475569]">
                <strong className="font-semibold text-[#2563eb]">FF-2026-441</strong> — customs hold flagged in the
                latest carrier email. Suggest drafting a client update referencing the new ETA window.
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <div className="h-8 flex-1 rounded-md border border-[#e2e8f0] bg-white text-[10px] leading-8 text-[#94a3b8] pl-2">
                Ask about your lanes…
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2563eb] text-white shadow-md shadow-[#2563eb]/25">
                <Send className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
