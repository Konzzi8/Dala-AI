import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { emailJsonExtractionSystemPrompt } from "@/lib/email-extraction-prompt";
import type { ParsedEmailExtraction } from "@/lib/types";

/** Override with ANTHROPIC_MODEL in .env if needed. */
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

function textFromAssistantMessage(res: Anthropic.Messages.Message): string {
  const parts: string[] = [];
  for (const b of res.content) {
    if (b.type === "text" && typeof b.text === "string") {
      parts.push(b.text);
    }
  }
  return parts.join("\n\n").trim();
}

/** Trim, strip CR/LF, remove optional surrounding quotes from .env pastes. */
export function normalizeAnthropicApiKey(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  let k = raw.replace(/\r/g, "").trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  return k || undefined;
}

export function hasAnthropicApiKey(): boolean {
  return Boolean(normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY));
}

export function getAnthropic(): Anthropic | null {
  const key = normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY);
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

/**
 * Server-only. Returns null only when ANTHROPIC_API_KEY is unset (after trim).
 * On API errors, throws so callers can distinguish missing key vs failed request.
 */
export async function anthropicChat(system: string, user: string): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;
  const res = await client.messages.create({
    model: anthropicModel(),
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = textFromAssistantMessage(res);
  if (!text) {
    throw new Error("Anthropic returned an empty assistant message.");
  }
  return text;
}

/** Multi-turn chat: prior turns + latest user message. */
export async function anthropicChatWithMessages(
  system: string,
  messages: MessageParam[],
): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;
  if (messages.length === 0) {
    throw new Error("anthropicChatWithMessages: empty messages.");
  }
  const res = await client.messages.create({
    model: anthropicModel(),
    max_tokens: 4096,
    system,
    messages,
  });
  const text = textFromAssistantMessage(res);
  if (!text) {
    throw new Error("Anthropic returned an empty assistant message.");
  }
  return text;
}

/** Same JSON extraction as OpenAI ingest — uses Anthropic when ANTHROPIC_API_KEY is set. */
export async function anthropicParseEmail(
  subject: string,
  body: string,
): Promise<ParsedEmailExtraction | null> {
  const client = getAnthropic();
  if (!client) return null;
  try {
    const res = await client.messages.create({
      model: anthropicModel(),
      max_tokens: 4096,
      system: emailJsonExtractionSystemPrompt(),
      messages: [
        {
          role: "user",
          content: `Subject: ${subject}\n\nBody:\n${body.slice(0, 12000)}`,
        },
      ],
    });
    const text = textFromAssistantMessage(res);
    if (!text) return null;
    try {
      const cleaned = text.replace(/^```json\s*|\s*```$/g, "");
      return JSON.parse(cleaned) as ParsedEmailExtraction;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
