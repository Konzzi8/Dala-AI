"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabaseBrowser, isSupabaseBrowserConfigured } from "@/lib/supabase-browser";

const inputClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3.5 text-base leading-relaxed text-[var(--text)] placeholder:text-[var(--text-subtle)] shadow-inner shadow-black/[0.04] transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/25 dark:shadow-black/25";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authReady = isSupabaseBrowserConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or use Continue to app.");
      return;
    }
    setBusy(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell relative min-h-screen text-[var(--text)]">
      <div className="pointer-events-none fixed inset-0 app-grid" aria-hidden />

      <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-3 rounded-2xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-lg font-bold text-white shadow-lg shadow-sky-500/25 ring-1 ring-sky-300/50 dark:ring-sky-500/30">
              D
            </span>
            <span className="text-left">
              <span className="block text-2xl font-bold tracking-tight text-[var(--text)]">Dala AI</span>
              <span className="text-sm font-medium text-[var(--text-muted)]">Freight co-pilot</span>
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 p-8 shadow-[var(--shadow-ui)] backdrop-blur-xl sm:p-10">
          <h1 className="text-center text-2xl font-bold tracking-tight text-[var(--text)]">Sign in</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-[var(--text-muted)]">
            Use your work email to access the workspace.
          </p>

          {!authReady && (
            <p className="mt-6 rounded-2xl border border-sky-300/50 bg-sky-100/50 px-4 py-3 text-sm leading-relaxed text-sky-950 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-100">
              Email sign-in needs{" "}
              <code className="rounded bg-[var(--card-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text)]">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="rounded bg-[var(--card-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text)]">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              in <code className="font-mono text-xs">.env.local</code> (same project as your server Supabase vars). You can
              still open the app below.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[var(--text)]">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[var(--text)]">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !authReady}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 space-y-4 border-t border-[var(--border)] pt-8 text-center">
            <Link
              href="/"
              className="inline-flex text-sm font-semibold text-sky-700 underline-offset-4 transition hover:text-sky-600 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
            >
              Continue to app without signing in
            </Link>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              The dashboard works with your existing Supabase data; sign-in is optional until you lock down access.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-[var(--text-muted)]">
          <Link href="/" className="font-medium text-[var(--text)] underline-offset-2 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
