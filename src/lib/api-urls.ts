/**
 * Single place for API bases. Override via env where noted.
 */

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/** Browser → this app’s route handlers. Empty env = same-origin relative paths. */
export function internalApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${trimTrailingSlash(base)}${p}`;
}

export function openaiBaseURL(): string | undefined {
  const u = process.env.OPENAI_BASE_URL?.trim();
  return u || undefined;
}
