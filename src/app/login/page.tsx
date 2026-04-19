"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MainLogo } from "@/components/main-logo";
import { ParticleCanvas } from "@/components/marketing/particle-canvas";
import { getSupabaseBrowser, isSupabaseBrowserConfigured } from "@/lib/supabase-browser";

const inputClass =
  "h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-[14px] text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] transition focus:border-[#2563eb] focus:outline-none focus:ring-[3px] focus:ring-[rgba(37,99,235,0.1)]";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResetMsg(null);
    if (!isSupabaseBrowserConfigured()) {
      setError("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Could not initialize auth.");
      return;
    }
    setBusy(true);
    try {
      const runBootstrap =
        process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_ENABLE_DEMO_BOOTSTRAP === "true";
      if (runBootstrap) {
        await fetch("/api/auth/bootstrap-demo-user", { method: "POST" });
      }

      const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      if (!signData.session) {
        setError("Session was not created. Try again.");
        return;
      }
      await supabase.auth.getSession();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    setError(null);
    setResetMsg(null);
    const em = email.trim();
    if (!em) {
      setError("Enter your email above, then click Forgot password again.");
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { error: err } = await supabase.auth.resetPasswordForEmail(em, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (err) setError(err.message);
    else setResetMsg("Check your email for a password reset link.");
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden min-h-screen w-1/2 overflow-hidden bg-[#0f172a] lg:block">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_20%,rgba(37,99,235,0.12),transparent_60%)]" />
        <ParticleCanvas />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-[#f1f5f9]">
          <Link href="/" className="inline-flex items-center">
            <MainLogo variant="light" className="h-9 w-auto" />
          </Link>
          <div>
            <p className="text-3xl font-bold leading-tight tracking-tight text-white">
              Freight intelligence,
              <br />
              <span className="bg-gradient-to-r from-[#93c5fd] to-[#0ea5e9] bg-clip-text text-transparent">
                one inbox at a time.
              </span>
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#f1f5f9]/75">
              Sign in to your workspace for shipment tracking, AI copilot, and Outlook-powered parsing.
            </p>
          </div>
          <p className="text-xs text-[#f1f5f9]/45">© 2024 Dala</p>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col justify-center px-5 py-16 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Link href="/" className="inline-flex items-center text-[#0f172a]">
              <MainLogo variant="dark" className="h-8 w-auto" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Sign in</h1>
          <p className="mt-2 text-sm text-[#475569]">Use your work email and password.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#475569]">
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
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-[#475569]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => void onForgotPassword()}
                  className="text-xs font-medium text-[#2563eb] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Password"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#b91c1c]">
                {error}
              </p>
            )}
            {resetMsg && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#15803d]">
                {resetMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {busy && (
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#64748b]">
            Don&apos;t have an account?{" "}
            <a href="mailto:hello@dala.ai" className="font-semibold text-[#2563eb] hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
