import type { ArchivedEmail, Shipment, StoreShape } from "./types";
import { applyRisksToShipment } from "./risk-engine";
import { ensureDemoShipmentsSeeded } from "./seed-demo-shipments";
import { supabase } from "./supabase";

type ShipmentRow = {
  id: string;
  reference: string;
  status: string | null;
  risk_level: string | null;
  eta: string | null;
  origin: string | null;
  destination: string | null;
  carrier: string | null;
  created_at: string;
  raw_email: string | null;
};

function normalizeRisk(level: string | null): "high" | "medium" | "low" {
  if (level === "high" || level === "medium" || level === "low") return level;
  return "low";
}

export function rowToShipment(row: ShipmentRow): Shipment {
  if (row.raw_email?.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(row.raw_email) as {
        version?: number;
        legacyShipment?: Shipment;
      };
      if (parsed.legacyShipment && typeof parsed.legacyShipment === "object") {
        const base = parsed.legacyShipment;
        // JSON omits undefined keys; merge top-level columns from Supabase for missing fields.
        return applyRisksToShipment({
          ...base,
          id: row.id,
          createdAt: row.created_at || base.createdAt,
          updatedAt: base.updatedAt,
          eta: base.eta || row.eta || undefined,
          origin: base.origin || row.origin || undefined,
          destination: base.destination || row.destination || undefined,
          clientName: base.clientName || row.carrier || undefined,
        });
      }
    } catch {
      /* fall through to flat row mapping */
    }
  }

  const carrier = row.carrier || undefined;
  const note = row.raw_email || "";
  const created = row.created_at || new Date().toISOString();
  const normalizedRisk = normalizeRisk(row.risk_level);

  const seeded: Shipment = {
    id: row.id,
    reference: row.reference || "UNREF",
    containerNumbers: [],
    blNumber: undefined,
    eta: row.eta || undefined,
    freeTimeEnd: undefined,
    clientName: carrier,
    origin: row.origin || undefined,
    destination: row.destination || undefined,
    documents: [{ name: "Bill of Lading", received: false }],
    approvals: [],
    customsStatus:
      row.status === "cleared" ||
      row.status === "held" ||
      row.status === "pending" ||
      row.status === "unknown"
        ? row.status
        : "unknown",
    rateConfirmed: undefined,
    notes: note || undefined,
    emails: note
      ? [
          {
            id: `em-${row.id}`,
            subject: row.reference || "(ingested email)",
            from: carrier || "unknown@sender.com",
            receivedAt: created,
            bodySnippet: note.slice(0, 280),
          },
        ]
      : [],
    risks: [
      {
        id: `${row.id}-db-risk`,
        level: normalizedRisk,
        code: "DB_RISK_LEVEL",
        message: `Risk level from source: ${normalizedRisk}`,
      },
    ],
    priorityScore:
      normalizedRisk === "high" ? 100 : normalizedRisk === "medium" ? 40 : 5,
    createdAt: created,
    updatedAt: created,
  };

  return applyRisksToShipment(seeded);
}

