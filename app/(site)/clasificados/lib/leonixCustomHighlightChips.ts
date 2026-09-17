/**
 * Generic "Agregar otra característica" custom-chip validation — same pattern already proven in
 * Servicios (`evaluateAddCustomAmenityLabel`), generalized so BR/Rentas real-estate highlight
 * surfaces can reuse it instead of building a parallel implementation.
 */

export const CUSTOM_HIGHLIGHT_LABEL_MAX = 40;
export const MAX_CUSTOM_HIGHLIGHTS = 8;

export type AddCustomHighlightOutcome =
  | { ok: true; label: string }
  | { ok: false; reason: "blank" | "duplicate" | "cap" | "standard_collision" };

const DIACRITIC_MARKS_RE = new RegExp("[̀-ͯ]", "g");

function normalizeDedupeKey(v: string): string {
  return v.trim().toLowerCase().normalize("NFD").replace(DIACRITIC_MARKS_RE, "");
}

export function evaluateAddCustomHighlight(params: {
  raw: string;
  /** Values already selected (both canonical preset keys and prior custom entries) — used for
   * dedupe against canonical labels too, so a custom entry can't shadow an existing preset. */
  existingValues: readonly string[];
  /** Canonical preset labels for this surface (e.g. BR_HIGHLIGHT_PRESET_DEFS.map(d => d.label)) —
   * blocks adding a custom chip that just duplicates a standard option. */
  standardLabels: readonly string[];
  max?: number;
}): AddCustomHighlightOutcome {
  const label = params.raw.trim().slice(0, CUSTOM_HIGHLIGHT_LABEL_MAX);
  if (!label) return { ok: false, reason: "blank" };

  const cap = params.max ?? MAX_CUSTOM_HIGHLIGHTS;
  if (params.existingValues.length >= cap) return { ok: false, reason: "cap" };

  const key = normalizeDedupeKey(label);
  if (params.standardLabels.some((s) => normalizeDedupeKey(s) === key)) {
    return { ok: false, reason: "standard_collision" };
  }
  if (params.existingValues.some((v) => normalizeDedupeKey(v) === key)) {
    return { ok: false, reason: "duplicate" };
  }

  return { ok: true, label };
}
