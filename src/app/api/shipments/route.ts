import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET() {
  const { shipments } = await readStore();
  const sorted = [...shipments].sort((a, b) => b.priorityScore - a.priorityScore);
  return NextResponse.json({ shipments: sorted });
}
