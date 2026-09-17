/**
 * Region shortcuts for multi-country service coverage (Gate BCO-3R-B.3). A UX helper only — the
 * persisted contract always stores real ISO 3166-1 alpha-2 country codes (see
 * `ServiceCoverageV1.countriesServedCodes` in `types.ts`); a region code is never stored as a
 * substitute for the countries it expands to.
 *
 * Classification rule (documented per the gate's "no duplicate country across conflicting
 * shortcuts without a documented rule" requirement): every real ISO code in `COUNTRIES` is
 * assigned to exactly one region below, following the UN geoscheme with two deliberate
 * deviations made for business/CRM familiarity rather than strict geography: (1) Turkey (`TR`)
 * and Egypt (`EG`) are grouped under Middle East rather than Europe/Africa; (2) Caucasus states
 * (`AM`, `AZ`, `GE`) are grouped under Asia rather than Europe. Uninhabited/dependent
 * Antarctic-adjacent territories are grouped with their nearest populated-region convention
 * (e.g. `AQ`/`HM` with Oceania, `BV`/`TF` with Africa, `GS` with South America) purely so every
 * real country code resolves to exactly one shortcut — none of this affects validation, which
 * only checks against the authoritative `COUNTRY_CODES` list in `countries.ts`.
 */
export type RegionCode =
  | "north_america"
  | "central_america"
  | "caribbean"
  | "south_america"
  | "europe"
  | "africa"
  | "middle_east"
  | "asia"
  | "oceania";

export type Region = { code: RegionCode; es: string; en: string; countryCodes: readonly string[] };

export const REGIONS: readonly Region[] = [
  { code: "north_america", es: "Norteamérica", en: "North America", countryCodes: ["BM", "CA", "GL", "MX", "PM", "US"] },
  { code: "central_america", es: "Centroamérica", en: "Central America", countryCodes: ["BZ", "CR", "GT", "HN", "NI", "PA", "SV"] },
  {
    code: "caribbean",
    es: "Caribe",
    en: "Caribbean",
    countryCodes: [
      "AG", "AI", "AW", "BB", "BL", "BQ", "BS", "CU", "CW", "DM", "DO", "GD", "GP", "HT", "JM", "KN", "KY", "LC",
      "MF", "MQ", "MS", "PR", "SX", "TC", "TT", "VC", "VG", "VI",
    ],
  },
  {
    code: "south_america",
    es: "Sudamérica",
    en: "South America",
    countryCodes: ["AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GS", "GY", "PE", "PY", "SR", "UY", "VE"],
  },
  {
    code: "europe",
    es: "Europa",
    en: "Europe",
    countryCodes: [
      "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FO", "FR",
      "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
      "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ", "SK", "SM", "UA", "VA",
    ],
  },
  {
    code: "africa",
    es: "África",
    en: "Africa",
    countryCodes: [
      "AO", "BF", "BI", "BJ", "BV", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ", "EH", "ER", "ET", "GA",
      "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA",
      "NE", "NG", "RE", "RW", "SC", "SD", "SH", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TF", "TG", "TN", "TZ",
      "UG", "YT", "ZA", "ZM", "ZW",
    ],
  },
  {
    code: "middle_east",
    es: "Medio Oriente",
    en: "Middle East",
    countryCodes: ["AE", "BH", "EG", "IL", "IQ", "IR", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "TR", "YE"],
  },
  {
    code: "asia",
    es: "Asia",
    en: "Asia",
    countryCodes: [
      "AF", "AM", "AZ", "BD", "BN", "BT", "CN", "GE", "HK", "ID", "IN", "IO", "JP", "KG", "KH", "KP", "KR", "KZ",
      "LA", "LK", "MM", "MN", "MO", "MV", "MY", "NP", "PH", "PK", "SG", "TH", "TJ", "TL", "TM", "TW", "UZ", "VN",
    ],
  },
  {
    code: "oceania",
    es: "Oceanía",
    en: "Oceania",
    countryCodes: [
      "AQ", "AS", "AU", "CC", "CK", "CX", "FJ", "FM", "GU", "HM", "KI", "MH", "MP", "NC", "NF", "NR", "NU", "NZ",
      "PF", "PG", "PN", "PW", "SB", "TK", "TO", "TV", "UM", "VU", "WF", "WS",
    ],
  },
] as const;

export function regionLabel(code: string, lang: "es" | "en"): string {
  const found = REGIONS.find((r) => r.code === code);
  return found ? found[lang] : code;
}

/** Regions sorted by the active language's label — for display only, never for storage order. */
export function regionsSortedByLabel(lang: "es" | "en"): readonly Region[] {
  return [...REGIONS].sort((a, b) => a[lang].localeCompare(b[lang], lang === "es" ? "es" : "en"));
}

export function countryCodesForRegion(code: string): readonly string[] {
  return REGIONS.find((r) => r.code === code)?.countryCodes ?? [];
}
