/**
 * Deterministic, pure normalization functions for the Business Identity core.
 * No I/O, no randomness (except explicit slug-suffix helpers), no fabrication —
 * an invalid input returns null rather than being coerced into a different value.
 */
import { CONTACT_TYPES } from "./constants";
import type { ContactType } from "./types";

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** Display-safe trim/collapse only — preserves accents and original casing. */
export function normalizeDisplayText(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  return collapseWhitespace(value);
}

/** Comparison-only form: lowercased, accents stripped, whitespace collapsed. Never shown to users. */
export function normalizeComparisonName(value: string | null | undefined): string {
  const display = normalizeDisplayText(value);
  if (!display) return "";
  return display
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const SLUG_UNSAFE_CHARS = /[^a-z0-9]+/g;

/** Base slug candidate from a display name. Caller is responsible for uniqueness suffixing. */
export function slugBaseFromDisplayName(displayName: string | null | undefined): string | null {
  const comparison = normalizeComparisonName(displayName);
  if (!comparison) return null;
  const slug = comparison.replace(SLUG_UNSAFE_CHARS, "-").replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : null;
}

/**
 * Normalizes a phone number to digits-only comparison form, preserving a leading "+" if present.
 * Returns null for input with no digits at all — never fabricates a number.
 */
export function normalizePhone(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) return null;
  return hasLeadingPlus ? `+${digits}` : digits;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercase/trim only; returns null if the value doesn't look like an email at all. */
export function normalizeEmail(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !EMAIL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/** Strips scheme/path/query/fragment and a leading "www.", returns the bare registrable-ish domain. */
export function normalizeWebsiteDomain(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let host: string;
  try {
    host = new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;
  return host.startsWith("www.") ? host.slice(4) : host;
}

/** Normalizes a raw website value for storage as `value` — keeps a display-safe https URL when possible. */
export function normalizeWebsiteDisplayValue(value: string | null | undefined): string | null {
  const domain = normalizeWebsiteDomain(value);
  if (!domain) return null;
  return `https://${domain}`;
}

/** Routes to the correct normalizer by contact_type; returns null for an unsupported type or invalid value. */
export function normalizeContactValue(
  contactType: ContactType,
  rawValue: string | null | undefined,
): { value: string; normalizedValue: string } | null {
  if (!CONTACT_TYPES.includes(contactType)) return null;
  if (contactType === "phone") {
    const normalized = normalizePhone(rawValue);
    if (!normalized) return null;
    return { value: typeof rawValue === "string" ? rawValue.trim() : normalized, normalizedValue: normalized };
  }
  if (contactType === "email") {
    const normalized = normalizeEmail(rawValue);
    if (!normalized) return null;
    return { value: normalized, normalizedValue: normalized };
  }
  const display = normalizeWebsiteDisplayValue(rawValue);
  const domain = normalizeWebsiteDomain(rawValue);
  if (!display || !domain) return null;
  return { value: display, normalizedValue: domain };
}

/** Comparison form for a free-text service area / city — trim, collapse, lowercase, strip accents. */
export function normalizeServiceAreaText(value: string | null | undefined): string | null {
  const comparison = normalizeComparisonName(value);
  return comparison.length > 0 ? comparison : null;
}

const KNOWN_LISTING_SOURCES = new Set(["listings", "restaurantes_public_listings", "servicios_public_listings", "autos_classifieds_listings"]);

/** Does not validate against the live ownership contract (see listingLinking.ts) — only checks shape/known-set membership. */
export function normalizeListingSource(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return KNOWN_LISTING_SOURCES.has(trimmed) ? trimmed : null;
}

/** listing_id is stored as text in business_listing_links regardless of the underlying column's real type. */
export function normalizeListingId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** A draft intent_key is caller-supplied (client-generated per new-business attempt) — only shape-validated here. */
export function normalizeDraftIntentKey(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 128) return null;
  return trimmed;
}
