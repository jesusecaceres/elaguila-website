import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

export function normalizeEvCity(raw: string): string {
  return getCanonicalCityName(raw);
}
