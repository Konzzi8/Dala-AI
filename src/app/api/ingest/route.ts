import { NextResponse } from "next/server";
import { ingestEmailContent } from "@/lib/ingest-email";
import { ensureDemoShipmentsSeeded } from "@/lib/seed-demo-shipments";

/** Persists parsed shipments via `ingestEmailContent` → `mergeExtractionIntoShipment` → Supabase. */
export async function POST(req: Request) {
  try {
    await ensureDemoShipmentsSeeded();

    const body = (await req.json()) as {
      subject?: string;
      from?: string;
      text?: string;
    };
    const { shipment, extraction, parser } = await ingestEmailContent({
      subject: body.subject?.trim() || "(no subject)",
      from: body.from?.trim() || "unknown@sender.com",
      text: body.text?.trim() || "",
    });

    return NextResponse.json({
      shipment,
      extraction,
      parser,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
