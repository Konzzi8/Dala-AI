import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import {
  rowToShipment,
  upsertShipment,
  type DbEmailRow,
  type DbShipmentRow,
} from "@/lib/store";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const { data: row, error } = await auth.supabase
    .from("shipments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: emailRows } = await auth.supabase.from("emails").select("*").eq("shipment_id", id);

  const shipment = rowToShipment(row as DbShipmentRow, (emailRows || []) as DbEmailRow[]);
  return NextResponse.json({ shipment });
}

/** Mark shipment reviewed (persists `reviewedAt` in legacy JSON). */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json()) as { reviewed?: boolean };
  if (body.reviewed !== true) {
    return NextResponse.json({ error: "Expected { \"reviewed\": true }" }, { status: 400 });
  }

  const { data: row, error } = await auth.supabase.from("shipments").select("*").eq("id", id).maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: emailRows } = await auth.supabase.from("emails").select("*").eq("shipment_id", id);
  const s = rowToShipment(row as DbShipmentRow, (emailRows || []) as DbEmailRow[]);
  const updated = await upsertShipment(auth.supabase, auth.user.id, {
    ...s,
    id: s.id,
    reviewedAt: new Date().toISOString(),
  });
  return NextResponse.json({ shipment: updated });
}
