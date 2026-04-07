/**
 * Bienes Raíces — NorCal canonical city (single pipeline for filters + publish).
 * Reuses the global location foundation; do not duplicate city lists here.
 *
 * @see CA_CITIES / CITY_ALIASES in `@/app/data/locations/norcal`
 * @see CityAutocomplete + getCanonicalCityName in `@/app/data/locations/californiaLocationHelpers`
 */

export { getCanonicalCityName as brCanonicalNorCalCity } from "@/app/data/locations/californiaLocationHelpers";

/** URL query key for canonical city on BR results (aligned with listing field `ciudad`). */
export const BR_URL_QUERY_CIUDAD = "ciudad" as const;
