"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Copy,
  ExternalLink,
  GripHorizontal,
  Loader2,
  MessageCircle,
  Minimize2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CHAT_INPUT_DEFAULT_H,
  CHAT_INPUT_H_KEY,
  CHAT_INPUT_MAX_H,
  CHAT_INPUT_MIN_H,
  CHAT_WIDGET_DEFAULT_H,
  CHAT_WIDGET_DEFAULT_W,
  CHAT_WIDGET_H_KEY,
  CHAT_WIDGET_W_KEY,
  clampInputHeight,
  clampWidgetSize,
} from "./chat-dock-layout";
import { ChatAssistantMessage } from "./chat-assistant-message";
import { savePendingHandoff } from "@/lib/assistant-storage";
import { useChatContext } from "./chat-context";

const FAB = 56;
const EDGE = 20;
const GAP = 12;
/** Distance from viewport bottom to panel bottom edge (above FAB + gap). */
const STACK_BOTTOM = EDGE + FAB + GAP;

function initialsFromProfile(data: {
  firstName: string;
  fullName: string | null;
  email: string;
}): string {
  const full = data.fullName?.trim();
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  const local = data.email.split("@")[0] || "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  const fn = data.firstName.trim();
  if (fn.length >= 2) return fn.slice(0, 2).toUpperCase();
  return fn.slice(0, 1).toUpperCase() || "U";
}

function readStoredSize(): { w: number; h: number } {
  if (typeof window === "undefined") return { w: CHAT_WIDGET_DEFAULT_W, h: CHAT_WIDGET_DEFAULT_H };
  try {
    const w = parseInt(localStorage.getItem(CHAT_WIDGET_W_KEY) || "", 10);
    const h = parseInt(localStorage.getItem(CHAT_WIDGET_H_KEY) || "", 10);
    return clampWidgetSize(
      Number.isFinite(w) ? w : CHAT_WIDGET_DEFAULT_W,
      Number.isFinite(h) ? h : CHAT_WIDGET_DEFAULT_H,
    );
  } catch {
    return { w: CHAT_WIDGET_DEFAULT_W, h: CHAT_WIDGET_DEFAULT_H };
  }
}

function readStoredInputH(): number {
  if (typeof window === "undefined") return CHAT_INPUT_DEFAULT_H;
  try {
    const v = parseInt(localStorage.getItem(CHAT_INPUT_H_KEY) || "", 10);
    return Number.isFinite(v) ? clampInputHeight(v) : CHAT_INPUT_DEFAULT_H;
  } catch {
    return CHAT_INPUT_DEFAULT_H;
  }
}

const SUGGESTED = [
  "What needs my attention today?",
  "Show me all delayed shipments",
  "What documents are missing?",
  "Summarize high risk shipments",
];

