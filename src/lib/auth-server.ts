import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  user: User;
};

/** Returns authenticated Supabase client + user, or null if not signed in. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}
