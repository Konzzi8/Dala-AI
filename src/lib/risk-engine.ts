import type { RiskFlag, Shipment } from "./types";

const daysBetween = (a: Date, b: Date) =>
  Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

function parseDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeRisks(shipment: Shipment, now = new Date()): RiskFlag[] {
  const flags: RiskFlag[] = [];

  const eta = parseDate(shipment.eta);
  if (eta) {
    const d = daysBetween(eta, now);
    if (d <= 1 && d >= 0) {
      flags.push({
        id: `${shipment.id}-eta-urgent`,
        level: "high",
        code: "ETA_IMMINENT",
        message: `ETA within 24h (${eta.toDateString()})`,
      });
    } else if (d <= 3 && d >= 0) {
      flags.push({
        id: `${shipment.id}-eta-soon`,
        level: "medium",
        code: "ETA_APPROACHING",
        message: `ETA within 3 days (${eta.toDateString()})`,
      });
    }
  }

  const fte = parseDate(shipment.freeTimeEnd);
  if (fte) {
    const d = daysBetween(fte, now);
    if (d <= 2 && d >= 0) {
      flags.push({
        id: `${shipment.id}-freetime`,
        level: "high",
        code: "FREE_TIME_CRITICAL",
        message: `Free time ends soon (${fte.toDateString()}) — demurrage/detention risk`,
      });
    } else if (d <= 5 && d >= 0) {
      flags.push({
        id: `${shipment.id}-freetime-warn`,
        level: "medium",
        code: "FREE_TIME_APPROACHING",
        message: `Free time ending within 5 days (${fte.toDateString()})`,
      });
    }
  }

  const missingDocs = shipment.documents.filter((d) => !d.received);
  for (const doc of missingDocs) {
    flags.push({
      id: `${shipment.id}-doc-${doc.name}`,
      level: doc.name.toLowerCase().includes("b/l") ? "high" : "medium",
      code: "MISSING_DOCUMENT",
      message: `Missing document: ${doc.name}`,
    });
  }

  const pendingApprovals = shipment.approvals.filter((a) => !a.received);
  for (const a of pendingApprovals) {
    flags.push({
      id: `${shipment.id}-appr-${a.type}`,
      level: "medium",
      code: "PENDING_APPROVAL",
      message: `Pending approval: ${a.type}`,
    });
  }

  if (shipment.customsStatus === "held") {
    flags.push({
      id: `${shipment.id}-customs`,
      level: "high",
      code: "CUSTOMS_HELD",
      message: "Customs hold — shipment may stall",
    });
  }

  if (shipment.rateConfirmed === false) {
    flags.push({
      id: `${shipment.id}-rate`,
      level: "medium",
      code: "RATE_UNCONFIRMED",
      message: "Rate / quotation not confirmed with client",
    });
  }

  if (!shipment.blNumber && shipment.containerNumbers.length > 0) {
    flags.push({
      id: `${shipment.id}-nobl`,
      level: "medium",
      code: "BL_UNKNOWN",
      message: "B/L number not on file",
    });
  }

  if (flags.length === 0) {
    flags.push({
      id: `${shipment.id}-ok`,
      level: "low",
      code: "NO_BLOCKERS",
      message: "No automatic risk flags — review as needed",
    });
  }

  return flags;
}

/**
 * Priority index 0–100: higher = more urgent. Based on stacked risk flags.
 * High-severity issues move the needle fastest; multiple issues add up (capped at 100).
 */
export function priorityScore(flags: RiskFlag[]): number {
  let sum = 0;
  for (const f of flags) {
    if (f.code === "NO_BLOCKERS") {
      sum += 12;
      continue;
    }
    if (f.level === "high") sum += 38;
    else if (f.level === "medium") sum += 16;
    else sum += 4;
  }
  return Math.min(100, Math.round(sum));
}

export function applyRisksToShipment(s: Shipment, now = new Date()): Shipment {
  const risks = computeRisks(s, now);
  const score = priorityScore(risks);
  return { ...s, risks, priorityScore: score };
}
