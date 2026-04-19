import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { DalaAiAssistantPanel } from "@/components/dashboard/dala-ai-assistant-panel";

export const metadata: Metadata = {
  title: "Dala AI Assistant — Dala",
  description: "AI assistant for your freight workspace.",
};

function PanelFallback() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-[#e2e8f0] bg-white dark:border-slate-700 dark:bg-slate-900">
      <Loader2 className="h-8 w-8 animate-spin text-[#64748b]" aria-hidden />
    </div>
  );
}

export default function DalaAiAssistantPage() {
  return (
    <div className="-mx-8 -mt-2 flex min-h-0 flex-col overflow-hidden md:-mt-4">
      {/* Fills viewport below header + main padding; inner column scrolls only */}
      <div className="flex h-[calc(100dvh-7.5rem)] max-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden md:h-[calc(100dvh-9.5rem)] md:max-h-[calc(100dvh-9.5rem)]">
        <Suspense fallback={<PanelFallback />}>
          <DalaAiAssistantPanel />
        </Suspense>
      </div>
    </div>
  );
}