export async function readStore(): Promise<StoreShape> {
  await ensureDemoShipmentsSeeded();
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to read shipments from Supabase: ${error.message}`);
  }
  const shipments = (data || []).map((r) => rowToShipment(r as ShipmentRow));
  return { shipments, lastIngestId: "" };
}

export async function writeStore(store: StoreShape) {
  const rows = store.shipments.map((s) => ({
    id: s.id,
    reference: s.reference,
    status: s.customsStatus || "unknown",
    risk_level: s.risks.find((r) => r.level === "high")
      ? "high"
      : s.risks.find((r) => r.level === "medium")
        ? "medium"
        : "low",
    eta: s.eta || null,
    origin: s.origin || null,
    destination: s.destination || null,
    carrier: s.clientName || null,
    created_at: s.createdAt || new Date().toISOString(),
    raw_email: s.notes || s.emails[0]?.bodySnippet || null,
  }));
  const { error } = await supabase.from("shipments").upsert(rows);
  if (error) throw new Error(`Failed to write shipments to Supabase: ${error.message}`);
}

export async function upsertShipment(
  partial: Partial<Shipment> & { id: string },
  email?: ArchivedEmail,
): Promise<Shipment> {
  const now = new Date().toISOString();
  const emails =
    partial.emails && partial.emails.length > 0
      ? partial.emails
      : email
        ? [email]
        : [];

  const normalized = applyRisksToShipment({
    id: partial.id,
    reference: partial.reference || "UNREF",
    containerNumbers: partial.containerNumbers || [],
    blNumber: partial.blNumber,
    eta: partial.eta,
    freeTimeEnd: partial.freeTimeEnd,
    clientName: partial.clientName,
    origin: partial.origin,
    destination: partial.destination,
    documents: partial.documents || [{ name: "Bill of Lading", received: false }],
    approvals: partial.approvals || [],
    customsStatus: partial.customsStatus,
    rateConfirmed: partial.rateConfirmed,
    notes: partial.notes || email?.bodySnippet,
    emails,
    risks: [],
    priorityScore: 0,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  });

  const riskLevel = normalized.risks.find((r) => r.level === "high")
    ? "high"
    : normalized.risks.find((r) => r.level === "medium")
      ? "medium"
      : "low";

  /** Persist full structured shipment so containers, B/L, docs survive round-trips (Supabase has no columns for them). */
  const raw_email = JSON.stringify({
    version: 1,
    legacyShipment: normalized,
  });

  const row = {
    id: normalized.id,
    reference: normalized.reference,
    status: normalized.customsStatus || "unknown",
    risk_level: riskLevel,
    eta: normalized.eta || null,
    origin: normalized.origin || null,
    destination: normalized.destination || null,
    carrier: normalized.clientName || null,
    created_at: normalized.createdAt,
    raw_email,
  };

  const { data, error } = await supabase
    .from("shipments")
    .upsert(row)
    .select("*")
    .single();
  if (error) throw new Error(`Failed to upsert shipment: ${error.message}`);
  return rowToShipment(data as ShipmentRow);
}

export async function mergeExtractionIntoShipment(
  extraction: import("./types").ParsedEmailExtraction,
  emailMeta: { subject: string; from: string; body: string },
): Promise<Shipment> {
  const reference =
    extraction.reference?.trim() ||
    `UNREF-${Date.now().toString().slice(-6)}`;

  const { data: existingRow, error: lookupError } = await supabase
    .from("shipments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`Failed to lookup shipment by reference: ${lookupError.message}`);
  }

  const existingShipment = existingRow
    ? rowToShipment(existingRow as ShipmentRow)
    : undefined;

  const { data: byContainerRows } =
    extraction.containerNumbers?.length && !existingShipment
      ? await supabase.from("shipments").select("*")
      : { data: null as ShipmentRow[] | null };

  let matchFromContainer: Shipment | undefined;
  if (byContainerRows?.length && extraction.containerNumbers?.length) {
    for (const row of byContainerRows) {
      const s = rowToShipment(row as ShipmentRow);
      if (extraction.containerNumbers.some((c) => s.containerNumbers.includes(c))) {
        matchFromContainer = s;
        break;
      }
    }
  }

  const base = existingShipment || matchFromContainer;
  const id = base?.id || existingRow?.id || crypto.randomUUID();

  const mergeContainers = uniq([
    ...(base?.containerNumbers || []),
    ...(extraction.containerNumbers || []),
  ]);

  const archived: ArchivedEmail = {
    id: `em-${Date.now()}`,
    subject: emailMeta.subject,
    from: emailMeta.from,
    receivedAt: new Date().toISOString(),
    bodySnippet: emailMeta.body.slice(0, 280),
  };

  return upsertShipment(
    {
      id,
      reference: extraction.reference || base?.reference || reference,
      containerNumbers: mergeContainers,
      blNumber: extraction.blNumber || base?.blNumber,
      eta: extraction.eta || base?.eta,
      freeTimeEnd: extraction.freeTimeEnd || base?.freeTimeEnd,
      clientName: extraction.clientName || base?.clientName || emailMeta.from,
      origin: extraction.origin || base?.origin,
      destination: extraction.destination || base?.destination,
      documents: mergeDocs(base?.documents, extraction.documents),
      approvals: uniqAppr(base?.approvals || [], extraction.approvals),
      customsStatus: extraction.customsStatus || base?.customsStatus || "unknown",
      rateConfirmed:
        extraction.rateConfirmed !== undefined
          ? extraction.rateConfirmed
          : base?.rateConfirmed,
      notes: [emailMeta.subject, emailMeta.body].filter(Boolean).join("\n\n"),
      createdAt: base?.createdAt,
      emails: [...(base?.emails || []), archived],
    },
    undefined,
  );
}

function mergeDocs(
  existing?: import("./types").DocumentSlot[],
  incoming?: { name: string; received?: boolean }[],
): import("./types").DocumentSlot[] {
  const map = new Map<string, boolean>();
  for (const d of existing || []) map.set(d.name, d.received);
  for (const d of incoming || []) {
    const prev = map.get(d.name);
    map.set(d.name, prev === true || Boolean(d.received));
  }
  if (map.size === 0) return [{ name: "Bill of Lading", received: false }];
  return [...map.entries()].map(([name, received]) => ({ name, received }));
}

function uniqAppr(
  a: import("./types").ApprovalSlot[],
  b?: { type: string; received?: boolean }[],
): import("./types").ApprovalSlot[] {
  const map = new Map<string, boolean>();
  for (const x of a) map.set(x.type, x.received);
  for (const x of b || []) {
    const prev = map.get(x.type);
    map.set(x.type, prev === true || Boolean(x.received));
  }
  return [...map.entries()].map(([type, received]) => ({ type, received }));
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
