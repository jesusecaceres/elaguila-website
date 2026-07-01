import {
  formatLeonixLbPublicLocationLine,
  isLeonixLbUsCountry,
  leonixLbStateMatchesFilter,
  normalizeLeonixLbCountry,
  normalizeLeonixLbStateCode,
  normalizeLeonixLbZip,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";

export type LightweightLocationParams = {
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export function parseLightweightLocationFromSearchParams(sp: URLSearchParams): Required<LightweightLocationParams> {
  return {
    city: (sp.get("city") ?? "").trim(),
    state: normalizeLeonixLbStateCode(sp.get("state")),
    zip: normalizeLeonixLbZip(sp.get("zip")),
    country: normalizeLeonixLbCountry(sp.get("country")),
  };
}

export function parseLightweightBrowseFromSearchParams(sp: URLSearchParams): Required<LightweightLocationParams> & { q: string } {
  return {
    q: (sp.get("q") ?? "").trim(),
    ...parseLightweightLocationFromSearchParams(sp),
  };
}

export function lightweightLocationSearchBlob(parts: {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  extra?: string[];
}): string {
  return [
    parts.city,
    parts.state,
    parts.zip,
    parts.country,
    ...(parts.extra ?? []),
  ]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function lightweightLocationMatchesFilter(
  row: { city?: string | null; state?: string | null; zip?: string | null; country?: string | null },
  filter: LightweightLocationParams,
): boolean {
  const cityNeedle = (filter.city ?? "").trim().toLowerCase();
  if (cityNeedle) {
    const cityHay = String(row.city ?? "").trim().toLowerCase();
    if (!cityHay.includes(cityNeedle)) return false;
  }
  if ((filter.state ?? "").trim() && !leonixLbStateMatchesFilter(row.state ?? undefined, filter.state!)) return false;
  const zipNeedle = normalizeLeonixLbZip(filter.zip);
  if (zipNeedle) {
    const rowZip = normalizeLeonixLbZip(row.zip ?? undefined);
    if (!rowZip || !rowZip.includes(zipNeedle)) return false;
  }
  const countryNeedle = (filter.country ?? "").trim().toLowerCase();
  if (countryNeedle && !isLeonixLbUsCountry(filter.country)) {
    const rowCountry = String(row.country ?? "").trim().toLowerCase();
    if (!rowCountry.includes(countryNeedle)) return false;
  }
  return true;
}

export function formatLightweightPublicLocationLine(opts: {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}): string {
  return formatLeonixLbPublicLocationLine(opts);
}

export function appendLightweightLocationToParams(
  sp: URLSearchParams,
  loc: LightweightLocationParams,
): void {
  if (loc.city?.trim()) sp.set("city", loc.city.trim());
  else sp.delete("city");
  if (loc.state?.trim()) sp.set("state", normalizeLeonixLbStateCode(loc.state));
  else sp.delete("state");
  if (loc.zip?.trim()) sp.set("zip", normalizeLeonixLbZip(loc.zip));
  else sp.delete("zip");
  if (loc.country?.trim()) sp.set("country", normalizeLeonixLbCountry(loc.country));
  else sp.delete("country");
}
