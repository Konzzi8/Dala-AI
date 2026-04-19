"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/dashboard/chat-markdown";
import { internalApiUrl } from "@/lib/api-urls";
import {
  type AssistantMessage,
  clearPendingHandoff,
  loadPendingHandoff,
} from "@/lib/assistant-storage";
import { normalizeShipmentReference } from "@/lib/shipment-reference";
import type { Shipment } from "@/lib/types";

const WELCOME_CHIPS = [
  "What needs my attention today?",
  "Show shipments with missing documents",
  "Summarize high-risk shipments",
  "Help me draft a follow-up email",
];

const FOLLOW_UP_CHIPS = ["Tell me more", "What are the risks?", "Draft a short email"];

const PLACEHOLDER_ROTATION = [
  "Ask me anything about your shipments…",
  "Try: “What’s delayed this week?”",
  "Try: “Which B/Ls are missing?”",
];

const IDLE_NUDGE = "Not sure where to start? Try: “What needs attention today?”";

const LINE_H = 24;
const MAX_LINES = 6;
const INPUT_MIN = 44;
const INPUT_MAX = 220;
const COMPOSER_H_KEY = "dala-inline-assistant-composer-h-v1";

function msgId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readStoredComposerH(): number {
  if (typeof window === "undefined") return 120;
  try {
    const v = parseInt(localStorage.getItem(COMPOSER_H_KEY) || "", 10);
    if (!Number.isFinite(v)) return 120;
    return Math.min(INPUT_MAX, Math.max(INPUT_MIN, v));
  } catch {
    return 120;
  }
}

function persistComposerH(px: number) {
  try {
    localStorage.setItem(COMPOSER_H_KEY, String(px));
  } catch {
    /* ignore */
  }
}

