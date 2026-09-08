/**
 * Owner-QA ⚠️68 — Mascotas country/state structured location.
 *
 * No existing Leonix-wide country/state dataset primitive was found to reuse (the shared
 * Community-family `LocationSection` also uses plain free-text state/country inputs — that is a
 * separate, larger cross-category concern out of scope for this Mascotas-only ticket). This is a
 * small, category-owned dataset: United States gets a real state dropdown; every country stays a
 * structured choice; anything not in the list (including old free-text legacy values) falls back
 * to a preserved, editable "Otro" text field — no data is ever silently dropped or overwritten.
 */

export type MascotasLocationOption = { value: string; labelEs: string; labelEn: string };

/** Sentinel select value for "not one of the known options" — reveals the free-text fallback. */
export const MASCOTAS_LOCATION_OTHER_VALUE = "__otro__";

export const MASCOTAS_COUNTRY_OPTIONS: readonly MascotasLocationOption[] = [
  { value: "United States", labelEs: "Estados Unidos", labelEn: "United States" },
  { value: "Mexico", labelEs: "México", labelEn: "Mexico" },
  { value: "Canada", labelEs: "Canadá", labelEn: "Canada" },
  { value: "El Salvador", labelEs: "El Salvador", labelEn: "El Salvador" },
  { value: "Guatemala", labelEs: "Guatemala", labelEn: "Guatemala" },
  { value: "Honduras", labelEs: "Honduras", labelEn: "Honduras" },
  { value: "Nicaragua", labelEs: "Nicaragua", labelEn: "Nicaragua" },
  { value: "Costa Rica", labelEs: "Costa Rica", labelEn: "Costa Rica" },
  { value: "Panama", labelEs: "Panamá", labelEn: "Panama" },
  { value: "Colombia", labelEs: "Colombia", labelEn: "Colombia" },
  { value: "Peru", labelEs: "Perú", labelEn: "Peru" },
  { value: "Brazil", labelEs: "Brasil", labelEn: "Brazil" },
  { value: "Dominican Republic", labelEs: "República Dominicana", labelEn: "Dominican Republic" },
  { value: "Puerto Rico", labelEs: "Puerto Rico", labelEn: "Puerto Rico" },
  { value: "Spain", labelEs: "España", labelEn: "Spain" },
] as const;

