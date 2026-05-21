import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

/** Match listing city against filter using NorCal canonical names when possible. */
export function mascotasPerdidosCityMatches(rowCity: string | null | undefined, filterCity: string): boolean {
  const raw = filterCity.trim();
  if (!raw) return true;
  const needle = (getCanonicalCityName(raw) || raw).toLowerCase();
  const hay = (getCanonicalCityName(String(rowCity ?? "")) || String(rowCity ?? "").trim()).toLowerCase();
  if (!hay) return false;
  return hay.includes(needle) || needle.includes(hay);
}
