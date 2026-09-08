/**
 * BR Negocio + Rentas Negocio — shared preset catalog and string<->chip adapter for the shared
 * LanguagesInput primitive (`@/app/components/forms/LanguagesInput`).
 *
 * Both categories store spoken languages as a single free-text string field (`agenteIdiomas`,
 * `negocioIdiomas`) — this adapter is additive-only: it never changes that storage shape. It just
 * parses the string into recognized preset keys + leftover custom entries for the chip UI, and
 * serializes the chip selection back into the same comma-separated string format on save.
 */

export type BrRentasLanguagePresetKey = "es" | "en" | "otro";

export const BR_RENTAS_LANGUAGE_OTHER_KEY: BrRentasLanguagePresetKey = "otro";

const BR_RENTAS_LANGUAGE_PRESETS: {
  key: BrRentasLanguagePresetKey;
  labelEs: string;
  labelEn: string;
  aliases: string[];
}[] = [
  { key: "es", labelEs: "Español", labelEn: "Spanish", aliases: ["español", "espanol", "spanish"] },
  { key: "en", labelEs: "Inglés", labelEn: "English", aliases: ["inglés", "ingles", "english"] },
  { key: "otro", labelEs: "Otro", labelEn: "Other", aliases: [] },
];

export function brRentasLanguageChipOptions(lang: "es" | "en"): { key: string; label: string }[] {
  return BR_RENTAS_LANGUAGE_PRESETS.map((p) => ({ key: p.key, label: lang === "es" ? p.labelEs : p.labelEn }));
}

function presetKeyForToken(token: string): BrRentasLanguagePresetKey | null {
  const norm = token.trim().toLowerCase();
  if (!norm) return null;
  for (const p of BR_RENTAS_LANGUAGE_PRESETS) {
    if (p.key === "otro") continue;
    if (p.aliases.includes(norm)) return p.key;
  }
  return null;
}

/** Splits the stored comma-separated string into recognized preset keys + leftover custom entries. */
export function parseBrRentasLanguagesString(raw: string): { selectedKeys: string[]; customValues: string[] } {
  const tokens = String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const selected = new Set<string>();
  const custom: string[] = [];
  for (const token of tokens) {
    const key = presetKeyForToken(token);
    if (key) selected.add(key);
    else custom.push(token);
  }
  if (custom.length) selected.add(BR_RENTAS_LANGUAGE_OTHER_KEY);
  return { selectedKeys: [...selected], customValues: custom };
}

/** Serializes preset selection + custom entries back into the same comma-separated string format. */
export function serializeBrRentasLanguagesString(
  selectedKeys: string[],
  customValues: string[],
  lang: "es" | "en",
): string {
  const parts: string[] = [];
  for (const p of BR_RENTAS_LANGUAGE_PRESETS) {
    if (p.key === "otro") continue;
    if (selectedKeys.includes(p.key)) parts.push(lang === "es" ? p.labelEs : p.labelEn);
  }
  parts.push(...customValues);
  return parts.join(", ");
}
