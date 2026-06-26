/** Client-safe labels for Leonix moderation UI (no secrets). */

export const RECOMMENDED_ACTION_LABELS: Record<string, string> = {
  approve: "Looks safe — admin may clear/review.",
  review_manually: "Review manually before approving.",
  contact_seller: "Contact seller for verification.",
  request_more_info: "Ask seller for more information.",
  edit_listing: "Edit listing before approving.",
  archive: "Archive if seller cannot verify.",
  remove_listing: "Remove listing if policy violation is confirmed.",
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  critical: "Critical risk",
};

export function formatRecommendedAction(action: string | null | undefined): string | null {
  if (!action?.trim()) return null;
  return RECOMMENDED_ACTION_LABELS[action.trim()] ?? action.trim();
}

export function formatRiskLevel(risk: string | null | undefined): string | null {
  if (!risk?.trim()) return null;
  return RISK_LEVEL_LABELS[risk.trim()] ?? risk.trim();
}

export function formatFlagList(flags: string[] | null | undefined, max = 4): string | null {
  if (!flags?.length) return null;
  const shown = flags.slice(0, max);
  const extra = flags.length > max ? ` +${flags.length - max} more` : "";
  return shown.join(", ") + extra;
}

export const AI_REVIEW_ADVISORY_COPY =
  "AI review stores a recommendation and reason only. It does not automatically remove, approve, or clear this listing.";
