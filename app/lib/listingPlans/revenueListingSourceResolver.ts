/**
 * Package 1 (Gate 3) — canonical, server-owned Revenue OS commercial `listing_source` resolver.
 *
 * Root defect this closes: individual Revenue OS writers independently invented their own
 * `listing_source` literal at write time (e.g. the generic entitlement writer wrote the bare
 * category slug `"servicios"` while the only live reader expected the real table name
 * `"servicios_public_listings"`; the checkout route trusted a client-supplied `body.sourceTable`
 * for consent/attempt-key/business-identity resolution; checkout- and renewal-created
 * `leonix_payment_records` rows never wrote a `listing_source` column at all). This module is
 * the single place that maps a Revenue OS `category` (or `packageKey`) to the one canonical,
 * durable `listing_source` value — every write site must call it instead of inventing its own
 * literal or trusting client input.
 *
 * This does NOT duplicate an existing ownership/routing map — it lives in a different
 * architectural layer on purpose:
 *  - `app/lib/listingIdentity/categoryRouteRegistry.ts` owns the PUBLIC ROUTING contract per its
 *    own stated design (no DB calls, not a payments concern).
 *  - `app/admin/_lib/packageEntitlementConstants.ts` owns the ADMIN UI's dropdown options.
 *  - `app/lib/listingPlans/listingEntitlementOwnership.ts` owns READ-TIME ownership verification
 *    for exactly the four sources the dashboard entitlement endpoint has ever received.
 * None of those import each other today, and this module does not import them either — it is
 * the Revenue OS WRITE-TIME boundary. The literal vocabulary below intentionally matches all
 * three (same durable table names), because they describe the same physical tables. If the
 * canonical table for a category is ever renamed, all four homes must be updated together —
 * that dependency already existed before this module; this module does not create it.
 *
 * Pure read model — no DB, Stripe, or env access (mirrors `revenuePricingMatrix.ts`'s own
 * doctrine), so it is safe to import from both server code and self-test scripts.
 */
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";

/**
 * Canonical `listing_source` for every category currently defined in the Revenue OS pricing
 * matrix (`revenuePricingMatrix.ts`), mirroring the routing registry's per-pipeline
 * `sourceTable` values.
 */
export const CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY: Readonly<Record<string, string>> = {
  autos: "autos_classifieds_listings",
  "bienes-raices": "listings",
  rentas: "listings",
  restaurantes: "restaurantes_public_listings",
  servicios: "servicios_public_listings",
  empleos: "empleos_public_listings",
  "ofertas-locales": "ofertas_locales",
  viajes: "viajes_staged_listings",
  "en-venta": "listings",
  clases: "listings",
  comunidad: "listings",
  "mascotas-y-perdidos": "listings",
  busco: "listings",
  "comida-local": "comida_local_public_listings",
};

/**
 * Read-time-only compatibility aliases: values a category's `listing_package_entitlements` /
 * `leonix_subscription_records` / `leonix_payment_records` rows may have been historically
 * written under BEFORE this resolver existed (typically the bare category slug). Never used to
 * decide what to WRITE — only to keep historical rows readable while new writes converge on the
 * single canonical value above. Extend this list, never remove entries from it, unless a proven
 * backfill has migrated every historical row.
 */
const LEGACY_COMPATIBLE_LISTING_SOURCE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  autos: ["autos"],
  "bienes-raices": ["bienes-raices"],
  rentas: ["rentas"],
  restaurantes: ["restaurantes"],
  servicios: ["servicios"],
  empleos: ["empleos"],
  "ofertas-locales": ["ofertas-locales"],
  viajes: ["viajes"],
  "en-venta": ["en-venta"],
  clases: ["clases"],
  comunidad: ["comunidad"],
  "mascotas-y-perdidos": ["mascotas-y-perdidos"],
  busco: ["busco"],
  "comida-local": ["comida-local"],
};

/** Canonical `listing_source` for a category slug, or `null` for an unrecognized category. */
export function resolveCanonicalListingSourceForCategory(
  category: string | null | undefined,
): string | null {
  const slug = String(category ?? "").trim().toLowerCase();
  if (!slug) return null;
  return CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY[slug] ?? null;
}

/**
 * Canonical `listing_source` for a Revenue OS package key — resolves the package's `category`
 * from the server-owned pricing matrix (never from client input) and maps it to the canonical
 * source. Returns `null` for an unknown package key or a category with no canonical mapping yet.
 */
export function resolveCanonicalListingSourceForPackageKey(
  packageKey: string | null | undefined,
): string | null {
  const key = String(packageKey ?? "").trim().toLowerCase();
  if (!key) return null;
  const def = getRevenuePackageDefinition(key);
  if (!def) return null;
  return resolveCanonicalListingSourceForCategory(def.category);
}

/**
 * Read-time compatibility set (canonical value + every known historical alias) for a category.
 * Write sites must never use this — only `resolveCanonicalListingSourceForCategory` /
 * `resolveCanonicalListingSourceForPackageKey`. Read sites that must remain tolerant of rows
 * written before this resolver existed should query with `.in("listing_source", set)` using
 * this helper instead of a single `.eq(...)`.
 */
export function resolveListingSourceReadCompatibilitySet(
  category: string | null | undefined,
): string[] {
  const slug = String(category ?? "").trim().toLowerCase();
  if (!slug) return [];
  const canonical = CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY[slug];
  const legacy = LEGACY_COMPATIBLE_LISTING_SOURCE_ALIASES[slug] ?? [];
  const set = new Set<string>();
  if (canonical) set.add(canonical);
  for (const alias of legacy) set.add(alias);
  if (set.size === 0 && slug) set.add(slug);
  return [...set];
}