export function DalaAiAssistantPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handoff = searchParams.get("handoff") === "1";

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [idleNudge, setIdleNudge] = useState(false);
  const [inputAreaH, setInputAreaH] = useState(120);
  const [hydrated, setHydrated] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypeRef = useRef<number>(Date.now());
  const inputHRef = useRef(inputAreaH);
  const handoffDoneRef = useRef(false);

  useEffect(() => {
    inputHRef.current = inputAreaH;
  }, [inputAreaH]);

  useEffect(() => {
    setInputAreaH(readStoredComposerH());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !handoff || handoffDoneRef.current) return;
    handoffDoneRef.current = true;
    const pending = loadPendingHandoff();
    clearPendingHandoff();
    router.replace("/dashboard/dala-ai-assistant", { scroll: false });
    if (pending && pending.length > 0) {
      setMessages(pending);
    }
  }, [hydrated, handoff, router]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(internalApiUrl("/api/shipments"), { credentials: "include" });
        const data = (await res.json()) as { shipments?: Shipment[] };
        if (res.ok && Array.isArray(data.shipments)) setShipments(data.shipments);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const shipmentsByReference = useMemo(() => {
    const m = new Map<string, Shipment>();
    for (const s of shipments) {
      m.set(normalizeShipmentReference(s.reference), s);
    }
    return m;
  }, [shipments]);

  const navigateToShipment = useCallback(
    (id: string) => {
      const qs = new URLSearchParams();
      qs.set("id", id);
      qs.set("highlight", id);
      router.push(`/dashboard/shipments?${qs.toString()}`);
    },
    [router],
  );

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_ROTATION.length), 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const idle = Date.now() - lastTypeRef.current > 30_000;
      setIdleNudge(idle && !input.trim());
    }, 5000);
    return () => clearInterval(t);
  }, [input]);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useLayoutEffect(() => {
    scrollToEnd();
  }, [messages.length, busy, scrollToEnd]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxPx = MAX_LINES * LINE_H + 24;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, INPUT_MIN), maxPx)}px`;
  }, [input, messages.length]);

  async function sendText(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    lastTypeRef.current = Date.now();
    setIdleNudge(false);

    const priorMessages = [...messages];
    const userMsg: AssistantMessage = {
      id: msgId(),
      role: "user",
      content: q,
      time: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);
    const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch(internalApiUrl("/api/chat"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      const textOut =
        data.answer ||
        data.error ||
        (!res.ok ? `Request failed (${res.status}).` : "No response.");
      const assistantMsg: AssistantMessage = {
        id: msgId(),
        role: "assistant",
        content: textOut,
        time: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const assistantMsg: AssistantMessage = {
        id: msgId(),
        role: "assistant",
        content: "Could not reach the server.",
        time: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setBusy(false);
    }
  }

  const startResizeInput = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = inputHRef.current;
    const pid = e.pointerId;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(pid);

    function onMove(ev: PointerEvent) {
      const next = Math.min(INPUT_MAX, Math.max(INPUT_MIN, startH - (ev.clientY - startY)));
      inputHRef.current = next;
      setInputAreaH(next);
    }

    function onUp() {
      try {
        target.releasePointerCapture(pid);
      } catch {
        /* ignore */
      }
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      persistComposerH(inputHRef.current);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-[#64748b]">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e2e8f0] px-4 py-3 dark:border-slate-700">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-[#2563eb] text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-[#0f172a] dark:text-slate-100">Dala AI Assistant</p>
          <p className="text-[12px] text-[#64748b] dark:text-slate-400">Workspace chat — uses your shipment data</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="scroll-sleek min-h-0 flex-1 overflow-y-auto scroll-pb-6 [scrollbar-gutter:stable]">
          <div className="mx-auto w-full max-w-[760px] px-4 pb-6 pt-4">
            {messages.length === 0 && !busy && (
              <div className="flex min-h-[min(50vh,420px)] flex-col items-center justify-center px-2 text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-[#2563eb] text-white shadow-lg">
                  <Bot className="h-8 w-8" />
                </div>
                <h1 className="text-[22px] font-semibold tracking-tight text-[#0f172a] dark:text-slate-100">
                  Hi, I&apos;m Dala. How can I help you today?
                </h1>
                <div className="mt-8 flex max-w-xl flex-wrap justify-center gap-2">
                  {WELCOME_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setInput(chip)}
                      className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-left text-[14px] font-medium text-[#334155] shadow-sm transition hover:border-[#93c5fd] hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={m.id} className="group pb-1">
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="relative max-w-[min(100%,85%)] pb-5">
                        <div className="rounded-2xl rounded-br-md bg-[#2563eb] px-4 py-3 text-[15px] leading-relaxed text-white">
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                        <time
                          dateTime={m.time}
                          className="pointer-events-none absolute bottom-0 right-0 max-w-full truncate text-[11px] tabular-nums text-[#94a3b8] opacity-0 transition group-hover:opacity-100"
                        >
                          {new Date(m.time).toLocaleString()}
                        </time>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-[#2563eb] text-white shadow-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="relative pb-5">
                          <ChatMarkdown
                            content={m.content}
                            shipmentsByReference={shipmentsByReference}
                            onShipmentClick={navigateToShipment}
                          />
                          <time
                            dateTime={m.time}
                            className="pointer-events-none absolute bottom-0 left-0 max-w-full truncate text-[11px] tabular-nums text-[#94a3b8] opacity-0 transition group-hover:opacity-100"
                          >
                            {new Date(m.time).toLocaleString()}
                          </time>
                        </div>
                        {i === messages.length - 1 && !busy && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="w-full text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
                              What to try next
                            </span>
                            {FOLLOW_UP_CHIPS.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => setInput(chip)}
                                className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#475569] transition hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-[#2563eb] text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
                    <span className="inline-flex gap-1" aria-label="Typing">
                      {[0, 1, 2].map((j) => (
                        <span
                          key={j}
                          className="typing-dot inline-block h-2 w-2 rounded-full bg-[#64748b]"
                          style={{ animationDelay: `${j * 0.12}s` }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#e2e8f0] bg-[#f8fafc] dark:border-slate-700 dark:bg-slate-950">
          <div className="mx-auto w-full max-w-[760px] px-4 py-3">
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize composer"
              onPointerDown={startResizeInput}
              className="relative mx-auto mb-2 flex h-11 w-full max-w-[140px] cursor-ns-resize touch-none items-center justify-center rounded-lg hover:bg-[#2563eb]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              <span className="pointer-events-none h-2 w-14 rounded-full bg-[#cbd5e1] dark:bg-slate-600" />
            </div>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void sendText(input);
              }}
            >
              <div className="flex min-h-0 items-end gap-2" style={{ minHeight: inputAreaH }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    lastTypeRef.current = Date.now();
                    setIdleNudge(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendText(input);
                    }
                  }}
                  placeholder={idleNudge ? IDLE_NUDGE : PLACEHOLDER_ROTATION[placeholderIdx]}
                  rows={1}
                  className="min-h-[44px] min-w-0 flex-1 resize-none rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.15)] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  style={{ maxHeight: MAX_LINES * LINE_H + 24 }}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="mb-0.5 flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center self-end rounded-xl bg-[#2563eb] text-white transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
