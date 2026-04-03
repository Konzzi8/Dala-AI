import OpenAI from "openai";
import { openaiBaseURL } from "@/lib/api-urls";
import type { ParsedEmailExtraction } from "./types";

const extractionSchema = `{
  "reference": string | null,
  "containerNumbers": string[],
  "blNumber": string | null,
  "eta": "YYYY-MM-DD" | null,
  "freeTimeEnd": "YYYY-MM-DD" | null,
  "clientName": string | null,
  "origin": string | null,
  "destination": string | null,
  "documents": [{ "name": string, "received": boolean }],
  "approvals": [{ "type": string, "received": boolean }],
  "customsStatus": "cleared" | "held" | "pending" | "unknown" | null,
  "rateConfirmed": boolean | null,
  "notes": string | null
}`;

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
        content: `You extract freight forwarding shipment facts from emails. Return ONLY valid JSON matching this shape (no markdown):\n${extractionSchema}\nRules:
- Use ISO dates YYYY-MM-DD only when a calendar date is explicit in the email.
- Infer document receipt from phrases like "attached", "please find".
- containerNumbers: every container ID matching 4 letters + 7 digits (e.g. MSCU9998888).
- blNumber: from "B/L", "BL", "Bill of Lading", "B/L reference", etc.
- eta and freeTimeEnd: separate dates; LFD / last free day / free time → freeTimeEnd.
- eta: If the email says the ETA was changed, revised, updated, or superseded (e.g. "revised ETA", "ETA has changed", "new ETA"), set eta to the NEW date only — not an older ETA mentioned earlier in the same email.
- origin and destination: cities or regions from route, POL/POD, "from X to Y", "ETA <city> <date>", or port names.`,
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
