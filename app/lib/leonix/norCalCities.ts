import type { LeadLang } from "./leadCaptureValidation";

/** Sentinel value for select components (not stored). */
export const NORCAL_OTHER_VALUE = "__norcal_other__";

export const LEONIX_NORCAL_CITIES = [
  "San Jose",
  "Santa Clara",
  "Sunnyvale",
  "Cupertino",
  "Milpitas",
  "Mountain View",
  "Palo Alto",
  "Redwood City",
  "Menlo Park",
  "San Mateo",
  "Daly City",
  "San Francisco",
  "Oakland",
  "Berkeley",
  "Hayward",
  "Fremont",
  "Newark",
  "Union City",
  "San Leandro",
  "Pleasanton",
  "Dublin",
  "Livermore",
  "San Ramon",
  "Walnut Creek",
  "Concord",
  "Antioch",
  "Pittsburg",
  "Brentwood",
  "Richmond",
  "San Rafael",
  "Novato",
  "Petaluma",
  "Santa Rosa",
  "Napa",
  "Vallejo",
  "Fairfield",
  "Vacaville",
  "Santa Cruz",
  "Watsonville",
  "Salinas",
  "Monterey",
  "Seaside",
  "Gilroy",
  "Morgan Hill",
  "Hollister",
  "Stockton",
  "Modesto",
  "Tracy",
  "Manteca",
  "Lodi",
  "Sacramento",
  "Elk Grove",
  "Roseville",
  "Folsom",
  "Davis",
  "Woodland",
  "Chico",
  "Yuba City",
  "Redding",
] as const;

export type LeonixNorCalCity = (typeof LEONIX_NORCAL_CITIES)[number];

const CITY_SET = new Set<string>(LEONIX_NORCAL_CITIES);

export function getNorCalOtherLabel(lang: LeadLang): string {
  return lang === "en" ? "Other Northern California area" : "Otra ciudad del norte de California";
}

export function getNorCalCityPlaceholder(lang: LeadLang): string {
  return lang === "en" ? "Select a Northern California city / area" : "Elige una ciudad / zona del norte de California";
}

export function getNorCalCityOptions(lang: LeadLang): Array<{ value: string; label: string }> {
  return [
    ...LEONIX_NORCAL_CITIES.map((city) => ({ value: city, label: city })),
    { value: NORCAL_OTHER_VALUE, label: getNorCalOtherLabel(lang) },
  ];
}

/** Preserve legacy custom text; map sentinel/other labels to canonical fallback. */
export function normalizeNorCalCityForSubmit(value: string, lang: LeadLang): string {
  const trimmed = String(value ?? "").trim().slice(0, 120);
  if (!trimmed) return "";
  if (trimmed === NORCAL_OTHER_VALUE) return getNorCalOtherLabel(lang);
  if (trimmed === getNorCalOtherLabel("es") || trimmed === getNorCalOtherLabel("en")) {
    return getNorCalOtherLabel(lang);
  }
  if (CITY_SET.has(trimmed)) return trimmed;
  return trimmed;
}

export function formatNorCalCityDisplay(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  return raw || "—";
}
