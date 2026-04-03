import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";
import { answerLocalQuery } from "@/lib/local-query";
import { openaiChat } from "@/lib/openai-helpers";

export async function POST(req: Request) {
  try {
    const { message } = (await req.json()) as { message?: string };
    const q = message?.trim();
    if (!q) return NextResponse.json({ error: "message required" }, { status: 400 });

    let shipments: Awaited<ReturnType<typeof readStore>>["shipments"];
    try {
      const store = await readStore();
      shipments = store.shipments;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json({
        answer: [
          "**Couldn't load shipment data.**",
          "",
          msg,
          "",
          "Check **SUPABASE_URL** and **SUPABASE_ANON_KEY** in your `.env` and restart the dev server.",
        ].join("\n"),
        source: "error",
      });
    }

    const system = `You are Dala AI, an email-first freight forwarding assistant. You answer using ONLY the JSON shipment data provided. Be concise, operational, and use bullet lists when listing multiple shipments. If data is missing, say so. Never invent container numbers or dates.`;

    const data = JSON.stringify(
      shipments.map((s) => ({
        reference: s.reference,
        containers: s.containerNumbers,
        bl: s.blNumber,
        eta: s.eta,
        freeTimeEnd: s.freeTimeEnd,
        client: s.clientName,
        customs: s.customsStatus,
        documents: s.documents,
        approvals: s.approvals,
        risks: s.risks,
        priorityScore: s.priorityScore,
        emailCount: s.emails.length,
      })),
    );

    let ai: string | null = null;
    try {
      ai = await openaiChat(
        system,
        `Shipment database (JSON):\n${data}\n\nUser question:\n${q}`,
      );
    } catch {
      /* Invalid key, quota, network — fall back to local rules */
      ai = null;
    }

    if (ai) {
      return NextResponse.json({ answer: ai, source: "openai" });
    }

    return NextResponse.json({
      answer: answerLocalQuery(q, shipments),
      source: "local",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json({ answer: message, source: "error" });
  }
}
