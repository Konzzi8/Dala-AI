import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { isMissingRelationError } from "@/lib/supabase-errors";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from("emails")
    .select(
      `
      id,
      subject,
      sender,
      body,
      parsed,
      shipment_id,
      received_at,
      is_read,
      is_urgent,
      created_at
    `,
    )
    .order("received_at", { ascending: false })
    .limit(150);

  if (error) {
    if (isMissingRelationError(error)) {
      return NextResponse.json({ emails: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const shipmentIds = [...new Set(rows.map((r) => r.shipment_id).filter(Boolean))] as string[];

  const refById = new Map<string, string>();
  if (shipmentIds.length > 0) {
    const { data: ships } = await auth.supabase
      .from("shipments")
      .select("id, reference")
      .in("id", shipmentIds);
    for (const s of ships || []) {
      refById.set(s.id as string, (s.reference as string) || "");
    }
  }

  const emails = rows.map((r) => ({
    id: r.id as string,
    subject: (r.subject as string) || "(no subject)",
    sender: (r.sender as string) || "",
    body: (r.body as string) || "",
    parsed: r.parsed,
    shipmentId: r.shipment_id as string | null,
    shipmentReference: r.shipment_id ? refById.get(r.shipment_id as string) ?? null : null,
    receivedAt: r.received_at as string,
    isRead: Boolean(r.is_read),
    isUrgent: Boolean(r.is_urgent),
  }));

  return NextResponse.json({ emails });
}
