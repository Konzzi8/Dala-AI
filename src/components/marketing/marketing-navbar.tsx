"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Anchor, Menu, X } from "lucide-react";

const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Demo", href: "#demo" },
];

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkTone = scrolled ? "text-[#64748b] hover:text-[#0f172a]" : "text-[#cbd5e1] hover:text-white";

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 flex h-[72px] items-center border-b transition-colors duration-300 ${
        scrolled || mobileOpen
          ? "border-[#e2e8f0] bg-white/95 shadow-sm backdrop-blur-[12px]"
          : "border-transparent bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm">
            <Anchor className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
          </span>
          <span
            className={`text-[20px] font-extrabold tracking-tight ${scrolled || mobileOpen ? "text-[#0f172a]" : "text-white"}`}
            style={{ letterSpacing: "-0.02em" }}
          >
            Dala AI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-[15px] font-medium transition duration-150 ease-out ${linkTone}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className={`hidden text-[15px] font-medium transition md:inline ${linkTone}`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-lg bg-[#2563eb] px-4 text-[14px] font-medium text-white shadow-sm transition duration-150 ease-out hover:scale-[0.99] hover:bg-[#1d4ed8] active:bg-[#1e40af] sm:px-5"
          >
            Start free trial
          </Link>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-lg border md:hidden ${
              scrolled || mobileOpen
                ? "border-[#e2e8f0] bg-white text-[#0f172a]"
                : "border-white/20 bg-white/10 text-white"
            }`}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[72px] border-b border-[#e2e8f0] bg-white px-8 py-5 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-[#475569] hover:bg-[#f8fafc]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-lg px-3 py-3 text-[15px] font-medium text-[#475569] hover:bg-[#f8fafc]"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
