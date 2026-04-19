"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser, isSupabaseBrowserConfigured } from "@/lib/supabase-browser";

const inputClass =
  "h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-[14px] text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] transition focus:border-[#2563eb] focus:outline-none focus:ring-[3px] focus:ring-[rgba(37,99,235,0.1)]";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    if (!isSupabaseBrowserConfigured()) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Could not initialize auth.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const { error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      setNote("Check your email to confirm your account if required by your Supabase project settings.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-5 py-16 text-[#0f172a] sm:px-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col justify-center">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563eb] text-lg font-bold text-white shadow-sm">
              D
            </span>
            <span className="text-left">
              <span className="block text-2xl font-bold tracking-tight">Dala</span>
              <span className="text-sm font-medium text-[#475569]">Create your forwarder account</span>
            </span>
          </Link>
        </div>

        <div className="rounded-lg border border-[#e2e8f0] bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-center text-2xl font-bold tracking-tight">Sign up</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-[#475569]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#2563eb] hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-[#475569]">
                Work email
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-[#475569]">
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
            )}
            {note && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#15803d]">
                {note}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#2563eb] py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
