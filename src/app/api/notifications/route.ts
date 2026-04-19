import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { isMissingRelationError } from "@/lib/supabase-errors";

export type NotificationItem = {
  id: string;
  type: "email" | "risk" | "document" | "eta";
  title: string;
  subtitle?: string;
  time: string;
};

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase } = auth;

  const unreadRes = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);
  if (unreadRes.error && !isMissingRelationError(unreadRes.error)) {
    return NextResponse.json({ error: unreadRes.error.message }, { status: 500 });
  }
  const unreadEmails = unreadRes.error ? 0 : (unreadRes.count ?? 0);

  const { count: highRisk } = await supabase
    .from("shipments")
    .select("*", { count: "exact", head: true })
    .eq("risk_level", "high");

  /** Cap rows so large accounts don’t block the dashboard (missing-docs hint is approximate). */
  const { data: shipments } = await supabase
    .from("shipments")
    .select("raw_email, risk_level")
    .order("updated_at", { ascending: false })
    .limit(400);

  let missingDocsHint = 0;
  for (const row of shipments || []) {
    try {
      const raw = row.raw_email;
      if (!raw?.startsWith("{")) continue;
      const j = JSON.parse(raw) as { legacyShipment?: { documents?: { received: boolean }[] } };
      const docs = j.legacyShipment?.documents;
      if (docs?.some((d) => !d.received)) missingDocsHint += 1;
    } catch {
      /* ignore */
    }
  }

  const badgeCount = Math.min(
    99,
    (unreadEmails ?? 0) + (highRisk ?? 0) + missingDocsHint,
  );

  const items: NotificationItem[] = [];

  const recentEmailsRes = await supabase
    .from("emails")
    .select("id, subject, sender, received_at, is_urgent")
    .order("received_at", { ascending: false })
    .limit(4);
  if (recentEmailsRes.error && !isMissingRelationError(recentEmailsRes.error)) {
    return NextResponse.json({ error: recentEmailsRes.error.message }, { status: 500 });
  }
  const recentEmails = recentEmailsRes.error ? [] : recentEmailsRes.data || [];

  for (const e of recentEmails) {
    items.push({
      id: `em-${e.id}`,
      type: "email",
      title: (e.subject as string) || "New email",
      subtitle: e.sender as string,
      time: e.received_at as string,
    });
  }

  const { data: riskShips } = await supabase
    .from("shipments")
    .select("id, reference, risk_level, eta, updated_at")
    .in("risk_level", ["high", "medium"])
    .order("updated_at", { ascending: false })
    .limit(4);

  for (const s of riskShips || []) {
    items.push({
      id: `rk-${s.id}`,
      type: "risk",
      title: `Risk: ${s.reference || "Shipment"}`,
      subtitle: `Level ${s.risk_level}${s.eta ? ` · ETA ${s.eta}` : ""}`,
      time: (s.updated_at as string) || new Date().toISOString(),
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json({
    unreadEmails: unreadEmails ?? 0,
    highRiskShipments: highRisk ?? 0,
    missingDocumentsShipments: missingDocsHint,
    badgeCount,
    items: items.slice(0, 8),
  });
}
