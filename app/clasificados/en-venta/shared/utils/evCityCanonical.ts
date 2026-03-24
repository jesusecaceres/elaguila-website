import { CA_CITIES, CITY_ALIASES } from "@/app/data/locations/norcal";

function stripDiacritics(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toCityKey(raw: string): string {
  return stripDiacritics((raw || "").trim().toLowerCase())
    .replace(/[.,']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEvCity(raw: string): string {
  const key = toCityKey(raw);
  if (!key) return "";
  const fromAlias = (CITY_ALIASES as Record<string, string>)[key];
  if (fromAlias) return fromAlias;
  for (const record of CA_CITIES) {
    if (toCityKey(record.city) === key) return record.city;
    if (record.aliases?.some((a) => toCityKey(a) === key)) return record.city;
  }
  return "";
}
