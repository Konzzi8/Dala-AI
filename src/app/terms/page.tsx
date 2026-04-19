import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Dala",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-24 text-[#0f172a] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-[#2563eb] hover:underline">
          ← Home
        </Link>
        <h1 className="mt-8 text-3xl font-bold">Terms of Service</h1>
        <p className="mt-6 leading-relaxed text-[#475569]">
          This is a placeholder terms page. Replace with your legal terms before production.
        </p>
      </div>
    </div>
  );
}
