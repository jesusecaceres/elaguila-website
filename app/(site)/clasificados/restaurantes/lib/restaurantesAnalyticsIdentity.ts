import { restaurantesEngagementListingKey } from "./restaurantesListingEngagement";

export type RestaurantesAnalyticsTrackMeta = {
  listingSlug?: string;
  /** restaurantes_public_listings.id — required for global /api/analytics/events (REST1). */
  sourceId?: string | null;
  engagementListingId?: string | null;
  source?: string;
  [key: string]: unknown;
};

export function restaurantesAnalyticsTrackMeta(args: {
  listingSlug?: string | null;
  sourceId?: string | null;
  engagementListingId?: string | null;
  source: string;
  extra?: Record<string, unknown>;
}): RestaurantesAnalyticsTrackMeta {
  const slug = (args.listingSlug ?? "").trim();
  const sourceId = (args.sourceId ?? "").trim() || undefined;
  const engagementId = (args.engagementListingId ?? "").trim() || sourceId || slug;
  return {
    listingSlug: slug || undefined,
    sourceId,
    engagementListingId: engagementId || undefined,
    source: args.source,
    slug,
    ...(args.extra ?? {}),
  };
}

export function restaurantesListingAnalyticsMetadata(
  slug: string,
  meta?: RestaurantesAnalyticsTrackMeta,
): Record<string, unknown> {
  const s = slug.trim();
  return {
    slug: s,
    ...(meta?.source ? { trackSource: meta.source } : {}),
  };
}

export function restaurantesCanonicalListingAnalyticsId(row: {
  id?: string | null;
  leonix_ad_id?: string | null;
  slug?: string;
}): string {
  return restaurantesEngagementListingKey({
    id: row.id ?? "",
    leonix_ad_id: row.leonix_ad_id ?? null,
  });
}
