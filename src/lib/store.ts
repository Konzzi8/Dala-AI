import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingRelationError } from "@/lib/supabase-errors";
import type { ArchivedEmail, Shipment, StoreShape } from "./types";
import { applyRisksToShipment } from "./risk-engine";

export type DbShipmentRow = {
  id: string;
  user_id?: string | null;
  reference: string;
  status: string | null;
  risk_level: string | null;
  eta: string | null;
  origin: string | null;
  destination: string | null;
  carrier: string | null;
  container_numbers?: unknown;
  bill_of_lading?: string | null;
  created_at: string;
  updated_at?: string | null;
  raw_email: string | null;
};

export type DbEmailRow = {
  id: string;
  subject: string | null;
  sender: string | null;
  body: string | null;
  received_at: string;
  shipment_id: string | null;
};

function parseContainerColumn(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw) as unknown;
      if (Array.isArray(j)) return j.filter((x): x is string => typeof x === "string");
    } catch {
      /* ignore */
    }
  }
  return [];
}

function normalizeRisk(level: string | null): "high" | "medium" | "low" {
  if (level === "high" || level === "medium" || level === "low") return level;
  return "low";
}

function mergeArchivedFromDb(db: DbEmailRow[], legacy: ArchivedEmail[]): ArchivedEmail[] {
  const map = new Map<string, ArchivedEmail>();
  for (const e of legacy) map.set(e.id, e);
  for (const e of db) {
    map.set(e.id, {
      id: e.id,
      subject: e.subject || "(no subject)",
      from: e.sender || "",
      receivedAt: e.received_at,
      bodySnippet: (e.body || "").slice(0, 280),
    });
  }
  return [...map.values()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export function rowToShipment(row: DbShipmentRow, dbEmails?: DbEmailRow[]): Shipment {
  if (row.raw_email?.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(row.raw_email) as {
        version?: number;
        legacyShipment?: Shipment;
      };
      if (parsed.legacyShipment && typeof parsed.legacyShipment === "object") {
        const base = parsed.legacyShipment;
        const cols = parseContainerColumn(row.container_numbers);
        const merged = applyRisksToShipment({
          ...base,
          id: row.id,
          createdAt: row.created_at || base.createdAt,
          updatedAt: row.updated_at || base.updatedAt,
          eta: base.eta || row.eta || undefined,
          origin: base.origin || row.origin || undefined,
          destination: base.destination || row.destination || undefined,
          clientName: base.clientName || row.carrier || undefined,
          containerNumbers:
            base.containerNumbers?.length > 0 ? base.containerNumbers : cols,
          blNumber: base.blNumber || row.bill_of_lading || undefined,
        });
        if (dbEmails && dbEmails.length > 0) {
          merged.emails = mergeArchivedFromDb(dbEmails, merged.emails);
        }
        return merged;
      }
    } catch {
      /* fall through */
    }
  }

  const carrier = row.carrier || undefined;
  const note = row.raw_email || "";
  const created = row.created_at || new Date().toISOString();
  const updated = row.updated_at || created;
  const normalizedRisk = normalizeRisk(row.risk_level);
  const cols = parseContainerColumn(row.container_numbers);

  const seeded: Shipment = {
    id: row.id,
    reference: row.reference || "UNREF",
    containerNumbers: cols,
    blNumber: row.bill_of_lading || undefined,
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
    emails:
      dbEmails && dbEmails.length > 0
        ? mergeArchivedFromDb(dbEmails, [])
        : note
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
    updatedAt: updated,
  };

  return applyRisksToShipment(seeded);
}

export async function readStore(client: SupabaseClient): Promise<StoreShape> {
  const { data, error } = await client
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read shipments from Supabase: ${error.message}`);
  }
  const rows = (data || []) as DbShipmentRow[];
  const ids = rows.map((r) => r.id);
  const emailByShipment = new Map<string, DbEmailRow[]>();
  if (ids.length > 0) {
    const { data: emailRows, error: emailErr } = await client
      .from("emails")
      .select("*")
      .in("shipment_id", ids);
    if (emailErr) {
      if (isMissingRelationError(emailErr)) {
        /* Migrations not applied — still return shipments without joined emails */
      } else {
        throw new Error(`Failed to read emails from Supabase: ${emailErr.message}`);
      }
    } else {
      for (const e of emailRows || []) {
        const sid = e.shipment_id as string | null;
        if (!sid) continue;
        const list = emailByShipment.get(sid) || [];
        list.push(e as DbEmailRow);
        emailByShipment.set(sid, list);
      }
    }
  }

  const shipments = rows.map((r) => rowToShipment(r, emailByShipment.get(r.id)));
  return { shipments, lastIngestId: "" };
}

export async function upsertShipment(
  client: SupabaseClient,
  userId: string,
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
    reviewedAt: partial.reviewedAt,
  });

  const riskLevel = normalized.risks.find((r) => r.level === "high")
    ? "high"
    : normalized.risks.find((r) => r.level === "medium")
      ? "medium"
      : "low";

  const raw_email = JSON.stringify({
    version: 1,
    legacyShipment: normalized,
  });

  const row = {
    id: normalized.id,
    user_id: userId,
    reference: normalized.reference,
    status: normalized.customsStatus || "unknown",
    risk_level: riskLevel,
    eta: normalized.eta || null,
    origin: normalized.origin || null,
    destination: normalized.destination || null,
    carrier: normalized.clientName || null,
    container_numbers: normalized.containerNumbers,
    bill_of_lading: normalized.blNumber || null,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt,
    raw_email,
  };

  const { data, error } = await client
    .from("shipments")
    .upsert(row)
    .select("*")
    .single();
  if (error) throw new Error(`Failed to upsert shipment: ${error.message}`);
  return rowToShipment(data as DbShipmentRow);
}

export async function mergeExtractionIntoShipment(
  client: SupabaseClient,
  userId: string,
  extraction: import("./types").ParsedEmailExtraction,
  emailMeta: { subject: string; from: string; body: string; graphMessageId?: string },
): Promise<Shipment> {
  const reference =
    extraction.reference?.trim() || `UNREF-${Date.now().toString().slice(-6)}`;

  const { data: existingRow, error: lookupError } = await client
    .from("shipments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`Failed to lookup shipment by reference: ${lookupError.message}`);
  }

  const existingShipment = existingRow
    ? rowToShipment(existingRow as DbShipmentRow)
    : undefined;

  const { data: byContainerRows } =
    extraction.containerNumbers?.length && !existingShipment
      ? await client.from("shipments").select("*")
      : { data: null as DbShipmentRow[] | null };

  let matchFromContainer: Shipment | undefined;
  if (byContainerRows?.length && extraction.containerNumbers?.length) {
    for (const row of byContainerRows) {
      const s = rowToShipment(row as DbShipmentRow);
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

  const receivedAt = new Date().toISOString();

  const shipment = await upsertShipment(
    client,
    userId,
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
      emails: [...(base?.emails || [])],
    },
    undefined,
  );

  const { error: emailInsertError } = await client.from("emails").insert({
    user_id: userId,
    subject: emailMeta.subject,
    sender: emailMeta.from,
    body: emailMeta.body,
    parsed: extraction as unknown as Record<string, unknown>,
    shipment_id: shipment.id,
    received_at: receivedAt,
    graph_message_id: emailMeta.graphMessageId ?? null,
    is_urgent: detectUrgent(emailMeta.subject + "\n" + emailMeta.body),
  });

  if (emailInsertError) {
    throw new Error(`Failed to save email row: ${emailInsertError.message}`);
  }

  const { data: emailRows } = await client
    .from("emails")
    .select("*")
    .eq("shipment_id", shipment.id);
  const { data: row } = await client.from("shipments").select("*").eq("id", shipment.id).single();
  if (!row) return shipment;
  return rowToShipment(row as DbShipmentRow, (emailRows || []) as DbEmailRow[]);
}

function detectUrgent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("delay") ||
    t.includes("customs hold") ||
    t.includes("missing doc") ||
    t.includes("urgent") ||
    t.includes("held at")
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
