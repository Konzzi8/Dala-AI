"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, Mail, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    timing: "~30 sec",
    title: "Connect Outlook",
    description: "One-click Microsoft 365 OAuth. Your credentials never touch our servers in plain text.",
    icon: Mail,
    accent: "from-[#2563eb]/15 to-[#0ea5e9]/10",
  },
  {
    step: "02",
    timing: "Automatic",
    title: "AI parses every email",
    description: "References, ETAs, containers, and B/L numbers are extracted and matched to shipments.",
    icon: Sparkles,
    accent: "from-[#8b5cf6]/15 to-[#2563eb]/10",
  },
  {
    step: "03",
    timing: "Real-time",
    title: "Operate from one dashboard",
    description: "Risks, documents, and the copilot — all synced to a single source of truth.",
    icon: LayoutDashboard,
    accent: "from-[#0ea5e9]/15 to-[#2563eb]/10",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 26, stiffness: 280 },
  },
};

function Connector() {
  return (
    <div className="relative flex h-full min-h-[200px] w-[72px] shrink-0 items-center justify-center" aria-hidden>
      {/* Desktop: horizontal flow line */}
      <div className="absolute inset-y-0 left-0 right-0 hidden items-center lg:flex">
        <div className="h-px w-full bg-gradient-to-r from-[#cbd5e1] via-[#2563eb]/45 to-[#cbd5e1]" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
        className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-[0_4px_14px_rgba(37,99,235,0.12)]"
      >
        <ArrowRight className="h-4 w-4 text-[#2563eb]" />
      </motion.div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how" className="relative scroll-mt-24 overflow-hidden bg-[#f8fafc] py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.08),transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2563eb]">How it works</p>
          <h2 className="mt-4 text-[34px] font-bold leading-[1.15] tracking-[-0.02em] text-[#0f172a] md:text-[40px]">
            From inbox noise to operational clarity
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-[#64748b]">
            Three steps. No spreadsheets, no manual copy-paste — just connected data your team can trust.
          </p>
        </motion.div>

        {/* Desktop: horizontal pipeline */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-16 hidden items-stretch lg:flex"
        >
          {steps.map((s, i) => (
            <Fragment key={s.step}>
              <motion.div variants={item} className="min-w-0 flex-1">
                <div
                  className={`relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(15,23,42,0.12)] transition hover:shadow-[0_20px_50px_-15px_rgba(37,99,235,0.15)]`}
                >
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${s.accent} blur-2xl`} />
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
                        Step {s.step}
                      </span>
                      <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold text-[#2563eb]">
                        {s.timing}
                      </span>
                    </div>
                    <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-[#2563eb] shadow-inner">
                      <s.icon className="h-7 w-7" strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 text-[20px] font-semibold leading-snug tracking-tight text-[#0f172a]">
                      {s.title}
                    </h3>
                    <p className="mt-3 flex-1 text-[15px] leading-[1.65] text-[#64748b]">{s.description}</p>
                  </div>
                </div>
              </motion.div>
              {i < steps.length - 1 ? <Connector /> : null}
            </Fragment>
          ))}
        </motion.div>

        {/* Mobile: stacked */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-14 flex flex-col gap-6 lg:hidden"
        >
          {steps.map((s, i) => (
            <motion.div key={s.step} variants={item}>
              <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${s.accent} blur-2xl`} />
                <div className="relative flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-[#2563eb]">
                    <s.icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                        Step {s.step}
                      </span>
                      <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[11px] font-semibold text-[#2563eb]">
                        {s.timing}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[18px] font-semibold text-[#0f172a]">{s.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[#64748b]">{s.description}</p>
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="h-8 w-px bg-gradient-to-b from-[#2563eb]/40 via-[#2563eb]/60 to-[#2563eb]/40" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
