/**
 * Saved Search 02 — deterministic canonicalization + fingerprinting, shared by every category.
 *
 * The fingerprint must be identical for two searches a user would consider "the same," and
 * different whenever the actual match semantics differ — never influenced by object-key
 * insertion order, incidental whitespace, UI-only state, pagination, or sort order.
 */
import { createHash } from "node:crypto";
import { normalizeLocationKey } from "@/app/data/locations/californiaLocationHelpers";
import type { SavedSearchNormalizedInput } from "./savedSearchTypes";

/**
 * Recursively sorts object keys and canonicalizes primitives so structurally-equal values always
 * serialize identically regardless of construction order.
 *
 * Arrays are canonicalized element-wise but their OWN order is never touched here — order can be
 * semantically meaningful (e.g. a priority-ordered list of amenities) and only the category
 * adapter building `filterPayload` knows whether a given array field is truly an unordered set.
 * An adapter for an order-independent array field must sort it itself before it reaches this
 * function (e.g. `[...tags].sort()`); this layer does not guess on the adapter's behalf.
 */
function canonicalizeValue(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue).filter((v) => v !== undefined);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = canonicalizeValue((value as Record<string, unknown>)[key]);
      // Omit undefined / empty-string / empty-object entries entirely: an absent facet and a
      // facet explicitly set to "no preference" must fingerprint identically, and never as a
      // fabricated real value.
      if (v === undefined) continue;
      if (v === "") continue;
      if (typeof v === "object" && v !== null && !Array.isArray(v) && Object.keys(v).length === 0) continue;
      out[key] = v;
    }
    return out;
  }
  if (typeof value === "number") {
    // Normalize -0 and any float noise for a truly numeric field; callers should already be
    // passing whole numbers (price/mileage/year are all integers in every current category).
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
}

/** Deterministic string sort key for a stable JSON serialization (used only for the fingerprint
 * input, never for display). */
function stableStringify(value: unknown): string {
  const v = canonicalizeValue(value);
  if (v === undefined) return "null";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
}

/** Canonicalizes a normalized search: trims strings, lowercases/slugifies category, normalizes
 * city text consistently (same key-normalization the rest of Leonix uses for city matching —
 * `normalizeLocationKey`), rounds prices to whole numbers, and deep-canonicalizes `filterPayload`
 * (dropping empty/undefined facets so "not set" always looks the same regardless of how the
 * caller constructed the object). */
export function canonicalizeSavedSearch(input: SavedSearchNormalizedInput): SavedSearchNormalizedInput {
  const category = input.category.trim().toLowerCase().replace(/\s+/g, "-");
  const city = normalizeLocationKey(input.city ?? "");
  const minPrice = input.minPrice != null && Number.isFinite(input.minPrice) ? Math.trunc(input.minPrice) : null;
  const maxPrice = input.maxPrice != null && Number.isFinite(input.maxPrice) ? Math.trunc(input.maxPrice) : null;
  const filterPayload = (canonicalizeValue(input.filterPayload ?? {}) as Record<string, unknown>) ?? {};
  return { category, city, minPrice, maxPrice, filterPayload };
}

/** The exact fields that participate in the fingerprint — category + city + min/max price +
 * filterPayload, per the canonical contract documented on `saved_searches.fingerprint`. Adding a
 * future first-class matching field means adding it here (and to `SavedSearchNormalizedInput`),
 * never smuggling it into `filterPayload` as a workaround. */
export function buildSavedSearchFingerprintInput(canonical: SavedSearchNormalizedInput): string {
  return stableStringify({
    category: canonical.category,
    city: canonical.city,
    minPrice: canonical.minPrice,
    maxPrice: canonical.maxPrice,
    filterPayload: canonical.filterPayload,
  });
}

/** SHA-256 hex digest of the canonical fingerprint input — deterministic, collision-resistant,
 * no secret material involved (this hashes the search criteria, not anything sensitive). Safe to
 * store as `saved_searches.fingerprint` and to compare directly against the `legacy:<id>`
 * compatibility placeholder (never equal to it — that prefix isn't valid hex). */
export function buildSavedSearchFingerprint(input: SavedSearchNormalizedInput): string {
  const canonical = canonicalizeSavedSearch(input);
  const fingerprintInput = buildSavedSearchFingerprintInput(canonical);
  return createHash("sha256").update(fingerprintInput).digest("hex");
}
