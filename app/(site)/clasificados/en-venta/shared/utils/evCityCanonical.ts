import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

/** Known CA alias → canonical; otherwise trimmed user text. */
export function normalizeEvCity(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return getCanonicalCityName(trimmed) || trimmed;
}
