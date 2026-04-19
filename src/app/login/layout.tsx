import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Dala",
  description: "Sign in to the Dala freight forwarding co-pilot.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
