import { createServiceRoleClient } from "@/lib/supabase/service";

const DEFAULT_EMAIL = "nathanapinon@gmail.com";
const DEFAULT_PASSWORD = "1234";

export function isDemoBootstrapAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.ENABLE_DEMO_AUTH === "true"
  );
}

/**
 * Creates or updates the demo user so `signInWithPassword` works locally.
 * Requires SUPABASE_SERVICE_ROLE_KEY. Not for production unless ENABLE_DEMO_AUTH is intentional.
 */
export async function ensureDemoUser(): Promise<
  { ok: true } | { ok: false; error: string; status?: number }
> {
  if (!isDemoBootstrapAllowed()) {
    return { ok: false, error: "Demo bootstrap is disabled.", status: 403 };
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (from Supabase → Settings → API).",
      status: 503,
    };
  }

  const email = (process.env.DEMO_LOGIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.DEMO_LOGIN_PASSWORD || DEFAULT_PASSWORD;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!createErr && created.user) {
    return { ok: true };
  }

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) {
    return { ok: false, error: listErr.message, status: 500 };
  }

  const existing = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!existing) {
    return {
      ok: false,
      error:
        createErr?.message ??
        "Could not create demo user. Check Supabase Auth logs and password policy.",
      status: 500,
    };
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
    password,
  });
  if (updateErr) {
    return { ok: false, error: updateErr.message, status: 500 };
  }

  return { ok: true };
}
