import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { exchangeCodeForTokens } from "@/lib/microsoft-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const err = searchParams.get("error");

  if (err) {
    return NextResponse.redirect(new URL(`/?outlook_error=${encodeURIComponent(err)}`, request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/?outlook_error=missing_code", request.url));
  }

  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let stateUid: string | undefined;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      uid?: string;
    };
    stateUid = parsed.uid;
  } catch {
    return NextResponse.redirect(new URL("/?outlook_error=invalid_state", request.url));
  }

  if (stateUid !== auth.user.id) {
    return NextResponse.redirect(new URL("/?outlook_error=state_mismatch", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await auth.supabase.from("outlook_connections").upsert(
      {
        user_id: auth.user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return NextResponse.redirect(
        new URL(`/?outlook_error=${encodeURIComponent(error.message)}`, request.url),
      );
    }

    return NextResponse.redirect(new URL("/?outlook_connected=1", request.url));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "token_failed";
    return NextResponse.redirect(new URL(`/?outlook_error=${encodeURIComponent(msg)}`, request.url));
  }
}
