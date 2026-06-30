import { buildBrListingMapQuery } from "@/app/lib/clasificados/bienes-raices/brLocationHelpers";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

/** Unbounded digit strip for property prices (not phone `digitsOnly`). */
export function priceDigitsUnbounded(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

export function coercePostalDigits5(raw: string): string {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

export function formatUsdWhole(raw: string | number | null | undefined): string {
  const d = priceDigitsUnbounded(String(raw ?? ""));
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${d}`;
  }
}

const YEAR_BUILT_RE = /^(18|19|20)\d{2}$/;

export function isLikelyYearBuilt(raw: string): boolean {
  const c = raw.replace(/,/g, "").replace(/\s/g, "");
  return YEAR_BUILT_RE.test(c);
}

/** Year built — never comma-formatted (2024 stays 2024). */
export function formatYearBuiltDisplay(raw: string | number | null | undefined): string {
  return trim(String(raw ?? ""));
}

/**
 * Decimal-friendly counts (bedrooms, baths, parking). Small whole numbers stay as entered;
 * large integers get thousands separators. Years must use `formatYearBuiltDisplay`.
 */
export function formatDetailCountDisplay(raw: string | number | null | undefined): string {
  const t = trim(String(raw ?? ""));
  if (!t) return "";
  if (isLikelyYearBuilt(t)) return t.replace(/,/g, "");
  const c = t.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(c)) return t;
  const [intPart, frac] = c.split(".");
  const n = Number(intPart);
  if (!Number.isFinite(n)) return t;
  if (frac === undefined && n < 10000) return c;
  const pretty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  return frac !== undefined ? `${pretty}.${frac}` : pretty;
}

/** Large plain integers with thousands separators (sqft, lot size, etc.). */
export function formatIntegerWithCommas(raw: string | number | null | undefined): string {
  const t = trim(String(raw ?? ""));
  if (!t) return "";
  if (isLikelyYearBuilt(t)) return t.replace(/,/g, "");
  const c = t.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(c)) return t;
  const [intPart, frac] = c.split(".");
  const n = Number(intPart);
  if (!Number.isFinite(n) || n <= 0) return t;
  const pretty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  return frac !== undefined ? `${pretty}.${frac}` : pretty;
}

/** Square-foot display for preview/public (65165165 → 65,165,165 ft²). */
export function formatSqftDisplay(raw: string | number | null | undefined): string {
  const t = trim(String(raw ?? ""));
  if (!t) return "";
  const ftMatch = t.match(/^([\d,.\s]+)\s*(ft²|ft2|sq\.?\s*ft|pies(?:\s+cuadrados)?)?$/i);
  if (ftMatch) {
    const formatted = formatIntegerWithCommas(ftMatch[1]!);
    return formatted ? `${formatted} ft²` : t;
  }
  const formatted = formatIntegerWithCommas(t);
  return formatted ? `${formatted} ft²` : "";
}

/** Normalize persisted or free-text BR size fields for preview/cards. */
export function formatBrSizeFieldDisplay(raw: string): string {
  const t = trim(raw);
  if (!t || t === "—") return t;
  if (/ft²|ft2|sq|pies/i.test(t)) return formatSqftDisplay(t) || t;
  const digitsOnly = t.replace(/\D/g, "");
  if (digitsOnly && /^\d+$/.test(t.replace(/,/g, "").replace(/\s/g, ""))) {
    return formatIntegerWithCommas(t) || t;
  }
  return t;
}

/** Card facet sqft from `detail_pairs` (may be raw digits or already suffixed). */
export function formatBrFacetSqftForCard(raw: string): string {
  const t = trim(raw);
  if (!t) return "—";
  const formatted = formatBrSizeFieldDisplay(t);
  if (formatted && formatted !== "—") return formatted;
  const n = Number(String(t).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n) && n > 0) {
    return formatIntegerWithCommas(String(Math.floor(n))) || t;
  }
  return t.length > 12 ? `${t.slice(0, 12)}…` : t;
}

/** Currency when the field is digits-only; otherwise preserve free text (cap rate, notes). */
export function formatBrOptionalCurrencyDisplay(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const stripped = t.replace(/[\s,$]/g, "");
  if (/^\d+$/.test(stripped)) return formatUsdWhole(stripped) || t;
  return t;
}

/** Street + unit on one line, e.g. `87 N King Rd, Space B`. */
export function formatStreetUnitLine(street: string, unit?: string): string {
  const s = trim(street);
  const u = trim(unit ?? "");
  if (s && u) return `${s}, ${u}`;
  return s || u;
}

/** City line, e.g. `San Jose, CA 95116`. */
export function formatCityStateZip(city: string, state: string, zip: string): string {
  const c = trim(city);
  const st = trim(state);
  const z = coercePostalDigits5(zip);
  const stZip = [st, z].filter(Boolean).join(" ").trim();
  return [c, stZip].filter(Boolean).join(", ");
}

export function formatFullAddress(args: {
  street: string;
  unit?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const streetLine = formatStreetUnitLine(args.street, args.unit);
  const cityLine = formatCityStateZip(args.city ?? "", args.state ?? "", args.zip ?? "");
  return [streetLine, cityLine].filter(Boolean).join(", ");
}

/** Approximate public line: city/state/zip with optional neighborhood context. */
export function formatApproxAddressDisplay(args: {
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const cityLine = formatCityStateZip(args.city ?? "", args.state ?? "", args.zip ?? "");
  const nb = trim(args.neighborhood ?? "");
  if (nb && cityLine) return `${cityLine} · ${nb}`;
  return cityLine || nb;
}

export function buildRealEstateMapQuery(args: {
  exact: boolean;
  street?: string;
  unit?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  legacyStreet?: string;
}): string {
  return buildBrListingMapQuery({
    exact: args.exact,
    street: args.street,
    unit: args.unit,
    neighborhood: args.neighborhood,
    city: args.city,
    state: args.state,
    postal: args.zip,
    country: args.country,
    legacyStreet: args.legacyStreet,
  });
}
