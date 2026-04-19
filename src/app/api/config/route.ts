import { NextResponse } from "next/server";
import { hasAnthropicApiKey } from "@/lib/anthropic";
import type { PublicAppConfig } from "@/lib/public-config";

/**
 * Safe, non-secret flags for UI (onboarding, settings). No keys or URLs with secrets.
 */
export async function GET() {
  const outlookOAuth = Boolean(
    process.env.MICROSOFT_CLIENT_ID?.trim() && process.env.MICROSOFT_CLIENT_SECRET?.trim(),
  );
  const payload: PublicAppConfig = {
    name: "Dala",
    features: {
      outlookOAuth,
      aiChat: hasAnthropicApiKey(),
      aiEmailParse: Boolean(
        hasAnthropicApiKey() || process.env.OPENAI_API_KEY?.trim(),
      ),
      cronSync: Boolean(process.env.CRON_SECRET?.trim()),
    },
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
