import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

/** Sync display line + canonical NorCal key from CityAutocomplete value. */
export function syncComidaLocalCityFromInput(raw: string): {
  cityDisplay: string;
  cityCanonical: string;
} {
  const cityDisplay = String(raw ?? "").trim();
  const cityCanonical = getCanonicalCityName(cityDisplay);
  return { cityDisplay, cityCanonical };
}

export function resolveComidaLocalCityCanonical(draft: {
  cityCanonical: string;
  cityDisplay: string;
}): string {
  const fromField = draft.cityCanonical.trim();
  if (fromField) return fromField;
  return getCanonicalCityName(draft.cityDisplay.trim());
}
