import { NextResponse } from "next/server";
import { syncAllOutlookInboxes } from "@/lib/microsoft-graph-sync";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllOutlookInboxes();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
