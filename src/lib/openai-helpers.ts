import OpenAI from "openai";
import { openaiBaseURL } from "@/lib/api-urls";
import { emailJsonExtractionSystemPrompt } from "@/lib/email-extraction-prompt";
import type { ParsedEmailExtraction } from "./types";

export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const baseURL = openaiBaseURL();
  return new OpenAI(baseURL ? { apiKey: key, baseURL } : { apiKey: key });
}

export async function openaiParseEmail(
  subject: string,
  body: string,
): Promise<ParsedEmailExtraction | null> {
  const client = getOpenAI();
  if (!client) return null;

  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: emailJsonExtractionSystemPrompt(),
      },
      {
        role: "user",
        content: `Subject: ${subject}\n\nBody:\n${body.slice(0, 12000)}`,
      },
    ],
  });

  const text = res.choices[0]?.message?.content?.trim();
  if (!text) return null;
  try {
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "");
    return JSON.parse(cleaned) as ParsedEmailExtraction;
  } catch {
    return null;
  }
}

export async function openaiChat(system: string, user: string): Promise<string | null> {
  const client = getOpenAI();
  if (!client) return null;
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || null;
}
