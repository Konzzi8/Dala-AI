"use client";

import { useState } from "react";
import { ContactModal } from "./contact-modal";
import { MarketingNavbar } from "./marketing-navbar";
import { PremiumMarketingSections } from "./premium-marketing-sections";

export function MarketingHome() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <MarketingNavbar />
      <PremiumMarketingSections onRequestDemo={() => setContactOpen(true)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
