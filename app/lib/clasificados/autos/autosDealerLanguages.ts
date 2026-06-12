/** Autos Negocios — dealer languages spoken (Business Hub). Max 3 display labels. */

export const AUTOS_DEALER_LANGUAGE_PRESET_ES = "Español";
export const AUTOS_DEALER_LANGUAGE_PRESET_EN = "English";
export const AUTOS_DEALER_LANGUAGES_MAX = 3;

const PRESET_KEYS = new Set([
  AUTOS_DEALER_LANGUAGE_PRESET_ES.toLowerCase(),
  AUTOS_DEALER_LANGUAGE_PRESET_EN.toLowerCase(),
]);

function draftSafeTrim(raw: string, liveDraft: boolean): string {
  if (liveDraft && raw !== raw.trimEnd()) return raw;
  return raw.trim();
}

function languageKey(label: string): string {
  return label.trim().toLowerCase();
}

export function isAutosDealerPresetLanguage(label: string): boolean {
  return PRESET_KEYS.has(languageKey(label));
}

export function normalizeDealerLanguages(
  raw: unknown,
  opts?: { liveDraft?: boolean },
): string[] {
  if (!Array.isArray(raw)) return [];
  const liveDraft = opts?.liveDraft ?? false;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const label = draftSafeTrim(item, liveDraft);
    if (!label) continue;
    const key = languageKey(label);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label.slice(0, 48));
    if (out.length >= AUTOS_DEALER_LANGUAGES_MAX) break;
  }
  return out;
}

export function dealerLanguagesForOutput(languages: string[] | undefined): string[] {
  return normalizeDealerLanguages(languages);
}

export function toggleAutosDealerPresetLanguage(
  languages: string[] | undefined,
  preset: typeof AUTOS_DEALER_LANGUAGE_PRESET_ES | typeof AUTOS_DEALER_LANGUAGE_PRESET_EN,
): string[] {
  const cur = normalizeDealerLanguages(languages);
  const key = languageKey(preset);
  const i = cur.findIndex((l) => languageKey(l) === key);
  if (i >= 0) return cur.filter((_, j) => j !== i);
  if (cur.length >= AUTOS_DEALER_LANGUAGES_MAX) return cur;
  return [...cur, preset];
}

export type AutosDealerLanguageAddResult =
  | { ok: true; languages: string[] }
  | { ok: false; languages: string[]; reason: "empty" | "duplicate" | "limit" };

export function addAutosDealerCustomLanguage(
  languages: string[] | undefined,
  rawCustom: string,
  opts?: { liveDraft?: boolean },
): AutosDealerLanguageAddResult {
  const cur = normalizeDealerLanguages(languages, opts);
  const custom = draftSafeTrim(rawCustom, opts?.liveDraft ?? false);
  if (!custom) return { ok: false, languages: cur, reason: "empty" };
  const key = languageKey(custom);
  if (cur.some((l) => languageKey(l) === key)) {
    return { ok: false, languages: cur, reason: "duplicate" };
  }
  if (cur.length >= AUTOS_DEALER_LANGUAGES_MAX) {
    return { ok: false, languages: cur, reason: "limit" };
  }
  return { ok: true, languages: [...cur, custom.slice(0, 48)] };
}

export function removeAutosDealerLanguage(languages: string[] | undefined, label: string): string[] {
  const key = languageKey(label);
  return normalizeDealerLanguages(languages).filter((l) => languageKey(l) !== key);
}

export function autosDealerCustomLanguages(languages: string[] | undefined): string[] {
  return normalizeDealerLanguages(languages).filter((l) => !isAutosDealerPresetLanguage(l));
}
