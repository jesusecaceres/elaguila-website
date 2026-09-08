import { chipLabel, getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { CUSTOM_CHIP_MAX_LENGTH, MAX_CUSTOM_QUICK_FACTS } from "./serviciosSelectionCaps";
import { isJunkServiciosQuickFactLabel } from "./serviciosContactVisibility";

/** Case- and accent-insensitive key for duplicate detection. */
export function normalizeQuickFactDedupeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Labels (es + en + current chip label) for all preset quick facts on the current business type. */
export function collectPresetQuickFactKeys(
  state: Pick<ClasificadosServiciosApplicationState, "businessTypeId">,
  lang: "es" | "en",
): Set<string> {
  const preset = getBusinessTypePreset(state.businessTypeId);
  const keys = new Set<string>();
  if (!preset) return keys;
  for (const c of preset.quickFacts) {
    keys.add(normalizeQuickFactDedupeKey(c.es));
    keys.add(normalizeQuickFactDedupeKey(c.en));
    keys.add(normalizeQuickFactDedupeKey(chipLabel(c, lang)));
  }
  return keys;
}

export type AddCustomQuickFactResult =
  | { ok: true; label: string }
  | { ok: false; reason: "blank" | "duplicate" | "cap" };

export function tryParseCustomQuickFactLabel(raw: string): string {
  return raw.trim().slice(0, CUSTOM_CHIP_MAX_LENGTH);
}

/**
 * Multiple free-text Quick Facts are addable, independent of the preset selection cap
 * (mirrors `evaluateAddCustomServiceOffered`) — fixes the "single custom slot" defect.
 */
export function evaluateAddCustomQuickFact(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
  raw: string,
): AddCustomQuickFactResult {
  const label = tryParseCustomQuickFactLabel(raw);
  if (!label) return { ok: false, reason: "blank" };
  if (isJunkServiciosQuickFactLabel(label)) return { ok: false, reason: "blank" };
  if (state.customQuickFacts.length >= MAX_CUSTOM_QUICK_FACTS) {
    return { ok: false, reason: "cap" };
  }
  const key = normalizeQuickFactDedupeKey(label);
  if (state.customQuickFacts.some((x) => normalizeQuickFactDedupeKey(x) === key)) {
    return { ok: false, reason: "duplicate" };
  }
  const presetKeys = collectPresetQuickFactKeys(state, lang);
  if (presetKeys.has(key)) return { ok: false, reason: "duplicate" };
  return { ok: true, label };
}
