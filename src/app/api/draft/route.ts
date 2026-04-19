import { NextResponse } from "next/server";
import { anthropicChat, hasAnthropicApiKey } from "@/lib/anthropic";
import { getAuthContext } from "@/lib/auth-server";
import { readStore } from "@/lib/store";

export async function POST(req: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shipmentId, tone } = (await req.json()) as {
    shipmentId?: string;
    tone?: string;
  };
  if (!shipmentId) {
    return NextResponse.json({ error: "shipmentId required" }, { status: 400 });
  }

  const store = await readStore(auth.supabase);
  const s = store.shipments.find((x) => x.id === shipmentId);
  if (!s) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const summary = {
    reference: s.reference,
    client: s.clientName,
    containers: s.containerNumbers,
    bl: s.blNumber,
    eta: s.eta,
    freeTimeEnd: s.freeTimeEnd,
    customs: s.customsStatus,
    missingDocs: s.documents.filter((d) => !d.received).map((d) => d.name),
    pendingApprovals: s.approvals.filter((a) => !a.received).map((a) => a.type),
    risks: s.risks.filter((r) => r.level !== "low"),
  };

  const t = tone || "professional and concise";

  const hasAnthropicKey = hasAnthropicApiKey();

  if (hasAnthropicKey) {
    try {
      const ai = await anthropicChat(
        `You draft email replies for freight forwarders. Tone: ${t}. Include clear next steps and dates when known. Do not fabricate tracking or vessel names.`,
        `Draft a client update email body (plain text, no subject) for this shipment:\n${JSON.stringify(summary, null, 2)}`,
      );
      if (ai) {
        return NextResponse.json({ draft: ai, source: "anthropic" });
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Unknown error";
      if (process.env.NODE_ENV === "development") {
        console.error("[api/draft] Anthropic error:", e);
      }
      return NextResponse.json(
        {
          error: "Anthropic request failed",
          detail: process.env.NODE_ENV === "development" ? detail : undefined,
        },
        { status: 502 },
      );
    }
  }

  const draft = [
    `Hi ${s.clientName || "team"},`,
    "",
    `Update on **${s.reference}**:`,
    `- Container(s): ${s.containerNumbers.join(", ") || "TBD"}`,
    `- ETA: ${s.eta || "TBD"}`,
    `- B/L: ${s.blNumber || "pending on file"}`,
    s.documents.some((d) => !d.received)
      ? `- Action needed: ${s.documents.filter((d) => !d.received).map((d) => d.name).join(", ")}`
      : `- Documents: complete per current file`,
    "",
    "Please confirm any open approvals on your side.",
    "",
    "Best regards,",
  ].join("\n");

  return NextResponse.json({ draft, source: "template" });
}
