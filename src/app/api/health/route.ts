import { NextResponse } from "next/server";

/**
 * Liveness for deploy platforms and monitoring. Does not expose secrets or hit the database.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "dala-ai",
      time: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
