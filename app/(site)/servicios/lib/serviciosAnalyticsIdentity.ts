/**
 * Servicios analytics identity — global seller analytics read from `listing_analytics`.
 *
 * Canonical `listing_analytics.listing_id` (both professional + standard pipelines):
 *   1. `leonix_ad_id` when present (e.g. SERV-2026-000001)
 *   2. else row UUID `id`
 *   3. else public `slug` (dev-only fallback)
 *
 * Always pass `category: "servicios"`, `owner_user_id` when known, and `metadata.slug` for public URL.
 * Alias keys (`leonix_ad_id`, `id`, `slug`) remain in owner dashboard queries via `serviciosLikeCountAliasKeys`.
 */
import {
  serviciosEngagementListingKey,
  serviciosLikeCountAliasKeys,
} from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";

export type ServiciosAnalyticsListingRow = {
  leonix_ad_id?: string | null;
  id?: string | null;
  slug: string;
  owner_user_id?: string | null;
};

/** Canonical key written to `listing_analytics.listing_id` for new Servicios events. */
export function serviciosCanonicalListingAnalyticsId(
  row: Pick<ServiciosAnalyticsListingRow, "leonix_ad_id" | "id" | "slug">,
): string {
  return serviciosEngagementListingKey(row);
}

export function serviciosAnalyticsAliasKeys(
  row: Pick<ServiciosAnalyticsListingRow, "leonix_ad_id" | "id" | "slug">,
): string[] {
  return serviciosLikeCountAliasKeys(row);
}

export type ServiciosAnalyticsTrackMeta = {
  listingSlug?: string;
  engagementListingId?: string | null;
  ownerUserId?: string | null;
  source?: string;
  /** Set on ops API payloads when listing_analytics was already written client-side (prevents server double-count). */
  clientListingAnalytics?: boolean;
  [key: string]: unknown;
};

/** Build meta for `trackServiciosListingCta` / ops analytics API. */
export function serviciosAnalyticsTrackMeta(args: {
  listingSlug?: string | null;
  engagementListingId?: string | null;
  ownerUserId?: string | null;
  source: string;
  extra?: Record<string, unknown>;
}): ServiciosAnalyticsTrackMeta {
  const slug = (args.listingSlug ?? "").trim();
  const engagementId = (args.engagementListingId ?? slug).trim() || slug;
  return {
    listingSlug: slug,
    slug,
    engagementId,
    ownerUserId: args.ownerUserId?.trim() || undefined,
    source: args.source,
    clientListingAnalytics: true,
    ...args.extra,
  };
}

export function serviciosListingAnalyticsMetadata(slug: string, extra?: Record<string, unknown>) {
  const s = slug.trim();
  return { slug: s, publicPath: s ? `/clasificados/servicios/${encodeURIComponent(s)}` : undefined, ...extra };
}
