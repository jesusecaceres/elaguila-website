/**
 * Curated world-language list (Gate BCO-3R-B), same shape/pattern as `countries.ts`. Used for
 * `businessPrimaryLanguage` / `businessAdditionalLanguages` — the business's own real-world
 * operating language, which `types.ts` documents as "global, unconstrained" (a free-form string,
 * not a DB CHECK). This list gives the UI something searchable instead of a bare text box; the
 * `"other"` option keeps the field genuinely unconstrained for any language not listed.
 */
export type LanguageOption = { code: string; es: string; en: string };

export const BUSINESS_LANGUAGES: readonly LanguageOption[] = [
  { code: "es", es: "Español", en: "Spanish" },
  { code: "en", es: "Inglés", en: "English" },
  { code: "pt", es: "Portugués", en: "Portuguese" },
  { code: "fr", es: "Francés", en: "French" },
  { code: "de", es: "Alemán", en: "German" },
  { code: "it", es: "Italiano", en: "Italian" },
  { code: "zh", es: "Chino (mandarín)", en: "Chinese (Mandarin)" },
  { code: "ja", es: "Japonés", en: "Japanese" },
  { code: "ko", es: "Coreano", en: "Korean" },
  { code: "ar", es: "Árabe", en: "Arabic" },
  { code: "hi", es: "Hindi", en: "Hindi" },
  { code: "ru", es: "Ruso", en: "Russian" },
  { code: "vi", es: "Vietnamita", en: "Vietnamese" },
  { code: "tl", es: "Tagalo", en: "Tagalog" },
  { code: "th", es: "Tailandés", en: "Thai" },
  { code: "tr", es: "Turco", en: "Turkish" },
  { code: "pl", es: "Polaco", en: "Polish" },
  { code: "nl", es: "Neerlandés", en: "Dutch" },
  { code: "el", es: "Griego", en: "Greek" },
  { code: "sv", es: "Sueco", en: "Swedish" },
  { code: "he", es: "Hebreo", en: "Hebrew" },
  { code: "id", es: "Indonesio", en: "Indonesian" },
  { code: "ur", es: "Urdu", en: "Urdu" },
  { code: "bn", es: "Bengalí", en: "Bengali" },
  { code: "pa", es: "Panyabí", en: "Punjabi" },
  { code: "ht", es: "Criollo haitiano", en: "Haitian Creole" },
  { code: "sw", es: "Suajili", en: "Swahili" },
  { code: "am", es: "Amárico", en: "Amharic" },
  { code: "fa", es: "Persa (farsi)", en: "Persian (Farsi)" },
  { code: "uk", es: "Ucraniano", en: "Ukrainian" },
  { code: "ro", es: "Rumano", en: "Romanian" },
  { code: "hu", es: "Húngaro", en: "Hungarian" },
  { code: "cs", es: "Checo", en: "Czech" },
  { code: "da", es: "Danés", en: "Danish" },
  { code: "fi", es: "Finés", en: "Finnish" },
  { code: "no", es: "Noruego", en: "Norwegian" },
  { code: "asl", es: "Lengua de señas americana (ASL)", en: "American Sign Language (ASL)" },
  { code: "other", es: "Otro idioma", en: "Other language" },
] as const;

export const BUSINESS_LANGUAGE_CODES: readonly string[] = BUSINESS_LANGUAGES.map((l) => l.code);

export function businessLanguageLabel(code: string, lang: "es" | "en"): string {
  const found = BUSINESS_LANGUAGES.find((l) => l.code === code);
  return found ? found[lang] : code;
}

export function businessLanguagesSortedByLabel(lang: "es" | "en"): readonly LanguageOption[] {
  const real = BUSINESS_LANGUAGES.filter((l) => l.code !== "other");
  const other = BUSINESS_LANGUAGES.find((l) => l.code === "other");
  const sorted = [...real].sort((a, b) => a[lang].localeCompare(b[lang], lang === "es" ? "es" : "en"));
  return other ? [...sorted, other] : sorted;
}