export const MASCOTAS_US_STATE_OPTIONS: readonly MascotasLocationOption[] = [
  { value: "Alabama", labelEs: "Alabama", labelEn: "Alabama" },
  { value: "Alaska", labelEs: "Alaska", labelEn: "Alaska" },
  { value: "Arizona", labelEs: "Arizona", labelEn: "Arizona" },
  { value: "Arkansas", labelEs: "Arkansas", labelEn: "Arkansas" },
  { value: "California", labelEs: "California", labelEn: "California" },
  { value: "Colorado", labelEs: "Colorado", labelEn: "Colorado" },
  { value: "Connecticut", labelEs: "Connecticut", labelEn: "Connecticut" },
  { value: "Delaware", labelEs: "Delaware", labelEn: "Delaware" },
  { value: "Florida", labelEs: "Florida", labelEn: "Florida" },
  { value: "Georgia", labelEs: "Georgia", labelEn: "Georgia" },
  { value: "Hawaii", labelEs: "Hawái", labelEn: "Hawaii" },
  { value: "Idaho", labelEs: "Idaho", labelEn: "Idaho" },
  { value: "Illinois", labelEs: "Illinois", labelEn: "Illinois" },
  { value: "Indiana", labelEs: "Indiana", labelEn: "Indiana" },
  { value: "Iowa", labelEs: "Iowa", labelEn: "Iowa" },
  { value: "Kansas", labelEs: "Kansas", labelEn: "Kansas" },
  { value: "Kentucky", labelEs: "Kentucky", labelEn: "Kentucky" },
  { value: "Louisiana", labelEs: "Luisiana", labelEn: "Louisiana" },
  { value: "Maine", labelEs: "Maine", labelEn: "Maine" },
  { value: "Maryland", labelEs: "Maryland", labelEn: "Maryland" },
  { value: "Massachusetts", labelEs: "Massachusetts", labelEn: "Massachusetts" },
  { value: "Michigan", labelEs: "Míchigan", labelEn: "Michigan" },
  { value: "Minnesota", labelEs: "Minnesota", labelEn: "Minnesota" },
  { value: "Mississippi", labelEs: "Misisipi", labelEn: "Mississippi" },
  { value: "Missouri", labelEs: "Misuri", labelEn: "Missouri" },
  { value: "Montana", labelEs: "Montana", labelEn: "Montana" },
  { value: "Nebraska", labelEs: "Nebraska", labelEn: "Nebraska" },
  { value: "Nevada", labelEs: "Nevada", labelEn: "Nevada" },
  { value: "New Hampshire", labelEs: "Nuevo Hampshire", labelEn: "New Hampshire" },
  { value: "New Jersey", labelEs: "Nueva Jersey", labelEn: "New Jersey" },
  { value: "New Mexico", labelEs: "Nuevo México", labelEn: "New Mexico" },
  { value: "New York", labelEs: "Nueva York", labelEn: "New York" },
  { value: "North Carolina", labelEs: "Carolina del Norte", labelEn: "North Carolina" },
  { value: "North Dakota", labelEs: "Dakota del Norte", labelEn: "North Dakota" },
  { value: "Ohio", labelEs: "Ohio", labelEn: "Ohio" },
  { value: "Oklahoma", labelEs: "Oklahoma", labelEn: "Oklahoma" },
  { value: "Oregon", labelEs: "Oregón", labelEn: "Oregon" },
  { value: "Pennsylvania", labelEs: "Pensilvania", labelEn: "Pennsylvania" },
  { value: "Rhode Island", labelEs: "Rhode Island", labelEn: "Rhode Island" },
  { value: "South Carolina", labelEs: "Carolina del Sur", labelEn: "South Carolina" },
  { value: "South Dakota", labelEs: "Dakota del Sur", labelEn: "South Dakota" },
  { value: "Tennessee", labelEs: "Tennessee", labelEn: "Tennessee" },
  { value: "Texas", labelEs: "Texas", labelEn: "Texas" },
  { value: "Utah", labelEs: "Utah", labelEn: "Utah" },
  { value: "Vermont", labelEs: "Vermont", labelEn: "Vermont" },
  { value: "Virginia", labelEs: "Virginia", labelEn: "Virginia" },
  { value: "Washington", labelEs: "Washington", labelEn: "Washington" },
  { value: "West Virginia", labelEs: "Virginia Occidental", labelEn: "West Virginia" },
  { value: "Wisconsin", labelEs: "Wisconsin", labelEn: "Wisconsin" },
  { value: "Wyoming", labelEs: "Wyoming", labelEn: "Wyoming" },
  { value: "District of Columbia", labelEs: "Distrito de Columbia", labelEn: "District of Columbia" },
] as const;

function normalizeLocationKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Case/accent-insensitive exact match against a known option list (either label works). */
export function findMascotasLocationOption(
  list: readonly MascotasLocationOption[],
  raw: string,
): MascotasLocationOption | null {
  const key = normalizeLocationKey(raw);
  if (!key) return null;
  for (const opt of list) {
    if (
      normalizeLocationKey(opt.value) === key ||
      normalizeLocationKey(opt.labelEs) === key ||
      normalizeLocationKey(opt.labelEn) === key
    ) {
      return opt;
    }
  }
  return null;
}

const US_ALIASES = new Set(["united states", "estados unidos", "usa", "us", "u.s.", "u.s.a.", "united states of america"]);

/** Whether a (possibly legacy free-text) country value should be treated as the United States. */
export function isMascotasUsCountry(raw: string): boolean {
  return US_ALIASES.has(normalizeLocationKey(raw));
}
