/**
 * State/province/region datasets for countries with a reliable, stable subdivision list (Gate
 * BCO-3R-B.3). Deliberately not global — most of the world's ~249 countries have no single
 * source of truth for first-level subdivisions worth maintaining here. Every coverage flow that
 * uses this file falls back to manual free-text entry when `hasStateProvinceData(countryCode)`
 * is false, per the gate's "searchable selector where reliable data exists; manual fallback
 * everywhere else" rule — this file is an enhancement, never a hard requirement.
 */
export type StateProvinceOption = { code: string; es: string; en: string };

const US_STATES: readonly StateProvinceOption[] = [
  { code: "AL", es: "Alabama", en: "Alabama" }, { code: "AK", es: "Alaska", en: "Alaska" },
  { code: "AZ", es: "Arizona", en: "Arizona" }, { code: "AR", es: "Arkansas", en: "Arkansas" },
  { code: "CA", es: "California", en: "California" }, { code: "CO", es: "Colorado", en: "Colorado" },
  { code: "CT", es: "Connecticut", en: "Connecticut" }, { code: "DE", es: "Delaware", en: "Delaware" },
  { code: "FL", es: "Florida", en: "Florida" }, { code: "GA", es: "Georgia", en: "Georgia" },
  { code: "HI", es: "Hawái", en: "Hawaii" }, { code: "ID", es: "Idaho", en: "Idaho" },
  { code: "IL", es: "Illinois", en: "Illinois" }, { code: "IN", es: "Indiana", en: "Indiana" },
  { code: "IA", es: "Iowa", en: "Iowa" }, { code: "KS", es: "Kansas", en: "Kansas" },
  { code: "KY", es: "Kentucky", en: "Kentucky" }, { code: "LA", es: "Luisiana", en: "Louisiana" },
  { code: "ME", es: "Maine", en: "Maine" }, { code: "MD", es: "Maryland", en: "Maryland" },
  { code: "MA", es: "Massachusetts", en: "Massachusetts" }, { code: "MI", es: "Míchigan", en: "Michigan" },
  { code: "MN", es: "Minnesota", en: "Minnesota" }, { code: "MS", es: "Misisipi", en: "Mississippi" },
  { code: "MO", es: "Misuri", en: "Missouri" }, { code: "MT", es: "Montana", en: "Montana" },
  { code: "NE", es: "Nebraska", en: "Nebraska" }, { code: "NV", es: "Nevada", en: "Nevada" },
  { code: "NH", es: "Nuevo Hampshire", en: "New Hampshire" }, { code: "NJ", es: "Nueva Jersey", en: "New Jersey" },
  { code: "NM", es: "Nuevo México", en: "New Mexico" }, { code: "NY", es: "Nueva York", en: "New York" },
  { code: "NC", es: "Carolina del Norte", en: "North Carolina" }, { code: "ND", es: "Dakota del Norte", en: "North Dakota" },
  { code: "OH", es: "Ohio", en: "Ohio" }, { code: "OK", es: "Oklahoma", en: "Oklahoma" },
  { code: "OR", es: "Oregón", en: "Oregon" }, { code: "PA", es: "Pensilvania", en: "Pennsylvania" },
  { code: "RI", es: "Rhode Island", en: "Rhode Island" }, { code: "SC", es: "Carolina del Sur", en: "South Carolina" },
  { code: "SD", es: "Dakota del Sur", en: "South Dakota" }, { code: "TN", es: "Tennessee", en: "Tennessee" },
  { code: "TX", es: "Texas", en: "Texas" }, { code: "UT", es: "Utah", en: "Utah" },
  { code: "VT", es: "Vermont", en: "Vermont" }, { code: "VA", es: "Virginia", en: "Virginia" },
  { code: "WA", es: "Washington", en: "Washington" }, { code: "WV", es: "Virginia Occidental", en: "West Virginia" },
  { code: "WI", es: "Wisconsin", en: "Wisconsin" }, { code: "WY", es: "Wyoming", en: "Wyoming" },
  { code: "DC", es: "Distrito de Columbia", en: "District of Columbia" }, { code: "PR", es: "Puerto Rico", en: "Puerto Rico" },
];

