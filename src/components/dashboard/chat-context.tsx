"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { internalApiUrl } from "@/lib/api-urls";
import { normalizeShipmentReference } from "@/lib/shipment-reference";
import type { Shipment } from "@/lib/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
};

/** Extra padding on the dashboard shell so the floating widget does not cover content. */
export type ChatLayoutReserve = {
  reserveRightPx: number;
  reserveBottomPx: number;
};

type ChatContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  messages: ChatMessage[];
  busy: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  shipments: Shipment[];
  shipmentsByReference: Map<string, Shipment>;
  refreshShipments: () => Promise<void>;
  layoutReserve: ChatLayoutReserve;
  setLayoutReserve: (r: ChatLayoutReserve) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [layoutReserve, setLayoutReserve] = useState<ChatLayoutReserve>({
    reserveRightPx: 0,
    reserveBottomPx: 0,
  });

  const refreshShipments = useCallback(async () => {
    try {
      const res = await fetch(internalApiUrl("/api/shipments"), { credentials: "include" });
      const data = (await res.json()) as { shipments?: Shipment[] };
      if (res.ok && Array.isArray(data.shipments)) setShipments(data.shipments);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshShipments();
  }, [refreshShipments]);

  const shipmentsByReference = useMemo(() => {
    const m = new Map<string, Shipment>();
    for (const s of shipments) {
      m.set(normalizeShipmentReference(s.reference), s);
    }
    return m;
  }, [shipments]);

  const sendMessage = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      const priorHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: q,
        time: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      setBusy(true);
      try {
        const res = await fetch(internalApiUrl("/api/chat"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: q, history: priorHistory }),
        });
        const data = (await res.json()) as { answer?: string; error?: string };
        const textOut =
          data.answer ||
          data.error ||
          (!res.ok ? `Request failed (${res.status}).` : "No response.");
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: textOut,
            time: new Date().toISOString(),
          },
        ]);
        void refreshShipments();
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: "Could not reach the server.",
            time: new Date().toISOString(),
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, refreshShipments],
  );

  const clearChat = useCallback(() => setMessages([]), []);

  const value = useMemo<ChatContextValue>(
    () => ({
      open,
      setOpen,
      messages,
      busy,
      sendMessage,
      clearChat,
      shipments,
      shipmentsByReference,
      refreshShipments,
      layoutReserve,
      setLayoutReserve,
    }),
    [
      open,
      messages,
      busy,
      sendMessage,
      clearChat,
      shipments,
      shipmentsByReference,
      refreshShipments,
      layoutReserve,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
