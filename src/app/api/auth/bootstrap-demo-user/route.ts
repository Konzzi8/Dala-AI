import { NextResponse } from "next/server";
import { ensureDemoUser } from "@/lib/ensure-demo-user";

export async function POST() {
  const result = await ensureDemoUser();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
