import type { Shipment } from "@/lib/types";

export type ActivityItem = {
  id: string;
  type: "email" | "shipment" | "document" | "eta";
  message: string;
  time: string;
};

const DOC_NAMES = [
  "Bill of Lading",
  "Commercial Invoice",
  "Packing List",
  "Customs Declaration",
  "Certificate of Origin",
];

export function ensureDocumentSlots(s: Shipment): { name: string; received: boolean }[] {
  const existing = new Map(s.documents.map((d) => [d.name, d.received]));
  for (const name of DOC_NAMES) {
    if (!existing.has(name)) existing.set(name, false);
  }
  return DOC_NAMES.map((name) => ({ name, received: Boolean(existing.get(name)) }));
}

export function completionPct(s: Shipment): number {
  const slots = ensureDocumentSlots(s);
  const ok = slots.filter((d) => d.received).length;
  return Math.round((ok / slots.length) * 100);
}

export function countArrivingThisWeek(shipments: Shipment[]): number {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  return shipments.filter((s) => {
    if (!s.eta) return false;
    const t = new Date(s.eta).getTime();
    return Number.isFinite(t) && t >= now && t <= now + week;
  }).length;
}

export function countPendingReviewEmails(shipments: Shipment[]): number {
  return shipments.filter((s) => s.emails.length > 0).length;
}

export function buildActivityFeed(shipments: Shipment[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const s of shipments.slice(0, 20)) {
    const em = s.emails[0];
    if (em) {
      items.push({
        id: `a-${s.id}-e`,
        type: "email",
        message: `Email — ${em.subject.slice(0, 60)}${em.subject.length > 60 ? "…" : ""} · ${s.reference}`,
        time: em.receivedAt,
      });
    }
    const high = s.risks.find((r) => r.level === "high");
    if (high) {
      items.push({
        id: `a-${s.id}-r`,
        type: "eta",
        message: `${high.message} — ${s.reference}`,
        time: s.updatedAt,
      });
    }
    const missing = s.documents.filter((d) => !d.received);
    if (missing.length) {
      items.push({
        id: `a-${s.id}-d`,
        type: "document",
        message: `Document missing (${missing[0].name}) — ${s.reference}`,
        time: s.updatedAt,
      });
    }
  }
  return items
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 12);
}

/** Rough lat/lng → % positions on a simple equirectangular map (0–100). */
export function routeToMapPoints(
  origin?: string,
  destination?: string,
): { ox: number; oy: number; dx: number; dy: number } | null {
  const o = cityToCoord(origin);
  const d = cityToCoord(destination);
  if (!o || !d) return null;
  return { ox: o.x, oy: o.y, dx: d.x, dy: d.y };
}

function cityToCoord(label?: string): { x: number; y: number } | null {
  if (!label) return null;
  const l = label.toLowerCase();
  const cities: [string, number, number][] = [
    ["shanghai", 84, 38],
    ["los angeles", 12, 35],
    ["la ", 12, 35],
    ["new york", 22, 32],
    ["nyc", 22, 32],
    ["rotterdam", 48, 28],
    ["hamburg", 49, 27],
    ["busan", 86, 36],
    ["seattle", 11, 28],
    ["singapore", 78, 55],
    ["dubai", 62, 42],
    ["miami", 18, 38],
    ["savannah", 17, 35],
    ["felixstowe", 45, 26],
    ["antwerp", 47, 28],
  ];
  for (const [key, x, y] of cities) {
    if (l.includes(key)) return { x, y };
  }
  const h = simpleHash(l);
  return { x: 15 + (h % 70), y: 25 + ((h >> 3) % 30) };
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function riskTone(level: string): "high" | "medium" | "low" {
  if (level === "high" || level === "medium" || level === "low") return level;
  return "low";
}

export function deltaVsYesterdayLabel(): string {
  return "vs yesterday";
}
