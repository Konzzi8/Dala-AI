import type { ParsedEmailExtraction } from "@/lib/types";
import {
  emailSuggestsRevisedEta,
  heuristicParseEmail,
} from "@/lib/heuristic-parser";
import { mergeExtractionIntoShipment } from "@/lib/store";
import { openaiParseEmail } from "@/lib/openai-helpers";

/** Prefer AI fields; fill gaps from heuristics so containers/dates/route still appear when the model omits them. */
function mergeAiWithHeuristic(
  ai: ParsedEmailExtraction,
  h: ParsedEmailExtraction,
  fullText: string,
): ParsedEmailExtraction {
  /** If the email says ETA was changed/revised, trust regex-derived ETA over the model (often keeps the old date). */
  const preferHeuristicEta =
    emailSuggestsRevisedEta(fullText) && Boolean(h.eta);

  return {
    ...h,
    ...ai,
    reference: ai.reference || h.reference,
    containerNumbers:
      ai.containerNumbers && ai.containerNumbers.length > 0
        ? ai.containerNumbers
        : h.containerNumbers,
    blNumber: ai.blNumber || h.blNumber,
    eta: preferHeuristicEta ? h.eta || ai.eta : ai.eta || h.eta,
    freeTimeEnd: ai.freeTimeEnd || h.freeTimeEnd,
    origin: ai.origin || h.origin,
    destination: ai.destination || h.destination,
    clientName: ai.clientName || h.clientName,
    documents:
      ai.documents && ai.documents.length > 0 ? ai.documents : h.documents,
    approvals:
      ai.approvals && ai.approvals.length > 0 ? ai.approvals : h.approvals,
    customsStatus: ai.customsStatus || h.customsStatus,
    rateConfirmed:
      ai.rateConfirmed !== undefined && ai.rateConfirmed !== null
        ? ai.rateConfirmed
        : h.rateConfirmed,
    notes: ai.notes || h.notes,
  };
}

export async function ingestEmailContent(input: {
  subject: string;
  from: string;
  text: string;
}) {
  const subject = input.subject?.trim() || "(no subject)";
  const from = input.from?.trim() || "unknown@sender.com";
  const text = input.text?.trim() || "";

  const fullText = `${subject}\n${text}`;
  const heuristic = heuristicParseEmail(text, subject);
  const ai = await openaiParseEmail(subject, text);
  const usedAi = Boolean(ai);
  const extraction = ai
    ? mergeAiWithHeuristic(ai, heuristic, fullText)
    : heuristic;

  const shipment = await mergeExtractionIntoShipment(extraction, {
    subject,
    from,
    body: text,
  });

  return {
    shipment,
    extraction,
    parser: usedAi ? ("openai" as const) : ("heuristic" as const),
  };
}
