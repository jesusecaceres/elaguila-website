import { chipLabel, getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { CUSTOM_CHIP_MAX_LENGTH, MAX_CUSTOM_SERVICES_OFFERED } from "./serviciosSelectionCaps";

/** Case- and accent-insensitive key for duplicate detection. */
export function normalizeServiceOfferedDedupeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Labels (es + en + current chip label) for all suggested services on the current preset. */
export function collectPresetServiceOfferedKeys(
  state: Pick<ClasificadosServiciosApplicationState, "businessTypeId">,
  lang: "es" | "en",
): Set<string> {
  const preset = getBusinessTypePreset(state.businessTypeId);
  const keys = new Set<string>();
  if (!preset) return keys;
  for (const c of preset.suggestedServices) {
    keys.add(normalizeServiceOfferedDedupeKey(c.es));
    keys.add(normalizeServiceOfferedDedupeKey(c.en));
    keys.add(normalizeServiceOfferedDedupeKey(chipLabel(c, lang)));
  }
  return keys;
}

export type AddCustomServiceOfferedResult =
  | { ok: true; label: string }
  | { ok: false; reason: "blank" | "duplicate" | "cap" };

export function tryParseCustomServiceOfferedLabel(raw: string): string {
  return raw.trim().slice(0, CUSTOM_CHIP_MAX_LENGTH);
}

export function evaluateAddCustomServiceOffered(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
  raw: string,
): AddCustomServiceOfferedResult {
  const label = tryParseCustomServiceOfferedLabel(raw);
  if (!label) return { ok: false, reason: "blank" };
  if (state.customServicesOffered.length >= MAX_CUSTOM_SERVICES_OFFERED) {
    return { ok: false, reason: "cap" };
  }
  const key = normalizeServiceOfferedDedupeKey(label);
  if (state.customServicesOffered.some((x) => normalizeServiceOfferedDedupeKey(x) === key)) {
    return { ok: false, reason: "duplicate" };
  }
  const presetKeys = collectPresetServiceOfferedKeys(state, lang);
  if (presetKeys.has(key)) return { ok: false, reason: "duplicate" };
  return { ok: true, label };
}
