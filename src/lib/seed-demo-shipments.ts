import { readFile } from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabase";
import type { Shipment } from "@/lib/types";

/** Map legacy string ids from `dala-store.json` to fixed UUIDs (Postgres `uuid` PK). */
const LEGACY_ID_TO_UUID: Record<string, string> = {
  "shp-1": "00000000-0000-4000-8000-000000000001",
  "shp-2": "00000000-0000-4000-8000-000000000002",
  "shp-3": "00000000-0000-4000-8000-000000000003",
  "ff-2026-0201": "00000000-0000-4000-8000-000000000004",
};

function legacyIdToUuid(legacyId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(legacyId)) {
    return legacyId;
  }
  return LEGACY_ID_TO_UUID[legacyId] ?? crypto.randomUUID();
}

function riskLevelFromShipment(s: Shipment): "high" | "medium" | "low" {
  if (s.risks?.some((r) => r.level === "high")) return "high";
  if (s.risks?.some((r) => r.level === "medium")) return "medium";
  return "low";
}

function shipmentToInsertRow(s: Shipment) {
  const id = legacyIdToUuid(s.id);
  const legacy: Shipment = { ...s, id };
  return {
    id,
    reference: s.reference,
    status: s.customsStatus ?? "unknown",
    risk_level: riskLevelFromShipment(s),
    eta: s.eta ?? null,
    origin: s.origin ?? null,
    destination: s.destination ?? null,
    carrier: s.clientName ?? null,
    created_at: s.createdAt ?? new Date().toISOString(),
    raw_email: JSON.stringify({ version: 1, legacyShipment: legacy }),
  };
}

/**
 * If `shipments` is empty, inserts demo rows from `data/dala-store.json` (when present).
 * Safe to call on every request; exits quickly when data already exists.
 */
export async function ensureDemoShipmentsSeeded(): Promise<void> {
  const { count, error: countError } = await supabase
    .from("shipments")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to count shipments: ${countError.message}`);
  }
  if ((count ?? 0) > 0) return;

  const storePath = path.join(process.cwd(), "data", "dala-store.json");
  let shipments: Shipment[];
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as { shipments?: Shipment[] };
    shipments = parsed.shipments ?? [];
  } catch {
    return;
  }
  if (shipments.length === 0) return;

  const rows = shipments.map(shipmentToInsertRow);
  const { error } = await supabase.from("shipments").insert(rows);
  if (error) {
    throw new Error(`Failed to seed demo shipments: ${error.message}`);
  }
}
