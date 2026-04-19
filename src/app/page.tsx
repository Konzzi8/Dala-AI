import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/marketing-home";

export const metadata: Metadata = {
  title: "Dala — The Future of Freight Forwarding",
  description:
    "AI-powered shipment tracking, email parsing, and intelligent insights for modern freight forwarders.",
};

export default function HomePage() {
  return (
    <div className="scroll-smooth">
      <MarketingHome />
    </div>
  );
}
