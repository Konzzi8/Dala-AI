import { coerceToIsoDate } from "@/lib/date-coerce";
import type { ParsedEmailExtraction } from "./types";

/** Standard container: 4 letters + 7 digits (ISO 6346). Case-insensitive. */
const CONTAINER_RE = /\b([A-Z]{4}\d{7})\b/gi;
/** B/L with optional words like "reference" between label and number */
const BL_RE =
  /\b(?:B\/L|BL|Bill of Lading)(?:\s+reference)?[:\s#-]*([A-Z0-9][A-Z0-9\-]{4,})\b/gi;
const REF_BOOKING_RE = /\b(FF-\d{4}-\d{4})\b/i;
const REF_RE = /\b(?:shipment|booking|ref|file)[:\s#]*([A-Z0-9\-]{4,})\b/gi;

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/** First calendar date (ISO, US, or month name) in the text after a keyword. */
function firstDateAfterKeyword(text: string, keywordPattern: RegExp): string | undefined {
  const re = new RegExp(keywordPattern.source + "([\\s\\S]{0,220})", "i");
  const m = re.exec(text);
  if (!m?.[1]) return undefined;
  return coerceToIsoDate(m[1]);
}

/**
 * True when the email indicates the ETA was changed / superseded
 * (prefer the date from heuristic extraction when present).
 */
export function emailSuggestsRevisedEta(text: string): boolean {
  const t = text;
  return (
    /\b(?:revised|updated|new)\s+ETA\b/i.test(t) ||
    /\bETA\s+(?:revised|updated|changed|moved|pushed|rolled)\b/i.test(t) ||
    /\bchange\s+(?:of\s+)?ETA\b|\bchanged\s+ETA\b|\bETA\s+change\b/i.test(t) ||
    /\bETA\s+(?:has\s+been|was)\s+changed\b|\b(?:the\s+)?ETA\s+has\s+changed\b/i.test(t) ||
    /\badjustment\s+(?:to|of)\s+ETA\b|\bETA\s+adjustment\b/i.test(t) ||
    /\bETA\s+now\b|\bnew\s+arrival\s+(?:date|time)\b/i.test(t) ||
    /\b(?:previous|original)\s+ETA[^.\n]{0,80}?(?:new|updated|revised)\b/i.test(t)
  );
}

/**
 * Prefer a *revised* / *updated* ETA when the email says so; otherwise use the first ETA-like date found.
 */
function extractEta(text: string): string | undefined {
  const revisedPatterns = [
    /\b(?:revised|updated|new)\s+ETA([\s\S]{0,180})/i,
    /\bETA\s+(?:revised|updated|changed)\s+(?:to|as|is)([\s\S]{0,120})/i,
    /\bETA\s+(?:revised|updated)([\s\S]{0,140})/i,
    /\bchanged\s+ETA([\s\S]{0,160})/i,
    /\bETA\s+(?:has\s+been|was)\s+changed([\s\S]{0,160})/i,
    /\bchange\s+(?:of\s+)?ETA([\s\S]{0,180})/i,
    /\bETA\s+(?:moved|pushed|rolled)\s+to([\s\S]{0,120})/i,
    /\bETA\s+now([\s\S]{0,120})/i,
    /\b(?:revised|updated)\s+arrival([\s\S]{0,160})/i,
    /\badjustment\s+(?:to\s+)?(?:ETA|arrival)([\s\S]{0,140})/i,
  ];
  for (const p of revisedPatterns) {
    const m = new RegExp(p.source, p.flags).exec(text);
    if (m?.[1]) {
      const d = coerceToIsoDate(m[1]);
      if (d) return d;
    }
  }

  let eta: string | undefined =
    firstDateAfterKeyword(text, /\b(?:ETA|estimated arrival|arrival at port)\b/) ||
    firstDateAfterKeyword(text, /\bestimated time of arrival\b/);
  if (!eta) {
    const seg = /\b(?:ETA|arrival|arriving)\b([\s\S]{0,200})/i.exec(text);
    if (seg?.[1]) eta = coerceToIsoDate(seg[1]);
  }
  if (!eta) {
    const line = /\bETA\b[^\n]{0,220}/i.exec(text);
    if (line) eta = coerceToIsoDate(line[0]);
  }
  return eta;
}

function extractOriginDestination(text: string): { origin?: string; destination?: string } {
  const t = text.replace(/\s+/g, " ");

  const fromTo = /\bfrom\s+([^.\n,]{2,40}?)\s+to\s+([^.\n,]{2,40}?)(?:\.|,|\n|$)/i.exec(t);
  if (fromTo) {
    return { origin: fromTo[1].trim(), destination: fromTo[2].trim() };
  }

  const polPod =
    /(?:POL|port of loading)[:\s]+([^.\n,]{2,40}?)(?:\s+[-–]\s+|\s+)(?:POD|port of discharge|destination)[:\s]+([^.\n,]{2,40})/i.exec(
      t,
    );
  if (polPod) {
    return { origin: polPod[1].trim(), destination: polPod[2].trim() };
  }

  const od = /origin[:\s]+([^.\n,]{2,40}?)(?:\s+[-–]\s+|\s+)(?:destination|dest)[:\s]+([^.\n,]{2,40})/i.exec(
    t,
  );
  if (od) {
    return { origin: od[1].trim(), destination: od[2].trim() };
  }

  const etaRoute =
    /\bETA\s+([A-Za-z][A-Za-z\s]{2,35}?)\s+(\d{4}-\d{2}-\d{2})\b/i.exec(t);
  if (etaRoute) {
    return { destination: etaRoute[1].trim() };
  }

  return {};
}

export function heuristicParseEmail(body: string, subject: string): ParsedEmailExtraction {
  const text = `${subject}\n${body}`;
  const containers = uniq(
    [...text.matchAll(CONTAINER_RE)].map((m) => m[1].toUpperCase()),
  );

  let blNumber: string | undefined;
  BL_RE.lastIndex = 0;
  const blMatch = BL_RE.exec(text);
  if (blMatch) blNumber = blMatch[1].toUpperCase();

  const eta = extractEta(text);

  let freeTimeEnd: string | undefined =
    firstDateAfterKeyword(text, /\b(?:LFD|last free day|last free)\b/) ||
    firstDateAfterKeyword(text, /\b(?:free time|last free time|demurrage|detention)\b/);
  if (!freeTimeEnd) {
    const seg = /\b(?:LFD|free time|last free)\b([\s\S]{0,200})/i.exec(text);
    if (seg?.[1]) freeTimeEnd = coerceToIsoDate(seg[1]);
  }

  let reference: string | undefined;
  const bookingRef = REF_BOOKING_RE.exec(text);
  if (bookingRef) reference = bookingRef[1].toUpperCase();
  if (!reference) {
    const refMatch = REF_RE.exec(text);
    if (refMatch) reference = refMatch[1].toUpperCase();
  }

  const { origin, destination } = extractOriginDestination(text);

  const lower = text.toLowerCase();
  const documents: { name: string; received: boolean }[] = [];
  if (/\bb\/l\b|bill of lading/.test(lower)) {
    documents.push({
      name: "Bill of Lading",
      received: /received|attached|enclosed|please find/.test(lower),
    });
  }
  if (/commercial invoice|packing list|p\/l/.test(lower)) {
    documents.push({
      name: "Commercial docs",
      received: /attached|enclosed|received/.test(lower),
    });
  }
  if (documents.length === 0) {
    documents.push({ name: "Bill of Lading", received: false });
  }

  const approvals: { type: string; received: boolean }[] = [];
  if (/approval|approve|confirm/.test(lower)) {
    approvals.push({
      type: "Client instruction / approval",
      received: /approved|confirmed|ok to proceed|green light/.test(lower),
    });
  }

  let customsStatus: ParsedEmailExtraction["customsStatus"] = "unknown";
  if (/customs cleared|cleared customs/.test(lower)) customsStatus = "cleared";
  else if (/customs hold|held at customs|exam hold/.test(lower)) customsStatus = "held";
  else if (/pending customs|awaiting clearance/.test(lower)) customsStatus = "pending";

  const rateConfirmed =
    /rate confirmed|confirmed rate|accepted quote|agreed rate/.test(lower) ? true : undefined;

  return {
    reference,
    containerNumbers: containers.length ? containers : undefined,
    blNumber,
    eta,
    freeTimeEnd,
    clientName: undefined,
    origin,
    destination,
    documents,
    approvals: approvals.length ? approvals : undefined,
    customsStatus,
    rateConfirmed,
    notes: subject.slice(0, 120),
  };
}
