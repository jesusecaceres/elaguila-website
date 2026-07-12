import {
  formatLeonixLbPublicLocationLine,
  isLeonixLbUsCountry,
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
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

export type LocationUrlSanitizeOpts = {
  /** URL already contained a `state` param (even CA). */
  urlHadState?: boolean;
  /** URL already contained a `country` param (even United States). */
  urlHadCountry?: boolean;
  /** User changed state on the form since load/reset. */
  stateTouched?: boolean;
  /** User changed country on the form since load/reset. */
  countryTouched?: boolean;
};

/** Omit display-only defaults (CA / United States) unless explicitly in URL or user-touched. */
export function sanitizeLocationParamsForUrl(
  loc: { q?: string; city?: string; state?: string; zip?: string; country?: string },
  opts: LocationUrlSanitizeOpts = {},
): { q?: string; city?: string; state?: string; zip?: string; country?: string } {
  const out: { q?: string; city?: string; state?: string; zip?: string; country?: string } = {};
  const q = (loc.q ?? "").trim();
  if (q) out.q = q;
  const city = (loc.city ?? "").trim();
  if (city) out.city = city;
  const zip = (loc.zip ?? "").trim();
  if (zip) out.zip = zip;

  const state = (loc.state ?? "").trim();
  if (state) {
    const emit = Boolean(opts.stateTouched || opts.urlHadState || state !== LEONIX_LB_DEFAULT_STATE);
    if (emit) out.state = state;
  }

  const country = (loc.country ?? "").trim();
  if (country) {
    const emit = Boolean(opts.countryTouched || opts.urlHadCountry || country !== LEONIX_LB_DEFAULT_COUNTRY);
    if (emit) out.country = country;
  }

  return out;
}

/** Active URL params only — no display defaults injected. */
export function activeLocationParamsFromSearchParams(sp: URLSearchParams): LightweightLocationParams & { q?: string } {
  const out: LightweightLocationParams & { q?: string } = {};
  const q = (sp.get("q") ?? "").trim();
  if (q) out.q = q;
  const city = (sp.get("city") ?? "").trim();
  if (city) out.city = city;
  if (sp.has("state")) {
    const state = (sp.get("state") ?? "").trim();
    if (state) out.state = state;
  }
  const zip = (sp.get("zip") ?? "").trim();
  if (zip) out.zip = zip;
  if (sp.has("country")) {
    const country = (sp.get("country") ?? "").trim();
    if (country) out.country = country;
  }
  return out;
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
