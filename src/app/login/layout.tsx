import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Dala AI",
  description: "Sign in to the Dala AI freight forwarding co-pilot.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
