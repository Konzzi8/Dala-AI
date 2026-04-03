export type PriorityTier = "stable" | "watch" | "elevated" | "critical";

/** Map 0–100 priority score to a coarse tier for UI and sorting context. */
export function priorityTier(score: number): PriorityTier {
  if (score >= 75) return "critical";
  if (score >= 50) return "elevated";
  if (score >= 24) return "watch";
  return "stable";
}

export function priorityTierLabel(tier: PriorityTier): string {
  switch (tier) {
    case "critical":
      return "Critical";
    case "elevated":
      return "Elevated";
    case "watch":
      return "Watch";
    default:
      return "Stable";
  }
}

/** Short line for tooltips / subtitles. */
export function priorityTierHint(tier: PriorityTier): string {
  switch (tier) {
    case "critical":
      return "Act now — multiple severe blockers or imminent exposure.";
    case "elevated":
      return "Above normal — address soon to avoid escalation.";
    case "watch":
      return "Monitor — some gaps or timing pressure.";
    default:
      return "No major blockers flagged by rules.";
  }
}
