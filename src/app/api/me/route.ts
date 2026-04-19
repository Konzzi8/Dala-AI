import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  const email = auth.user.email ?? profile?.email ?? "";
  const fullName = profile?.full_name?.trim() || "";
  const firstName =
    fullName.split(/\s+/)[0] ||
    (email.includes("@") ? email.split("@")[0] : "there");

  return NextResponse.json({
    email,
    fullName: fullName || null,
    firstName,
  });
}
