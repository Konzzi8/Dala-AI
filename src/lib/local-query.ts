import type { Shipment } from "./types";

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function answerLocalQuery(question: string, shipments: Shipment[]): string {
  const q = norm(question);

  const findByContainer = (cn: string) =>
    shipments.filter((s) =>
      s.containerNumbers.some((c) => c.toLowerCase().includes(cn.toLowerCase())),
    );

  const msc = q.match(/\b([a-z]{4}\d{7})\b/);
  if (msc) {
    const hits = findByContainer(msc[1].toUpperCase());
    if (hits.length === 0) return `No shipment found with container **${msc[1].toUpperCase()}**.`;
    const s = hits[0];
    return [
      `**${s.reference}** — ${s.clientName || "Unknown client"}`,
      `Containers: ${s.containerNumbers.join(", ") || "—"}`,
      `B/L: ${s.blNumber || "not on file"}`,
      `ETA: ${s.eta || "—"} | Free time end: ${s.freeTimeEnd || "—"}`,
      `Customs: ${s.customsStatus || "unknown"}`,
      `Top risks: ${s.risks.filter((r) => r.level !== "low").map((r) => r.message).join("; ") || "none flagged"}`,
    ].join("\n");
  }

  if (/missing|b\/l|bill of lading|bls?/.test(q)) {
    const missing = shipments.filter((s) =>
      s.documents.some((d) => d.name.toLowerCase().includes("b/l") && !d.received),
    );
    if (!missing.length) return "No shipments with missing Bill of Lading on file.";
    return (
      "**Shipments with missing B/L:**\n" +
      missing.map((s) => `- ${s.reference} (${s.containerNumbers.join(", ") || "no container"})`).join("\n")
    );
  }

  if (/risk|urgent|critical|this week/.test(q)) {
    const week = shipments.filter((s) => s.risks.some((r) => r.level === "high" || r.level === "medium"));
    week.sort((a, b) => b.priorityScore - a.priorityScore);
    if (!week.length) return "No medium/high risk flags on current shipments.";
    return (
      "**At-risk shipments (priority):**\n" +
      week
        .slice(0, 12)
        .map(
          (s) =>
            `- **${s.reference}** (priority ${s.priorityScore}/100): ${s.risks.filter((r) => r.level !== "low").map((r) => r.message).join("; ")}`,
        )
        .join("\n")
    );
  }

  if (/list all|all shipment|how many/.test(q)) {
    return `**${shipments.length}** shipments in database:\n${shipments.map((s) => `- ${s.reference}`).join("\n")}`;
  }

  return [
    "I can answer questions like:",
    "- *Where is shipment MSCU1234567?*",
    "- *Show missing B/Ls*",
    "- *Which shipments are at risk this week?*",
    "",
    "Add **ANTHROPIC_API_KEY** for AI-powered answers in chat.",
  ].join("\n");
}
