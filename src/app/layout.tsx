import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dala — Freight forwarding co-pilot",
  description:
    "Email-first AI that structures shipments, flags risk, and answers in natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} min-h-screen bg-[var(--page)] font-sans text-base leading-[1.6] tracking-[0.01em] text-[var(--text)] antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
