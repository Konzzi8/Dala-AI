/** Shared instructions for OpenAI + Anthropic email → JSON extraction. */

export const EMAIL_JSON_EXTRACTION_SCHEMA = `{
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

export function emailJsonExtractionSystemPrompt(): string {
  return `You extract freight forwarding shipment facts from emails. Return ONLY valid JSON matching this shape (no markdown):\n${EMAIL_JSON_EXTRACTION_SCHEMA}\nRules:
- Use ISO dates YYYY-MM-DD only when a calendar date is explicit in the email.
- Infer document receipt from phrases like "attached", "please find".
- containerNumbers: every container ID matching 4 letters + 7 digits (e.g. MSCU9998888).
- blNumber: from "B/L", "BL", "Bill of Lading", "B/L reference", etc.
- eta and freeTimeEnd: separate dates; LFD / last free day / free time → freeTimeEnd.
- eta: If the email says the ETA was changed, revised, updated, or superseded (e.g. "revised ETA", "ETA has changed", "new ETA"), set eta to the NEW date only — not an older ETA mentioned earlier in the same email.
- origin and destination: cities or regions from route, POL/POD, "from X to Y", "ETA <city> <date>", or port names.`;
}
