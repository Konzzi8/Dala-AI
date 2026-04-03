"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { internalApiUrl } from "@/lib/api-urls";
import {
  priorityTier,
  priorityTierHint,
  priorityTierLabel,
} from "@/lib/priority-display";
import type { Shipment } from "@/lib/types";

const SHIPMENT_RECORD_TABS = [
  { id: "overview" as const, label: "Overview" },
  { id: "details" as const, label: "Details" },
  { id: "documents" as const, label: "Documents" },
  { id: "risk" as const, label: "Risk" },
  { id: "emails" as const, label: "Emails" },
];
type ShipmentRecordTabId = (typeof SHIPMENT_RECORD_TABS)[number]["id"];

const panelSurface =
  "rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl shadow-[var(--shadow-ui)]";

function Icon({
  children,
  className = "h-4 w-4",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function Panel({
  children,
  className = "",
  padding = "p-6",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`${panelSurface} ${padding} ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({
  children,
  icon,
  subtitle,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300/90 text-sky-700 ring-1 ring-zinc-300/80 dark:from-zinc-700 dark:to-zinc-800/90 dark:text-sky-400 dark:ring-zinc-600">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{children}</h2>
          {subtitle ? (
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
          ) : (
            <div className="mt-2 h-px w-14 bg-gradient-to-r from-sky-500/60 to-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level, compact }: { level: string; compact?: boolean }) {
  const map =
    level === "high"
      ? "border-red-200 bg-red-50 text-red-800 ring-red-200/90 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/30"
      : level === "medium"
        ? "border-sky-200 bg-sky-50 text-sky-800 ring-sky-200/90 dark:border-sky-800/50 dark:bg-sky-950/35 dark:text-sky-200 dark:ring-sky-800/40"
        : "border-emerald-200 bg-emerald-50 text-emerald-800 ring-emerald-200/90 dark:border-emerald-900/45 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/30";
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  const size = compact
    ? "px-2 py-0.5 text-[10px] sm:text-[11px]"
    : "px-3 py-1 text-xs";
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold capitalize tracking-wide ring-1 ${size} ${map}`}>
      {label}
    </span>
  );
}

function PriorityMeter({ score }: { score: number }) {
  const safe = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const tier = priorityTier(safe);
  const label = priorityTierLabel(tier);
  const hint = priorityTierHint(tier);
  const barClass =
    tier === "critical"
      ? "from-red-600 via-red-500 to-red-400"
      : tier === "elevated"
        ? "from-sky-600 to-sky-400"
        : tier === "watch"
          ? "from-sky-800/90 to-sky-500/70"
          : "from-zinc-600 to-zinc-500";
  const badgeClass =
    tier === "critical"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
      : tier === "elevated"
        ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/35 dark:text-sky-200"
        : tier === "watch"
          ? "border-sky-200 bg-sky-50/80 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-200"
          : "border-[var(--border)] bg-[var(--card-muted)] text-[var(--text-muted)]";

  return (
    <div
      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]/80 p-4 shadow-sm ring-1 ring-[var(--border)]/60 sm:max-w-[220px] sm:shrink-0"
      role="group"
      aria-label={`Priority ${safe} out of 100, ${label}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">Priority score</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${badgeClass}`}>
          {label}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--text)] sm:text-3xl">{safe}</span>
        <span className="pb-0.5 text-xs font-medium text-[var(--text-muted)]">/100</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]/70">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barClass} motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out`}
          style={{ width: `${safe}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-[var(--text)]">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3.5 text-base leading-relaxed text-[var(--text)] placeholder:text-[var(--text-subtle)] shadow-inner shadow-black/[0.04] transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/25 dark:shadow-black/25";

const monoArea = `font-[family-name:var(--font-mono)]`;

function CopilotWelcome() {
  return (
    <div className="flex justify-start gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-200 to-sky-300 text-xs font-bold text-sky-900 ring-1 ring-sky-400/30 dark:from-sky-800 dark:to-sky-900 dark:text-sky-100 dark:ring-sky-600/40"
        aria-hidden
      >
        AI
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-bl-md border border-sky-300/70 bg-gradient-to-br from-sky-100/80 to-[var(--card)] px-5 py-4 text-base leading-relaxed text-[var(--text)] dark:border-sky-800/50 dark:from-sky-950/50 dark:to-[var(--card)]">
        <p className="mb-3">
          <span className="font-semibold text-sky-800 dark:text-sky-300">Dala Copilot</span> answers from your live shipment
          list and detail panel only — not from the open web.
        </p>
        <p className="text-[var(--text-muted)]">
          Ask about priorities, documents, ETAs, or a container ID. If a fact isn&apos;t in your data,
          I&apos;ll say so instead of guessing.
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Use a shortcut below or write your own question, then press <strong className="text-[var(--text)]">Send</strong>.
          Basic answers work without an OpenAI key (built-in rules).
        </p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1 py-0.5" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--text-subtle)]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default function Home() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingestSubject, setIngestSubject] = useState("RE: Booking FF-2026-0201 — MSCU9998888");
  const [ingestFrom, setIngestFrom] = useState("client@shipper.com");
  const [ingestBody, setIngestBody] = useState(
    [
      "Hi team,",
      "",
      "Please note ETA Los Angeles 2026-04-08 for container MSCU9998888.",
      "B/L reference BL-LAX-99001 attached.",
      "We still need confirmation on free time — LFD currently 2026-04-11.",
      "Commercial invoice not yet received on our side.",
      "",
      "Thanks,",
    ].join("\n"),
  );
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestNote, setIngestNote] = useState<string | null>(null);
  const [chatQ, setChatQ] = useState("Which shipments are at risk this week?");
  const [chatA, setChatA] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatSource, setChatSource] = useState<string | null>(null);
  const [lastChatPrompt, setLastChatPrompt] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shipmentRecordTab, setShipmentRecordTab] = useState<ShipmentRecordTabId>("overview");

  const stats = useMemo(() => {
    const high = shipments.filter((s) => s.risks.some((r) => r.level === "high")).length;
    const med = shipments.filter(
      (s) => !s.risks.some((r) => r.level === "high") && s.risks.some((r) => r.level === "medium"),
    ).length;
    return { total: shipments.length, high, med };
  }, [shipments]);

  const refresh = useCallback(async () => {
    const res = await fetch(internalApiUrl("/api/shipments"));
    const data = (await res.json()) as {
      shipments?: Shipment[];
      error?: string;
    };
    const list = Array.isArray(data.shipments) ? data.shipments : [];
    setLoadError(!res.ok && data.error ? data.error : null);
    setShipments(list);
    setSelected((cur) => {
      if (!cur) return list[0] || null;
      const u = list.find((s) => s.id === cur.id);
      return u || list[0] || null;
    });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    setShipmentRecordTab("overview");
  }, [selected?.id]);

  async function onIngest(e: React.FormEvent) {
    e.preventDefault();
    setIngestBusy(true);
    setIngestNote(null);
    try {
      const res = await fetch(internalApiUrl("/api/ingest"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ingestSubject,
          from: ingestFrom,
          text: ingestBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setIngestNote(`Parsed with ${data.parser} parser — merged into shipment record.`);
      await refresh();
      const sh = data.shipment as Shipment;
      setSelected(sh);
    } catch (err) {
      setIngestNote(err instanceof Error ? err.message : "Error");
    } finally {
      setIngestBusy(false);
    }
  }

  async function onChat(e: React.FormEvent) {
    e.preventDefault();
    const q = chatQ.trim();
    if (!q) return;
    setChatBusy(true);
    setChatA("");
    setChatSource(null);
    setLastChatPrompt(q);
    try {
      const res = await fetch(internalApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = (await res.json()) as { answer?: string; error?: string; source?: string };
      const text =
        data.answer ||
        data.error ||
        (!res.ok ? `Request failed (${res.status}). Try again.` : "No answer returned.");
      setChatA(text);
      setChatSource(data.source || (res.ok ? null : "error"));
    } catch {
      setChatA("Couldn't reach the server. Check your network and that the app is running.");
      setChatSource("error");
    } finally {
      setChatBusy(false);
    }
  }

  async function onDraft() {
    if (!selected) return;
    setDraftBusy(true);
    setDraft("");
    try {
      const res = await fetch(internalApiUrl("/api/draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId: selected.id }),
      });
      const data = await res.json();
      setDraft(data.draft || "");
    } finally {
      setDraftBusy(false);
    }
  }

  return (
    <div className="app-shell relative min-h-screen text-[var(--text)]">
      <div className="pointer-events-none fixed inset-0 app-grid" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--header-bg)]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-8">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-lg font-bold text-white shadow-lg shadow-sky-500/25 ring-1 ring-sky-300/50 dark:ring-sky-500/30">
              D
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] md:text-3xl">
                Dala AI
                <span className="ml-2 text-xl font-medium text-[var(--text-muted)] md:text-2xl">Freight co-pilot</span>
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
                Turn carrier email into structured shipments, see risk at a glance, and ask questions in plain
                English.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 lg:shrink-0">
            <div className="flex gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]/90 p-2 shadow-sm">
              <div className="min-w-[4.5rem] rounded-xl bg-[var(--card)] px-4 py-3 text-center shadow-sm ring-1 ring-[var(--border)]/70">
                <p className="text-xs font-medium text-[var(--text-muted)]">Active</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--text)]">{stats.total}</p>
              </div>
              <div className="min-w-[4.5rem] rounded-xl px-4 py-3 text-center">
                <p className="text-xs font-medium text-red-700 dark:text-red-400">High risk</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-red-700 dark:text-red-400">{stats.high}</p>
              </div>
              <div className="min-w-[4.5rem] rounded-xl px-4 py-3 text-center">
                <p className="text-xs font-medium text-sky-800 dark:text-sky-300">Medium</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-sky-800 dark:text-sky-300">{stats.med}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/90 px-4 py-2.5 font-mono text-xs text-[var(--text-muted)] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Supabase <code className="text-sky-700 dark:text-sky-400">shipments</code>
            </div>
            <Link
              href="/login"
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:border-sky-400/50 hover:bg-[var(--card-muted)]"
            >
              Sign in
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1600px] px-5 pb-20 pt-10 md:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8 lg:items-start">
          {/* Column 1 */}
          <section className="flex min-h-0 flex-col gap-8">
            <div>
              <SectionLabel
                subtitle="Tap a row to open details. Higher scores usually need attention first."
                icon={
                  <Icon>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </Icon>
                }
              >
                Queue & priority
              </SectionLabel>
              {loadError && (
                <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  {loadError}
                </p>
              )}
              <Panel padding="p-0" className="overflow-hidden">
                {loading ? (
                  <div className="space-y-3 p-5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse rounded-2xl bg-gradient-to-r from-[var(--card-muted)] via-[var(--border)]/40 to-[var(--card-muted)]"
                      />
                    ))}
                  </div>
                ) : shipments.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--card-muted)] ring-1 ring-[var(--border)]">
                      <Icon className="h-7 w-7 text-[var(--text-subtle)]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </Icon>
                    </div>
                    <p className="text-base font-semibold text-[var(--text)]">Your queue is empty</p>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
                      Add your first shipment by pasting an email in <strong className="text-[var(--text)]">Ingest email</strong>{" "}
                      below.
                    </p>
                  </div>
                ) : (
                  <ul className="scroll-sleek flex max-h-[min(440px,58vh)] flex-col gap-3 overflow-y-auto p-4">
                    {shipments.map((s) => {
                      const top = s.risks.find((r) => r.level === "high") || s.risks[0];
                      const active = selected?.id === s.id;
                      const dot =
                        top?.level === "high"
                          ? "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.5)]"
                          : top?.level === "medium"
                            ? "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                            : "bg-emerald-400/90";
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(s)}
                            className={`group w-full rounded-2xl border px-4 py-4 text-left transition motion-safe:duration-200 ${
                              active
                                ? "border-sky-400/60 bg-gradient-to-br from-sky-100/90 to-[var(--card)] shadow-md shadow-sky-200/90 ring-1 ring-sky-300/50 dark:border-sky-600/50 dark:from-sky-950/40 dark:to-[var(--card)] dark:shadow-sky-900/40 dark:ring-sky-800/40"
                                : "border-transparent bg-[var(--card-muted)]/60 hover:border-[var(--border)] hover:bg-[var(--card)] motion-safe:hover:-translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-1 items-center gap-2 pr-1">
                                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                                <span className="truncate text-base font-semibold text-[var(--text)]">{s.reference}</span>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <span className="whitespace-nowrap text-[10px] font-semibold tabular-nums leading-none text-[var(--text-muted)] sm:text-[11px]">
                                  {s.priorityScore}
                                  <span className="font-normal text-[var(--text-subtle)]">/100</span>
                                </span>
                                <RiskBadge compact level={top?.level || "low"} />
                              </div>
                            </div>
                            <p className="mt-2 line-clamp-2 pl-4 text-sm leading-relaxed text-[var(--text-muted)]">
                              {top?.message}
                            </p>
                            {s.containerNumbers.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5 pl-4 pr-1">
                                {s.containerNumbers.map((c) => (
                                  <span
                                    key={c}
                                    className="rounded-lg border border-sky-300/70 bg-sky-100/90 px-2 py-1 font-mono text-xs text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-200"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            </div>

            <div>
              <SectionLabel
                subtitle="Paste a carrier or forwarder email. We parse it and merge fields into the matching shipment."
                icon={
                  <Icon>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </Icon>
                }
              >
                Ingest email
              </SectionLabel>
              <form onSubmit={onIngest} className="space-y-5">
                <Panel className="space-y-5 p-6">
                  <div>
                    <FieldLabel htmlFor="subj">Subject</FieldLabel>
                    <input
                      id="subj"
                      className={inputClass}
                      value={ingestSubject}
                      onChange={(e) => setIngestSubject(e.target.value)}
                      placeholder="e.g. RE: ETA update — MSCU…"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="from">From</FieldLabel>
                    <input
                      id="from"
                      className={inputClass}
                      value={ingestFrom}
                      onChange={(e) => setIngestFrom(e.target.value)}
                      placeholder="carrier@domain.com"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="body">Body</FieldLabel>
                    <textarea
                      id="body"
                      className={`${inputClass} min-h-[160px] resize-y ${monoArea}`}
                      value={ingestBody}
                      onChange={(e) => setIngestBody(e.target.value)}
                      placeholder="Paste full email text…"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={ingestBusy}
                    aria-label={ingestBusy ? "Parsing email" : "Run AI parser on email"}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/35 disabled:opacity-50"
                  >
                    <Icon className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </Icon>
                    {ingestBusy ? "Parsing…" : "Run AI parser"}
                  </button>
                  {ingestNote && (
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 whitespace-pre-wrap dark:border-emerald-900/45 dark:bg-emerald-950/35 dark:text-emerald-200">
                      {ingestNote}
                    </p>
                  )}
                </Panel>
              </form>
            </div>
          </section>

          {/* Column 2 */}
          <section className="flex min-h-0 flex-col gap-8">
            <SectionLabel
              subtitle="Use the tabs below to move between overview, field details, documents, risk, and email history."
              icon={
                <Icon>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </Icon>
              }
            >
              Shipment record
            </SectionLabel>
            {!selected ? (
              <Panel className="flex flex-col items-center justify-center px-8 py-16 text-center">
                <div className="mb-3 rounded-2xl bg-[var(--card-muted)] p-2 ring-1 ring-[var(--border)]">
                  <Icon className="h-8 w-8 text-[var(--text-subtle)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </Icon>
                </div>
                <p className="text-base font-semibold text-[var(--text)]">Select a shipment</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
                  Click a row in the queue on the left, or ingest an email to create or update a record.
                </p>
              </Panel>
            ) : (
              <Panel className="overflow-hidden p-0">
                <div
                  className="border-b border-[var(--border)] bg-[var(--card-muted)]/40 px-3 py-4 sm:px-5"
                  role="tablist"
                  aria-label="Shipment record sections"
                >
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:pb-0">
                    {SHIPMENT_RECORD_TABS.map((tab) => {
                      const active = shipmentRecordTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          id={`shipment-tab-${tab.id}`}
                          aria-controls={`shipment-panel-${tab.id}`}
                          onClick={() => setShipmentRecordTab(tab.id)}
                          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                            active
                              ? "bg-[var(--card)] text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]"
                              : "text-[var(--text-muted)] hover:bg-[var(--card)]/60 hover:text-[var(--text)]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6">
                  {shipmentRecordTab === "overview" && (
                    <div
                      className="space-y-8"
                      role="tabpanel"
                      id="shipment-panel-overview"
                      aria-labelledby="shipment-tab-overview"
                    >
                      <div className="space-y-4">
                        <p className="break-words text-3xl font-bold leading-snug tracking-normal text-[var(--text)] sm:text-4xl">
                          {selected.reference}
                        </p>
                        <p className="text-lg leading-relaxed text-[var(--text-muted)] sm:text-xl">
                          {selected.clientName || "Client not specified"}
                        </p>
                      </div>
                      <div className="border-t border-[var(--border)]/80 pt-8">
                        <div className="max-w-[min(100%,280px)]">
                          <PriorityMeter score={selected.priorityScore} />
                        </div>
                      </div>
                    </div>
                  )}

                  {shipmentRecordTab === "details" && (
                    <div
                      role="tabpanel"
                      id="shipment-panel-details"
                      aria-labelledby="shipment-tab-details"
                    >
                      <dl className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]/50 text-sm">
                        {[
                          ["Containers", selected.containerNumbers.join(", ") || "—"],
                          ["B/L", selected.blNumber || "—"],
                          ["ETA", selected.eta || "—"],
                          ["Free time end", selected.freeTimeEnd || "—"],
                          ["Route", `${selected.origin || "—"} → ${selected.destination || "—"}`],
                          ["Customs", (selected.customsStatus || "unknown").replace(/^./, (c) => c.toUpperCase())],
                          [
                            "Rate confirmed",
                            selected.rateConfirmed === undefined ? "—" : selected.rateConfirmed ? "Yes" : "No",
                          ],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-4 px-4 py-3.5">
                            <dt className="shrink-0 font-medium text-[var(--text-muted)]">{label}</dt>
                            <dd
                              className={`min-w-0 text-right leading-relaxed text-[var(--text)] ${label === "Containers" || label === "B/L" ? "font-mono text-sm" : ""}`}
                            >
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {shipmentRecordTab === "documents" && (
                    <div
                      role="tabpanel"
                      id="shipment-panel-documents"
                      aria-labelledby="shipment-tab-documents"
                    >
                      <ul className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--card-inset)]/90 p-4">
                        {selected.documents.map((d) => (
                          <li key={d.name} className="flex items-center justify-between gap-3 text-sm leading-relaxed">
                            <span className="text-[var(--text)]">{d.name}</span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                d.received
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                              }`}
                            >
                              {d.received ? "Received" : "Missing"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shipmentRecordTab === "risk" && (
                    <div role="tabpanel" id="shipment-panel-risk" aria-labelledby="shipment-tab-risk">
                      <ul className="space-y-3">
                        {selected.risks.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]/50 px-4 py-3 text-sm leading-relaxed"
                          >
                            <RiskBadge level={r.level} />
                            <span className="text-[var(--text)]">{r.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shipmentRecordTab === "emails" && (
                    <div role="tabpanel" id="shipment-panel-emails" aria-labelledby="shipment-tab-emails">
                      <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">
                        Saved with the shipment for audit (demo — not your live inbox).
                      </p>
                      <ul className="scroll-sleek max-h-[min(320px,50vh)] space-y-3 overflow-y-auto">
                        {selected.emails.length === 0 ? (
                          <li className="text-sm text-[var(--text-muted)]">No linked emails yet.</li>
                        ) : (
                          selected.emails.map((em) => (
                            <li
                              key={em.id}
                              className="rounded-2xl border border-[var(--border)] bg-[var(--card-inset)]/90 p-4 text-sm shadow-sm"
                            >
                              <p className="font-semibold text-[var(--text)]">{em.subject}</p>
                              <p className="mt-1 text-[var(--text-muted)]">{em.from}</p>
                              <p className="mt-2 line-clamp-3 leading-relaxed text-[var(--text-muted)]">{em.bodySnippet}</p>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </section>

          {/* Column 3 */}
          <section className="flex min-h-0 flex-col gap-8">
            <SectionLabel
              subtitle="Questions use only your shipment list below. Answers may be rule-based or AI, depending on your setup."
              icon={
                <Icon>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </Icon>
              }
            >
              Copilot
            </SectionLabel>
            <form onSubmit={onChat} className="space-y-5">
              <Panel className="space-y-5 p-6">
                {!lastChatPrompt && !chatA && !chatBusy && <CopilotWelcome />}
                <div className="flex flex-col gap-4">
                  <label htmlFor="chat" className="sr-only">
                    Ask about shipments
                  </label>
                  <textarea
                    id="chat"
                    className={`${inputClass} min-h-[120px] resize-none`}
                    value={chatQ}
                    onChange={(e) => setChatQ(e.target.value)}
                    placeholder="Example: Which shipments need attention this week?"
                  />
                  <div className="flex flex-wrap gap-2">
                    {["Summarize high-risk shipments", "Any missing documents?", "Next ETAs this week"].map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setChatQ(suggestion)}
                          className="rounded-full border border-[var(--border)] bg-[var(--card-muted)]/80 px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition hover:border-sky-400/60 hover:bg-[var(--card)]"
                        >
                          {suggestion}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={chatBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-600 bg-zinc-800 py-4 text-base font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-500 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    <Icon className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </Icon>
                    {chatBusy ? "Thinking…" : "Send"}
                  </button>
                </div>

                {(lastChatPrompt || chatA || chatBusy) && (
                  <div className="space-y-4 border-t border-[var(--border)] pt-5">
                    {lastChatPrompt && (
                      <div className="flex justify-end">
                        <div className="max-w-[95%] rounded-2xl rounded-br-md border border-[var(--border)] bg-[var(--card-muted)]/90 px-5 py-3 text-base leading-relaxed text-[var(--text)]">
                          {lastChatPrompt}
                        </div>
                      </div>
                    )}
                    {chatBusy && !chatA && (
                      <div className="flex justify-start">
                        <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-base text-[var(--text-muted)] shadow-sm">
                          <TypingDots />
                        </div>
                      </div>
                    )}
                    {chatA && (
                      <div className="flex justify-start">
                        <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-sky-300/70 bg-gradient-to-br from-sky-100/90 to-[var(--card)] px-5 py-4 text-base leading-relaxed whitespace-pre-wrap text-[var(--text)] shadow-sm dark:border-sky-800/50 dark:from-sky-950/50 dark:to-[var(--card)]">
                          {chatA}
                        </div>
                      </div>
                    )}
                    {chatSource && (
                      <p className="text-center text-xs text-[var(--text-muted)]">
                        Source: <span className="font-medium text-[var(--text)]">{chatSource}</span>
                      </p>
                    )}
                  </div>
                )}
              </Panel>
            </form>

            <Panel className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Icon className="h-6 w-6 text-sky-600 dark:text-sky-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </Icon>
                <p className="text-base font-semibold text-[var(--text)]">Draft client reply</p>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                Uses the shipment you selected. Add{" "}
                <code className="rounded-md bg-[var(--card-muted)] px-2 py-0.5 font-mono text-sm text-sky-800 ring-1 ring-[var(--border)] dark:text-sky-300">
                  OPENAI_API_KEY
                </code>{" "}
                for AI-written drafts; otherwise you get a structured template.
              </p>
              <button
                type="button"
                onClick={onDraft}
                disabled={!selected || draftBusy}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]/90 py-3.5 text-base font-medium text-[var(--text)] shadow-sm transition hover:border-sky-400/50 hover:bg-[var(--card)] disabled:opacity-40"
              >
                {draftBusy ? "Writing…" : "Generate draft"}
              </button>
              {draft && (
                <textarea
                  readOnly
                  className={`${inputClass} min-h-[220px] resize-y ${monoArea}`}
                  value={draft}
                />
              )}
            </Panel>
          </section>
        </div>
      </main>
    </div>
  );
}
