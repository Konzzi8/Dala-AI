export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
};

export type AssistantConversation = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  updatedAt: string;
};

const STORAGE_KEY = "dala-assistant-conversations-v1";
const ACTIVE_KEY = "dala-assistant-active-id";
const SIDEBAR_KEY = "dala-assistant-sidebar-collapsed";
/** Cross-tab handoff when opening the assistant from the floating widget (redirects to `/dashboard/dala-ai-assistant`). */
export const PENDING_HANDOFF_KEY = "dala-assistant-pending-handoff-v1";

export function savePendingHandoff(messages: AssistantMessage[]): void {
  try {
    localStorage.setItem(PENDING_HANDOFF_KEY, JSON.stringify({ messages, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function loadPendingHandoff(): AssistantMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { messages?: AssistantMessage[] };
    return Array.isArray(parsed.messages) ? parsed.messages : null;
  } catch {
    return null;
  }
}

export function clearPendingHandoff(): void {
  try {
    localStorage.removeItem(PENDING_HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}

function genId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadConversations(): AssistantConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(list: AssistantConversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function titleFromMessages(messages: AssistantMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const line = firstUser?.content?.trim() || "New chat";
  return line.length > 48 ? `${line.slice(0, 45)}…` : line;
}

export function createConversation(): AssistantConversation {
  const now = new Date().toISOString();
  return {
    id: genId(),
    title: "New chat",
    messages: [],
    updatedAt: now,
  };
}

export function groupConversationsByDate(
  list: AssistantConversation[],
): { label: string; items: AssistantConversation[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const weekAgo = startOfToday - 7 * 86400000;

  const sorted = [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const today: AssistantConversation[] = [];
  const yesterday: AssistantConversation[] = [];
  const week: AssistantConversation[] = [];
  const older: AssistantConversation[] = [];

  for (const c of sorted) {
    const t = new Date(c.updatedAt).getTime();
    if (t >= startOfToday) today.push(c);
    else if (t >= startOfYesterday) yesterday.push(c);
    else if (t >= weekAgo) week.push(c);
    else older.push(c);
  }

  const out: { label: string; items: AssistantConversation[] }[] = [];
  if (today.length) out.push({ label: "Today", items: today });
  if (yesterday.length) out.push({ label: "Yesterday", items: yesterday });
  if (week.length) out.push({ label: "Last 7 days", items: week });
  if (older.length) out.push({ label: "Older", items: older });
  return out;
}
