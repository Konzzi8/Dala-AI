import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { buildMicrosoftAuthorizeUrl } from "@/lib/microsoft-oauth";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const state = Buffer.from(
      JSON.stringify({ uid: auth.user.id, t: Date.now() }),
      "utf8",
    ).toString("base64url");
    const url = buildMicrosoftAuthorizeUrl(state);
    return NextResponse.redirect(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OAuth failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
