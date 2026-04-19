import { NextResponse } from "next/server";
import { anthropicChatWithMessages, hasAnthropicApiKey } from "@/lib/anthropic";
import { getAuthContext } from "@/lib/auth-server";
import { answerLocalQuery } from "@/lib/local-query";
import { readStore } from "@/lib/store";

/** Server-only: never expose ANTHROPIC_API_KEY to the client. */
export async function POST(req: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      message?: string;
      history?: { role: string; content: string }[];
    };
    const q = body.message?.trim();
    if (!q) return NextResponse.json({ error: "message required" }, { status: 400 });

    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const history = rawHistory
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0,
      )
      .slice(-24)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.trim() }));

    let shipments: Awaited<ReturnType<typeof readStore>>["shipments"];
    try {
      const store = await readStore(auth.supabase);
      shipments = store.shipments;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json({
        answer: [
          "**Couldn't load shipment data.**",
          "",
          msg,
          "",
          "Check **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** in your `.env` and restart the dev server.",
        ].join("\n"),
        source: "error",
      });
    }

    const system = `You are Dala, an email-first freight forwarding assistant. You answer using ONLY the JSON shipment data provided. Be concise, operational, and use bullet lists when listing multiple shipments. If data is missing, say so. Never invent container numbers or dates.`;

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

    const hasAnthropicKey = hasAnthropicApiKey();

    if (!hasAnthropicKey) {
      return NextResponse.json({
        answer: answerLocalQuery(q, shipments),
        source: "local",
      });
    }

    try {
      const systemWithData = `${system}\n\nShipment database (JSON):\n${data}`;
      const priorMessages = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const messages = [...priorMessages, { role: "user" as const, content: q }];
      const ai = await anthropicChatWithMessages(systemWithData, messages);
      if (ai) {
        return NextResponse.json({ answer: ai, source: "anthropic" });
      }
      return NextResponse.json({
        answer:
          "**Unexpected:** `ANTHROPIC_API_KEY` is set but the Anthropic client returned no response. Restart the dev server after changing `.env`.",
        source: "error",
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Unknown error";
      if (process.env.NODE_ENV === "development") {
        console.error("[api/chat] Anthropic error:", e);
      }
      return NextResponse.json({
        answer: [
          "**Could not get an AI response from Anthropic.**",
          "",
          "Your server has `ANTHROPIC_API_KEY` set, but the request failed. Check the key, billing, and model access.",
          process.env.NODE_ENV === "development" ? `\n\n(${detail})` : "",
        ].join("\n"),
        source: "error",
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json({ answer: message, source: "error" });
  }
}