export function FloatingChat() {
  const {
    open,
    setOpen,
    messages,
    busy,
    sendMessage,
    clearChat,
    shipmentsByReference,
    refreshShipments,
    setLayoutReserve,
  } = useChatContext();
  const [input, setInput] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [{ w: panelW, h: panelH }, setSize] = useState(readStoredSize);
  const [inputH, setInputH] = useState(readStoredInputH);
  const [minimized, setMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(open);
  const dragSizeRef = useRef({ w: panelW, h: panelH });
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportH, setViewportH] = useState(800);

  useEffect(() => {
    dragSizeRef.current = { w: panelW, h: panelH };
  }, [panelW, panelH]);

  useEffect(() => {
    function onVh() {
      setViewportH(window.innerHeight);
    }
    onVh();
    window.addEventListener("resize", onVh);
    return () => window.removeEventListener("resize", onVh);
  }, []);

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const mob = window.matchMedia("(max-width: 767px)");
    function sync() {
      setIsDesktop(md.matches);
      setIsMobile(mob.matches);
    }
    sync();
    md.addEventListener("change", sync);
    mob.addEventListener("change", sync);
    return () => {
      md.removeEventListener("change", sync);
      mob.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setMinimized(false);
    }
    prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    function onWinResize() {
      setSize((s) => clampWidgetSize(s.w, s.h));
    }
    window.addEventListener("resize", onWinResize);
    return () => window.removeEventListener("resize", onWinResize);
  }, []);

  useLayoutEffect(() => {
    const mobileNavPad = isMobile ? 72 : 0;
    if (!open) {
      setLayoutReserve({ reserveRightPx: 0, reserveBottomPx: 0 });
      return;
    }
    if (minimized) {
      setLayoutReserve({
        reserveRightPx: Math.min(panelW, 400) + EDGE + 24,
        reserveBottomPx: STACK_BOTTOM + FAB + mobileNavPad,
      });
      return;
    }
    setLayoutReserve({
      reserveRightPx: panelW + EDGE + 24,
      reserveBottomPx: STACK_BOTTOM + panelH + mobileNavPad + 8,
    });
  }, [open, minimized, panelW, panelH, isMobile, setLayoutReserve]);

  useEffect(() => {
    return () => setLayoutReserve({ reserveRightPx: 0, reserveBottomPx: 0 });
  }, [setLayoutReserve]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          firstName?: string;
          fullName?: string | null;
          email?: string;
        };
        setUserInitials(
          initialsFromProfile({
            firstName: data.firstName ?? "",
            fullName: data.fullName ?? null,
            email: data.email ?? "",
          }),
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, busy, scrollToEnd]);

  function persistSize(nw: number, nh: number) {
    try {
      localStorage.setItem(CHAT_WIDGET_W_KEY, String(nw));
      localStorage.setItem(CHAT_WIDGET_H_KEY, String(nh));
    } catch {
      /* ignore */
    }
  }

  function persistInputH(px: number) {
    try {
      localStorage.setItem(CHAT_INPUT_H_KEY, String(px));
    } catch {
      /* ignore */
    }
  }

  const startResize = useCallback(
    (edge: "n" | "e" | "w" | "nw", e: React.PointerEvent) => {
      if (minimized || (isMobile && edge !== "n")) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = panelW;
      const startH = panelH;
      const pid = e.pointerId;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(pid);

      function onMove(ev: PointerEvent) {
        let nw = startW;
        let nh = startH;
        if (edge === "n" || edge === "nw") {
          nh = startH - (ev.clientY - startY);
        }
        if (edge === "w" || edge === "nw") {
          nw = startW + (startX - ev.clientX);
        }
        if (edge === "e") {
          nw = startW + (ev.clientX - startX);
        }
        const next = clampWidgetSize(nw, nh);
        dragSizeRef.current = next;
        setSize(next);
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
        const { w: w0, h: h0 } = dragSizeRef.current;
        persistSize(w0, h0);
      }

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [isMobile, minimized, panelH, panelW],
  );

  const inputHRef = useRef(inputH);
  useEffect(() => {
    inputHRef.current = inputH;
  }, [inputH]);

  const startResizeInputTop = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startIn = inputHRef.current;
    const pid = e.pointerId;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(pid);

    function onMove(ev: PointerEvent) {
      const next = clampInputHeight(startIn - (ev.clientY - startY));
      inputHRef.current = next;
      setInputH(next);
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
      persistInputH(inputHRef.current);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }, []);

  async function onSubmit(text: string) {
    await sendMessage(text);
  }

  function openAssistantInNewTab() {
    savePendingHandoff(messages.map((m) => ({ ...m })));
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    window.open(`${origin}/assistant?handoff=1`, "_blank", "noopener,noreferrer");
  }

  function closeChat() {
    setOpen(false);
    setMinimized(false);
  }

  const showFab = !open;
  const showPanel = open && !minimized;
  const showMinBar = open && minimized;

  const panelStyle: React.CSSProperties = isMobile
    ? {
        width: "min(calc(100vw - 32px), 100%)",
        height: Math.min(panelH, viewportH * 0.85),
        right: EDGE,
        bottom: STACK_BOTTOM,
      }
    : {
        width: panelW,
        height: panelH,
        right: EDGE,
        bottom: STACK_BOTTOM,
      };

  return (
    <>
      {showFab && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-5 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/30 transition duration-150 ease-out hover:scale-[0.98] hover:bg-[#1d4ed8] md:bottom-5 md:right-5"
          aria-label="Open Dala AI Assistant"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}

      <AnimatePresence>
        {showPanel && (
          <motion.div
            key="chat-panel"
            role="dialog"
            aria-label="Dala AI Assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={panelStyle}
            className="fixed z-[45] flex flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_12px_48px_rgba(15,23,42,0.18)] dark:border-slate-600 dark:bg-slate-900"
          >
            {/* FIXED: taller north-edge hit target (~12px) for easier grab without layout flicker */}
            <div
              role="presentation"
              onPointerDown={(e) => startResize("n", e)}
              className="absolute left-2 right-2 top-0 z-[2] h-3 cursor-ns-resize touch-none hover:bg-[#2563eb]/10 md:block"
            />
            {/* west */}
            <div
              role="presentation"
              onPointerDown={(e) => startResize("w", e)}
              className="absolute bottom-3 left-0 top-3 z-[2] hidden w-2 cursor-ew-resize touch-none hover:bg-[#2563eb]/10 md:block"
            />
            {/* east */}
            <div
              role="presentation"
              onPointerDown={(e) => startResize("e", e)}
              className="absolute bottom-3 right-0 top-3 z-[2] hidden w-2 cursor-ew-resize touch-none hover:bg-[#2563eb]/10 md:block"
            />
            {/* NW corner (top-left) */}
            <div
              role="presentation"
              onPointerDown={(e) => startResize("nw", e)}
              className="absolute left-0 top-0 z-[3] hidden h-4 w-4 cursor-nwse-resize touch-none md:block"
            />
            {/* Bottom-left grip (subtle) */}
            <div
              role="presentation"
              onPointerDown={(e) => startResize("nw", e)}
              className="absolute bottom-1 left-1 z-[3] hidden h-7 w-7 cursor-nwse-resize items-end justify-start rounded-md text-[#94a3b8] opacity-70 hover:bg-slate-100 hover:opacity-100 dark:hover:bg-slate-800 md:flex"
              title="Resize"
            >
              <GripHorizontal className="h-4 w-4 rotate-45" aria-hidden />
            </div>

            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#e8ecf1] bg-[#0f172a] px-4 text-white dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-[#2563eb] text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold leading-tight">Dala AI</p>
                  <p className="truncate text-[11px] text-[#94a3b8]">Freight assistant</p>
                </div>
              </div>
              <div className="flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={openAssistantInNewTab}
                  className="inline-flex max-w-[min(100%,11rem)] items-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium text-[#94a3b8] transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 sm:px-2 sm:text-[12px]"
                  title="Open assistant in full screen"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                  <span className="truncate">Open in New Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="rounded-lg p-2 text-[#94a3b8] transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                  title="Minimize"
                  aria-label="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={clearChat}
                  className="rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#94a3b8] transition hover:bg-white/10 hover:text-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={closeChat}
                  className="rounded-lg p-2 text-[#94a3b8] transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-[#f8fafc] dark:bg-slate-950">
              <div className="shrink-0 border-b border-[#e2e8f0] bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Quick actions</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void onSubmit(s)}
                      className="rounded-full bg-[#f1f5f9] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#0f172a] transition hover:bg-[#e2e8f0] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="scroll-sleek min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
                {messages.length === 0 && (
                  <div className="flex gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 text-[13px] leading-[1.55] text-[#475569] dark:border-slate-600 dark:bg-slate-900">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2563eb]">
                      <Bot className="h-4 w-4" />
                    </div>
                    <p>
                      Ask about shipments, documents, or risks. Data comes from your workspace. Drag window edges or
                      the corner grip to resize. Drag the bar above the input to resize the composer.
                    </p>
                  </div>
                )}
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end gap-2">
                      <div className="group/user relative max-w-[min(100%,92%)] rounded-2xl rounded-br-md bg-[#2563eb] px-3.5 py-2.5 pb-7 text-[14px] leading-[1.5] text-white shadow-sm">
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <time
                          className="absolute bottom-1.5 right-3 text-[10px] tabular-nums text-blue-100/85"
                          dateTime={m.time}
                        >
                          {new Date(m.time).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                        <button
                          type="button"
                          title="Copy"
                          onClick={() => void navigator.clipboard.writeText(m.content)}
                          className="absolute bottom-1.5 left-3 rounded p-0.5 text-blue-100/70 opacity-0 hover:bg-white/10 group-hover/user:opacity-100"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#334155] text-[11px] font-semibold text-white dark:bg-slate-600"
                        aria-hidden
                      >
                        {userInitials}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-2">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-[#2563eb] text-white shadow-sm">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <ChatAssistantMessage
                          message={m}
                          shipmentsByReference={shipmentsByReference}
                          onRefreshShipments={refreshShipments}
                          onQuickReply={(text) => void sendMessage(text)}
                        />
                      </div>
                    </div>
                  ),
                )}
                {busy && (
                  <div className="flex gap-2">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-[#2563eb] text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md border border-[#e2e8f0] bg-white px-3.5 py-3 shadow-sm dark:border-slate-600 dark:bg-slate-800">
                      <span className="inline-flex gap-1" aria-label="Typing">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="typing-dot inline-block h-2 w-2 rounded-full bg-[#64748b]"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Resizable input: drag top edge */}
              <div className="shrink-0 border-t border-[#e2e8f0] bg-white dark:border-slate-700 dark:bg-slate-900">
                {/* FIXED: 44px-tall hit area for composer resize; visual bar stays compact */}
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  aria-label="Resize composer height"
                  onPointerDown={startResizeInputTop}
                  className="relative mx-auto flex h-11 w-full max-w-[140px] cursor-ns-resize touch-none items-center justify-center rounded-lg hover:bg-[#2563eb]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                >
                  <span className="pointer-events-none h-2 w-16 rounded-full bg-[#cbd5e1] dark:bg-slate-600" />
                </div>
                <form
                  className="flex gap-2 px-3 pb-3 pt-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = input.trim();
                    if (!t || busy) return;
                    setInput("");
                    void onSubmit(t);
                  }}
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const t = input.trim();
                        if (!t || busy) return;
                        setInput("");
                        void onSubmit(t);
                      }
                    }}
                    placeholder="Message… (Shift+Enter for new line)"
                    rows={2}
                    style={{ height: inputH, minHeight: CHAT_INPUT_MIN_H, maxHeight: CHAT_INPUT_MAX_H }}
                    className="min-h-0 w-full resize-none rounded-xl border border-[#d1d5db] bg-[#f8fafc] px-3 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.15)] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="mt-0.5 flex h-10 w-10 shrink-0 self-start items-center justify-center rounded-xl bg-[#2563eb] text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMinBar && (
          <motion.div
            key="chat-min"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-[45] flex h-12 max-w-[calc(100vw-2rem)] items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 shadow-xl dark:border-slate-600 dark:bg-slate-900 md:bottom-5 md:right-5 md:max-w-md"
            style={{ width: isDesktop ? Math.min(panelW, 420) : undefined }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-sky-500" />
              <span className="truncate text-[13px] font-semibold text-[#0f172a] dark:text-slate-100">Dala AI</span>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="rounded-lg bg-[#2563eb] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Expand
              </button>
              <button type="button" onClick={closeChat} className="rounded-lg p-1.5 text-[#64748b] hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
