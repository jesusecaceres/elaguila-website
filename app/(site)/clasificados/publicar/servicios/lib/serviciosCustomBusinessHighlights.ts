import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { chipLabel } from "./businessTypePresets";
import { BUSINESS_HIGHLIGHT_PRESET_CHIPS } from "./businessHighlightPresets";
import {
  BUSINESS_HIGHLIGHT_LABEL_MAX,
  MAX_CUSTOM_BUSINESS_HIGHLIGHTS,
} from "./serviciosHighlightCaps";

/** Case- and accent-insensitive key for duplicate detection. */
export function normalizeBusinessHighlightDedupeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function collectPresetBusinessHighlightKeys(
  state: Pick<ClasificadosServiciosApplicationState, "selectedBusinessHighlightIds">,
  lang: "es" | "en",
): Set<string> {
  const keys = new Set<string>();
  for (const id of state.selectedBusinessHighlightIds) {
    const chip = BUSINESS_HIGHLIGHT_PRESET_CHIPS.find((c) => c.id === id);
    if (!chip) continue;
    keys.add(normalizeBusinessHighlightDedupeKey(chipLabel(chip, lang)));
    keys.add(normalizeBusinessHighlightDedupeKey(chip.es));
    keys.add(normalizeBusinessHighlightDedupeKey(chip.en));
  }
  return keys;
}

export type AddCustomBusinessHighlightResult =
  | { ok: true; label: string }
  | { ok: false; reason: "blank" | "duplicate" | "cap" };

export function tryParseCustomBusinessHighlightLabel(raw: string): string {
  return raw.trim().slice(0, BUSINESS_HIGHLIGHT_LABEL_MAX);
}

export function evaluateAddCustomBusinessHighlight(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
  raw: string,
): AddCustomBusinessHighlightResult {
  const label = tryParseCustomBusinessHighlightLabel(raw);
  if (!label) return { ok: false, reason: "blank" };
  if (state.customBusinessHighlights.length >= MAX_CUSTOM_BUSINESS_HIGHLIGHTS) {
    return { ok: false, reason: "cap" };
  }
  const key = normalizeBusinessHighlightDedupeKey(label);
  if (state.customBusinessHighlights.some((x) => normalizeBusinessHighlightDedupeKey(x) === key)) {
    return { ok: false, reason: "duplicate" };
  }
  const presetKeys = collectPresetBusinessHighlightKeys(state, lang);
  if (presetKeys.has(key)) return { ok: false, reason: "duplicate" };
  return { ok: true, label };
}
