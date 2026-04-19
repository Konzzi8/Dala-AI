"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Anchor,
  ArrowRight,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Plug,
  Shield,
  Sparkles,
} from "lucide-react";
import { DemoInActionSection } from "./demo-in-action-section";
import { DashboardPreview } from "./dashboard-preview";
import { HowItWorksSection } from "./how-it-works-section";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45 },
};

const features = [
  {
    title: "Outlook Integration",
    body: "Auto sync emails from your inbox with secure Microsoft OAuth.",
    icon: Plug,
  },
  {
    title: "AI Email Parser",
    body: "Extract shipment data instantly — references, ETAs, containers, B/L.",
    icon: Mail,
  },
  {
    title: "Risk Detection",
    body: "Flag delays, customs holds, and missing documents before they escalate.",
    icon: Shield,
  },
  {
    title: "Live Dashboard",
    body: "Real-time shipment visibility across lanes and clients.",
    icon: LayoutDashboard,
  },
  {
    title: "AI Copilot",
    body: "Ask anything about your shipments in plain English.",
    icon: MessageSquare,
  },
  {
    title: "Document Tracker",
    body: "Never miss a required document — tracked per shipment.",
    icon: FileText,
  },
];

const logos = ["HarborLine", "Continental", "Pacific Lane", "NordFreight", "Andes Cargo"];

type Props = { onRequestDemo: () => void };