const MX_STATES: readonly StateProvinceOption[] = [
  { code: "AGU", es: "Aguascalientes", en: "Aguascalientes" }, { code: "BCN", es: "Baja California", en: "Baja California" },
  { code: "BCS", es: "Baja California Sur", en: "Baja California Sur" }, { code: "CAM", es: "Campeche", en: "Campeche" },
  { code: "CHP", es: "Chiapas", en: "Chiapas" }, { code: "CHH", es: "Chihuahua", en: "Chihuahua" },
  { code: "CMX", es: "Ciudad de México", en: "Mexico City" }, { code: "COA", es: "Coahuila", en: "Coahuila" },
  { code: "COL", es: "Colima", en: "Colima" }, { code: "DUR", es: "Durango", en: "Durango" },
  { code: "GUA", es: "Guanajuato", en: "Guanajuato" }, { code: "GRO", es: "Guerrero", en: "Guerrero" },
  { code: "HID", es: "Hidalgo", en: "Hidalgo" }, { code: "JAL", es: "Jalisco", en: "Jalisco" },
  { code: "MEX", es: "Estado de México", en: "State of Mexico" }, { code: "MIC", es: "Michoacán", en: "Michoacán" },
  { code: "MOR", es: "Morelos", en: "Morelos" }, { code: "NAY", es: "Nayarit", en: "Nayarit" },
  { code: "NLE", es: "Nuevo León", en: "Nuevo León" }, { code: "OAX", es: "Oaxaca", en: "Oaxaca" },
  { code: "PUE", es: "Puebla", en: "Puebla" }, { code: "QUE", es: "Querétaro", en: "Querétaro" },
  { code: "ROO", es: "Quintana Roo", en: "Quintana Roo" }, { code: "SLP", es: "San Luis Potosí", en: "San Luis Potosí" },
  { code: "SIN", es: "Sinaloa", en: "Sinaloa" }, { code: "SON", es: "Sonora", en: "Sonora" },
  { code: "TAB", es: "Tabasco", en: "Tabasco" }, { code: "TAM", es: "Tamaulipas", en: "Tamaulipas" },
  { code: "TLA", es: "Tlaxcala", en: "Tlaxcala" }, { code: "VER", es: "Veracruz", en: "Veracruz" },
  { code: "YUC", es: "Yucatán", en: "Yucatán" }, { code: "ZAC", es: "Zacatecas", en: "Zacatecas" },
];

const CA_PROVINCES: readonly StateProvinceOption[] = [
  { code: "AB", es: "Alberta", en: "Alberta" }, { code: "BC", es: "Columbia Británica", en: "British Columbia" },
  { code: "MB", es: "Manitoba", en: "Manitoba" }, { code: "NB", es: "Nuevo Brunswick", en: "New Brunswick" },
  { code: "NL", es: "Terranova y Labrador", en: "Newfoundland and Labrador" }, { code: "NS", es: "Nueva Escocia", en: "Nova Scotia" },
  { code: "NT", es: "Territorios del Noroeste", en: "Northwest Territories" }, { code: "NU", es: "Nunavut", en: "Nunavut" },
  { code: "ON", es: "Ontario", en: "Ontario" }, { code: "PE", es: "Isla del Príncipe Eduardo", en: "Prince Edward Island" },
  { code: "QC", es: "Quebec", en: "Quebec" }, { code: "SK", es: "Saskatchewan", en: "Saskatchewan" },
  { code: "YT", es: "Yukón", en: "Yukon" },
];

/** Country code -> subdivision list. Extend here as new reliable datasets are added. */
export const STATE_PROVINCE_DATA: Readonly<Record<string, readonly StateProvinceOption[]>> = {
  US: US_STATES,
  MX: MX_STATES,
  CA: CA_PROVINCES,
};

export function hasStateProvinceData(countryCode: string | null | undefined): boolean {
  return !!countryCode && countryCode in STATE_PROVINCE_DATA;
}

export function stateProvinceOptions(countryCode: string, lang: "es" | "en"): readonly { value: string; label: string }[] {
  const list = STATE_PROVINCE_DATA[countryCode] ?? [];
  return [...list].map((s) => ({ value: s[lang], label: s[lang] })).sort((a, b) => a.label.localeCompare(b.label, lang === "es" ? "es" : "en"));
}

/** All subdivision display labels for a country, in the active language — used by "select all". */
export function allStateProvinceLabels(countryCode: string, lang: "es" | "en"): readonly string[] {
  return (STATE_PROVINCE_DATA[countryCode] ?? []).map((s) => s[lang]);
}

/**
 * Gate BCO-3R-B.5 — membership check used by validateServiceCoverage to catch a state/province
 * value that doesn't belong to the selected coverage country (e.g. "California" saved while
 * `country = "AL"`). Checked against both ES and EN labels regardless of the active UI language,
 * since a value entered in one language must still validate after a language switch.
 */
export function isKnownStateProvinceLabel(countryCode: string, value: string): boolean {
  const list = STATE_PROVINCE_DATA[countryCode];
  if (!list) return true; // no controlled dataset for this country — manual entry is always allowed
  return list.some((s) => s.es === value || s.en === value);
}
