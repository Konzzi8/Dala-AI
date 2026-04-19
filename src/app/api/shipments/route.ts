import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { readStore } from "@/lib/store";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { shipments } = await readStore(auth.supabase);
  const sorted = [...shipments].sort((a, b) => b.priorityScore - a.priorityScore);
  return NextResponse.json({ shipments: sorted });
}