export function PremiumMarketingSections({ onRequestDemo }: Props) {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen overflow-x-hidden pt-[72px] text-white">
        <div className="marketing-hero-bg absolute inset-0" />
        <div className="marketing-dot-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.2),transparent_55%)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-[1280px] flex-col items-center px-8 pb-24 pt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center rounded-full border border-[rgba(37,99,235,0.35)] bg-[rgba(37,99,235,0.15)] px-4 py-2 text-[13px] font-medium text-[#60a5fa]"
          >
            Now with AI-powered email parsing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-8 max-w-[800px] text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[56px] md:text-[72px]"
          >
            Your Freight Operations,
            <br />
            Running on Autopilot
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 max-w-[560px] text-[18px] leading-[1.6] text-[#94a3b8] sm:text-[20px]"
          >
            Connect your Outlook. We handle the rest. Shipment tracking, risk alerts, and AI assistance — all
            automated.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-lg bg-[#2563eb] px-8 text-[15px] font-medium text-white shadow-lg shadow-[#2563eb]/25 transition duration-150 ease-out hover:scale-[0.99] hover:bg-[#1d4ed8]"
            >
              Start free trial
            </Link>
            <a
              href="#demo"
              className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-lg border border-white/30 bg-transparent px-8 text-[15px] font-medium text-white transition duration-150 ease-out hover:bg-white/10"
            >
              See how it works
            </a>
          </motion.div>

          <p className="mt-6 text-[13px] text-[#64748b]">
            No credit card required · Setup in 10 minutes · Cancel anytime
          </p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-16 w-full max-w-[960px] pb-8"
          >
            <div className="mb-6 flex w-full justify-center overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-nowrap items-center justify-center gap-2 px-1 sm:flex-wrap sm:gap-3">
                {[
                  { icon: Mail, label: "Outlook inbox", accent: "text-sky-400" },
                  { icon: Sparkles, label: "AI parses & structures", accent: "text-violet-300" },
                  { icon: LayoutDashboard, label: "Live shipment board", accent: "text-emerald-300" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2 sm:gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-[#e2e8f0] shadow-[0_0_24px_rgba(37,99,235,0.12)] backdrop-blur-sm sm:text-[13px]">
                      <step.icon className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${step.accent}`} strokeWidth={2} />
                      {step.label}
                    </span>
                    {i < 2 && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#475569]" aria-hidden />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Flat mock — no 3D tilt (avoids clipping / off-center perception). Glow only on frame. */}
            <div className="hero-showcase-frame mx-auto w-full max-w-[920px] overflow-hidden rounded-xl border border-white/10 ring-1 ring-white/[0.06]">
              <DashboardPreview />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-[#1f2937] bg-[#111827] py-16">
        <div className="mx-auto max-w-[1280px] px-8 text-center">
          <p className="mb-8 text-[13px] text-[#64748b]">Trusted by freight forwarders across the US</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {logos.map((name) => (
              <span key={name} className="text-[15px] font-semibold tracking-wide text-[#374151]">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 bg-white py-24">
        <div className="mx-auto max-w-[1280px] px-8">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.1em] text-[#2563eb]">Platform features</p>
          <h2 className="mt-4 text-center text-[36px] font-bold leading-[1.2] tracking-[-0.02em] text-[#0f172a] md:text-[40px]">
            Everything your team needs
            <br />
            in one place
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-center text-[15px] leading-[1.6] text-[#64748b]">
            Purpose-built for forwarders who live in email — structured data, risk signals, and AI in one secure
            workspace.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                className="group rounded-xl border border-[#e2e8f0] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition duration-150 ease-out hover:-translate-y-0.5 hover:border-[#2563eb]/40 hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2563eb] transition group-hover:bg-[#dbeafe]">
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold leading-snug text-[#0f172a]">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-[#64748b]">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band (was light — now dark per spec) */}
      <section className="bg-[#0f172a] py-20">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "50,000+", l: "Freight forwarders in our market" },
            { n: "3 hrs", l: "Saved per operator per day" },
            { n: "98%", l: "Email parse accuracy" },
            { n: "10 min", l: "Average setup time" },
          ].map((s) => (
            <div key={s.l} className="text-center lg:border-r lg:border-slate-700 lg:pr-8 lg:last:border-0 lg:last:pr-0">
              <p className="text-[48px] font-extrabold tabular-nums text-white">{s.n}</p>
              <p className="mt-2 text-[15px] text-[#94a3b8]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <HowItWorksSection />

      <DemoInActionSection onRequestDemo={onRequestDemo} />

      {/* Testimonials */}
      <section className="border-t border-[#e2e8f0] bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-[1280px] px-8">
          <h2 className="text-center text-[32px] font-bold tracking-[-0.02em] text-[#0f172a]">
            Trusted by forward-thinking teams
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Sarah Chen",
                role: "Operations Director, Pacific Lane Logistics",
                quote:
                  "We went from inbox chaos to a single queue. Dala catches delays before we explain them to clients.",
              },
              {
                name: "Marcus Weber",
                role: "Founder, NordFreight GmbH",
                quote:
                  "The copilot is accurate on container refs and ETAs. Like having a senior analyst on call.",
              },
              {
                name: "Elena Vasquez",
                role: "Head of Trade, Andes Cargo",
                quote: "Email parsing saves hours daily. Risk flags paid for the tool in the first month.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-[#e2e8f0] bg-white p-7 shadow-[var(--shadow-card)]"
              >
                <div className="mb-4 flex gap-0.5 text-[#d97706]">★★★★★</div>
                <p className="text-[14px] leading-[1.6] text-[#475569]">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-[12px] font-bold text-white">
                    {t.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#0f172a]">{t.name}</p>
                    <p className="text-[13px] text-[#64748b]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-20">
        <div className="mx-auto max-w-[1280px] px-8 text-center">
          <h2 className="text-[36px] font-bold leading-[1.2] tracking-[-0.02em] text-white md:text-[40px]">
            Ready to automate your freight operations?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-white/80">
            Join teams who replaced manual triage with structured shipment intelligence.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-white px-10 text-[15px] font-semibold text-[#2563eb] shadow-lg transition duration-150 ease-out hover:scale-[0.99]"
          >
            Get started free
          </Link>
          <p className="mt-6 text-[13px] text-white/70">SOC2-ready infrastructure · Your data stays yours</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] py-16 text-[#f1f5f9]">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb]">
                <Anchor className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[18px] font-extrabold text-white">Dala AI</span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-[1.6] text-[#94a3b8]">
              Freight intelligence from inbox to insight — built for modern forwarders.
            </p>
          </div>
          <div>
            <p className="label-caps text-[#64748b]">Product</p>
            <ul className="mt-4 space-y-3 text-[14px]">
              <li>
                <a href="#features" className="text-[#94a3b8] transition hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#demo" className="text-[#94a3b8] transition hover:text-white">
                  Demo
                </a>
              </li>
              <li>
                <Link href="/login" className="text-[#94a3b8] transition hover:text-white">
                  Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="label-caps text-[#64748b]">Company</p>
            <ul className="mt-4 space-y-3 text-[14px]">
              <li>
                <button type="button" onClick={onRequestDemo} className="text-[#94a3b8] transition hover:text-white">
                  Contact
                </button>
              </li>
            </ul>
          </div>
          <div>
            <p className="label-caps text-[#64748b]">Legal</p>
            <ul className="mt-4 space-y-3 text-[14px]">
              <li>
                <Link href="/privacy" className="text-[#94a3b8] transition hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#94a3b8] transition hover:text-white">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-14 flex max-w-[1280px] flex-col items-center justify-between gap-4 border-t border-[#1e293b] px-8 pt-8 text-[13px] text-[#64748b] sm:flex-row">
          <p>© {new Date().getFullYear()} Dala AI. All rights reserved.</p>
          <p>Built for freight forwarders</p>
        </div>
      </footer>
    </>
  );
}
