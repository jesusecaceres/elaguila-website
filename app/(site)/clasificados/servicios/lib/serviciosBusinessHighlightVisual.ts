/**
 * Deterministic emoji for Servicios “business highlights” (preset + custom).
 * No AI / external APIs.
 */

const PRESET_EMOJI: Record<string, string> = {
  bh_free_quote: "💬",
  bh_free_consult: "💬",
  bh_same_day: "⚡",
  bh_emergency: "🚨",
  bh_at_home: "🏠",
  bh_appointment: "📅",
  bh_weekend: "🗓️",
  bh_exp_5y: "⭐",
  bh_family: "👨‍👩‍👧‍👦",
  bh_guarantee: "🛡️",
  bh_license: "📄",
  bh_insured: "✅",
  bh_spanish: "🌎",
  bh_fast_response: "⚡",
};

const BH_PRESET_PREFIX = "bh_preset_";

function extractPresetIdFromDraftId(draftId: string): string | undefined {
  if (draftId.startsWith(BH_PRESET_PREFIX)) return draftId.slice(BH_PRESET_PREFIX.length);
  return undefined;
}

export function resolveServiciosBusinessHighlightVisual(input: { id: string; label: string }): { emoji: string } {
  const preset = extractPresetIdFromDraftId(input.id);
  if (preset && PRESET_EMOJI[preset]) {
    return { emoji: PRESET_EMOJI[preset]! };
  }
  const direct = PRESET_EMOJI[input.id];
  if (direct) return { emoji: direct };
  return { emoji: "✨" };
}
