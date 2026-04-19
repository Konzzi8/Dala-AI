/**
 * PostgREST / Supabase errors when a table has not been created or is not exposed (e.g. before migrations).
 */
export function isMissingRelationError(err: { message?: string } | null | undefined): boolean {
  const m = err?.message ?? "";
  if (!m) return false;
  return (
    /could not find the table/i.test(m) ||
    /could not find.*relation/i.test(m) ||
    /relation .+ does not exist/i.test(m) ||
    /schema cache/i.test(m)
  );
}
