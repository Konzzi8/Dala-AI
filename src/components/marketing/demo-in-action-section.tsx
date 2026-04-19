"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, ChevronRight, Mail, Sparkles } from "lucide-react";

type Props = { onRequestDemo: () => void };

export function DemoInActionSection({ onRequestDemo }: Props) {
  return (
    <section id="demo" className="relative scroll-mt-24 overflow-hidden bg-white py-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_45%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent" />

      <div className="relative mx-auto max-w-[1280px] px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2563eb]">See Dala in action</p>
          <h2 className="mt-4 text-[34px] font-bold leading-[1.15] tracking-[-0.02em] text-[#0f172a] md:text-[40px]">
            Raw email becomes structured intelligence
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-[#64748b]">
            Watch how a carrier update turns into queryable shipment data your whole team can use.
          </p>
        </motion.div>

        {/* Main visual: browser-style frame */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="relative mx-auto mt-16 max-w-[1100px]"
        >
          <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-[#2563eb]/12 via-transparent to-[#0ea5e9]/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.15),0_0_0_1px_rgba(15,23,42,0.04)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-[#f1f5f9] bg-[#fafbfc] px-4 py-3 sm:px-5">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#fecaca]" />
                <span className="h-3 w-3 rounded-full bg-[#fde68a]" />
                <span className="h-3 w-3 rounded-full bg-[#bbf7d0]" />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-left shadow-sm">
                <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate font-mono text-[11px] text-[#64748b] sm:text-[12px]">outlook.office.com · Inbox</span>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_auto_1fr]">
              {/* Email panel */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="relative border-b border-[#f1f5f9] bg-gradient-to-b from-[#f8fafc] to-white p-6 sm:p-8 lg:border-b-0 lg:border-r"
              >
                <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  <Mail className="h-4 w-4 text-[#2563eb]" />
                  Incoming message
                </div>
                <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                  <p className="font-mono text-[11px] text-[#94a3b8]">Subject: RE: ETA update — MSCU9998888</p>
                  <p className="mt-4 text-[14px] leading-[1.7] text-[#334155]">
                    Dear team,
                    <br />
                    <br />
                    Please note <strong className="font-semibold text-[#0f172a]">revised ETA Los Angeles</strong>{" "}
                    <motion.span
                      className="inline-block rounded-md bg-[#eff6ff] px-2 py-0.5 font-mono text-[13px] font-semibold text-[#2563eb] ring-1 ring-[#bfdbfe]"
                      initial={{ scale: 0.95 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      2026-04-08
                    </motion.span>
                    . Vessel schedule unchanged.
                  </p>
                </div>
              </motion.div>

              {/* Pipeline center */}
              <div className="relative flex flex-col items-center justify-center gap-3 border-y border-[#f1f5f9] bg-[#fafbfc] px-6 py-10 lg:w-[200px] lg:border-x lg:border-y-0">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] shadow-lg shadow-[#2563eb]/35"
                >
                  <Sparkles className="h-9 w-9 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl ring-2 ring-white/30"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">Dala parse</p>
                  <p className="mt-1 text-[13px] font-medium text-[#0f172a]">Structured in seconds</p>
                </div>
                <div className="hidden items-center gap-1 text-[#94a3b8] lg:flex" aria-hidden>
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </div>
              </div>

              {/* JSON / output */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="relative bg-gradient-to-b from-[#0f172a] to-[#0c1222] p-6 sm:p-8"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                    <Bot className="h-4 w-4 text-sky-400" />
                    Shipment record
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Synced
                  </span>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-slate-700/80 bg-[#020617]/80 p-4 font-mono text-[12px] leading-relaxed text-[#e2e8f0] shadow-inner sm:text-[13px]">
                  <code>
                    <span className="text-slate-500">{"{"}</span>
                    {"\n"}
                    <span className="text-sky-300">  &quot;reference&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-emerald-300">&quot;FF-2026-441&quot;</span>
                    <span className="text-slate-500">,</span>
                    {"\n"}
                    <span className="text-sky-300">  &quot;eta&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-emerald-300">&quot;2026-04-08&quot;</span>
                    <span className="text-slate-500">,</span>
                    {"\n"}
                    <span className="text-sky-300">  &quot;containers&quot;</span>
                    <span className="text-slate-500">: [</span>
                    <span className="text-emerald-300">&quot;MSCU9998888&quot;</span>
                    <span className="text-slate-500">],</span>
                    {"\n"}
                    <span className="text-sky-300">  &quot;risk&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-amber-300">&quot;elevated&quot;</span>
                    {"\n"}
                    <span className="text-slate-500">{"}"}</span>
                  </code>
                </pre>
                <p className="mt-4 text-[12px] leading-relaxed text-[#64748b]">
                  Immediately available in search, reports, and the AI copilot.
                </p>
              </motion.div>
            </div>

            {/* Bottom strip: mini features */}
            <div className="grid gap-px bg-[#e2e8f0] sm:grid-cols-3">
              {[
                { t: "Outlook sync", s: "Bi-directional mail" },
                { t: "Risk engine", s: "Flags delays & docs" },
                { t: "Copilot", s: "Natural language Q&A" },
              ].map((x) => (
                <div key={x.t} className="bg-[#fafbfc] px-5 py-4 text-center sm:text-left">
                  <p className="text-[13px] font-semibold text-[#0f172a]">{x.t}</p>
                  <p className="mt-0.5 text-[12px] text-[#64748b]">{x.s}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
        >
          <button
            type="button"
            onClick={onRequestDemo}
            className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-[#2563eb] bg-white px-8 text-[14px] font-semibold text-[#2563eb] shadow-sm transition duration-150 hover:bg-[#eff6ff]"
          >
            Book a live walkthrough
          </button>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2563eb] px-8 text-[14px] font-semibold text-white shadow-md shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8]"
          >
            Start free trial
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
