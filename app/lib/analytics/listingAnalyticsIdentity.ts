/**
 * Gate G2A — Global listing/ad analytics identity contract (types + pure helpers).
 * Runtime writes and dashboard reads adopt this in later gates (G2B+).
 */

import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";

export type { ListingAnalyticsEventType };

/** Published listing tables that participate in the global analytics pipeline. */
export const LISTING_ANALYTICS_SOURCE_TABLES = [
  "listings",
  "autos_classifieds_listings",
  "empleos_public_listings",
  "servicios_public_listings",
  "restaurantes_public_listings",
  "comida_local_public_listings",
  "viajes_staged_listings",
] as const;

export type ListingAnalyticsSourceTable = (typeof LISTING_ANALYTICS_SOURCE_TABLES)[number];

/** Hub / dashboard category keys (open set — string allowed on identity). */
export const LISTING_ANALYTICS_CATEGORIES = [
  "en-venta",
  "rentas",
  "autos",
  "empleos",
  "bienes-raices",
  "servicios",
  "restaurantes",
  "travel",
  "viajes",
  "comunidad",
  "clases",
  "busco",
  "mascotas-y-perdidos",
  "comida-local",
] as const;

export type ListingAnalyticsCategory = (typeof LISTING_ANALYTICS_CATEGORIES)[number] | string;

/** Tables where public identity is commonly addressed by slug. */
const SLUG_PRIMARY_SOURCE_TABLES = new Set<ListingAnalyticsSourceTable>([
  "servicios_public_listings",
  "restaurantes_public_listings",
  "empleos_public_listings",
  "comida_local_public_listings",
]);

export type ListingAnalyticsIdentity = {
  canonicalAdId: string;
  sourceTable: ListingAnalyticsSourceTable | string;
  sourceId: string;
  category: string;
  ownerUserId: string;
  publicUrl?: string;
  detailUrl?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Mirrors listing_analytics.listing_id / saved_listings.listing_id during transition. */
  legacyListingId?: string;
  leonixAdId?: string;
  slug?: string;
};

export type BuildCanonicalAdIdInput = {
  sourceTable: ListingAnalyticsSourceTable | string;
  sourceId: string;
  leonixAdId?: string | null;
  slug?: string | null;
};

function trimOrEmpty(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function isSlugPrimarySourceTable(sourceTable: string): boolean {
  return SLUG_PRIMARY_SOURCE_TABLES.has(sourceTable as ListingAnalyticsSourceTable);
}

/**
 * Canonical analytics key for listing_analytics.listing_id / canonical_ad_id.
 * 1. leonix_ad_id when present
 * 2. slug when source table is slug-primary and slug is stable
 * 3. `${sourceTable}:${sourceId}`
 */
export function buildCanonicalAdId(input: BuildCanonicalAdIdInput): string {
  const sourceTable = trimOrEmpty(input.sourceTable);
  const sourceId = trimOrEmpty(input.sourceId);
  const leonix = trimOrEmpty(input.leonixAdId);
  const slug = trimOrEmpty(input.slug);

  if (leonix) return leonix;
  if (slug && isSlugPrimarySourceTable(sourceTable)) return slug;
  if (!sourceTable || !sourceId) return "";
  return `${sourceTable}:${sourceId}`;
}

/**
 * Unique keys for dashboard rollups (matches collectOwnerListingKeysForAnalytics intent).
 */
export function buildAnalyticsKeySet(identity: ListingAnalyticsIdentity): string[] {
  const keys = new Set<string>();
  const add = (v: string | null | undefined) => {
    const t = trimOrEmpty(v);
    if (t) keys.add(t);
  };

  add(identity.canonicalAdId);
  add(identity.sourceId);
  add(identity.legacyListingId);
  add(identity.leonixAdId);
  add(identity.slug);

  const st = trimOrEmpty(
    typeof identity.sourceTable === "string" ? identity.sourceTable : String(identity.sourceTable),
  );
  const sid = trimOrEmpty(identity.sourceId);
  if (st && sid) add(`${st}:${sid}`);

  return [...keys];
}

/** Fill canonicalAdId and legacyListingId when omitted. */
export function normalizeListingAnalyticsIdentity(
  partial: Omit<ListingAnalyticsIdentity, "canonicalAdId"> & { canonicalAdId?: string },
): ListingAnalyticsIdentity {
  const sourceTable = trimOrEmpty(
    typeof partial.sourceTable === "string" ? partial.sourceTable : String(partial.sourceTable),
  );
  const sourceId = trimOrEmpty(partial.sourceId);
  const canonicalAdId =
    trimOrEmpty(partial.canonicalAdId) ||
    buildCanonicalAdId({
      sourceTable,
      sourceId,
      leonixAdId: partial.leonixAdId,
      slug: partial.slug,
    });

  return {
    ...partial,
    sourceTable: partial.sourceTable,
    sourceId,
    category: trimOrEmpty(partial.category),
    ownerUserId: trimOrEmpty(partial.ownerUserId),
    canonicalAdId,
    legacyListingId: trimOrEmpty(partial.legacyListingId) || canonicalAdId,
  };
}

export function isListingAnalyticsSourceTable(v: string): v is ListingAnalyticsSourceTable {
  return (LISTING_ANALYTICS_SOURCE_TABLES as readonly string[]).includes(v);
}
