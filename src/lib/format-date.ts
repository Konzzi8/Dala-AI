/**
 * Parse shipment ETA strings without UTC shifting date-only ISO values (YYYY-MM-DD).
 */
export function parseEtaDate(value: string): Date | null {
  const t = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }
  const dt = new Date(t);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

/** Long ETA for chat UI (e.g. Apr 10, 2026). */
export function formatEtaChatLong(eta: string | null | undefined): string {
  if (!eta?.trim()) return "—";
  const d = parseEtaDate(eta);
  if (!d) return eta.trim();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Dashboard header: date line (e.g. Tue, Apr 7). */
export function formatDashboardHeaderDateLine(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Dashboard header: time line (e.g. 3:21 PM). */
export function formatDashboardHeaderTimeLine(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Display ETA as day/month/year (e.g. 08/04/2026). */
export function formatEtaDisplay(eta: string | null | undefined): string {
  if (!eta?.trim()) return "—";
  const d = parseEtaDate(eta);
  if (!d) return eta.trim();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
