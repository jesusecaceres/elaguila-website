import {
  mapRestaurantesCtaTypeToGlobal,
  recordRestaurantesGlobalAnalyticsEvent,
  restaurantesGlobalListingFromRow,
  type RestaurantesGlobalAnalyticsListing,
} from "./recordRestaurantesGlobalAnalytics";
import {
  restaurantesAnalyticsTrackMeta,
  restaurantesListingAnalyticsMetadata,
  type RestaurantesAnalyticsTrackMeta,
} from "./restaurantesAnalyticsIdentity";

function resolveListingFromMeta(
  meta?: RestaurantesAnalyticsTrackMeta,
): RestaurantesGlobalAnalyticsListing | null {
  const sourceId = (meta?.sourceId ?? "").trim();
  if (!sourceId) return null;
  return {
    id: sourceId,
    slug: typeof meta?.listingSlug === "string" ? meta.listingSlug : undefined,
    leonix_ad_id:
      typeof meta?.engagementListingId === "string" && /^REST-/i.test(meta.engagementListingId)
        ? meta.engagementListingId
        : null,
  };
}

function eventSourceForMeta(meta?: RestaurantesAnalyticsTrackMeta): string {
  const source = String(meta?.source ?? "");
  if (source.includes("card") || source.includes("result")) return "results_card";
  return "detail_contact";
}

export type RestaurantesCtaType =
  | "phone"
  | "whatsapp"
  | "email"
  | "website"
  | "directions"
  | "order"
  | "reserve"
  | "menu"
  | "social"
  | "review"
  | "message"
  | "contact"
  | "general";

const CTA_CLICK_KINDS = new Set<RestaurantesCtaType>([
  "order",
  "reserve",
  "menu",
  "social",
  "review",
  "general",
]);

function metadataForRestaurantesCta(
  ctaType: RestaurantesCtaType,
  slug: string,
  meta?: RestaurantesAnalyticsTrackMeta,
): Record<string, unknown> {
  const base = {
    contact_method: ctaType,
    restaurantesCtaType: ctaType,
    ...restaurantesListingAnalyticsMetadata(slug, meta),
    ...(meta ?? {}),
  };
  if (!CTA_CLICK_KINDS.has(ctaType)) return base;
  const ctaKey =
    typeof meta?.cta === "string" && meta.cta.trim() ? meta.cta.trim() : `${ctaType}_click`;
  return {
    ...base,
    cta: ctaKey,
  };
}

/**
 * Restaurant contact / shell CTA — global /api/analytics/events only (REST1).
 */
export function trackRestaurantesListingCta(
  ctaType: RestaurantesCtaType,
  meta?: RestaurantesAnalyticsTrackMeta,
): void {
  const listing = resolveListingFromMeta(meta);
  const globalType = mapRestaurantesCtaTypeToGlobal(ctaType);
  if (!listing || !globalType) return;

  const slug = (meta?.listingSlug ?? "").trim();
  recordRestaurantesGlobalAnalyticsEvent(listing, globalType, {
    event_source: eventSourceForMeta(meta),
    metadata: metadataForRestaurantesCta(ctaType, slug, meta),
  });
}

/** Result card / profile CTA navigation — user click only. */
export function trackRestaurantesResultCardClick(row: {
  id?: string | null;
  slug?: string;
  leonix_ad_id?: string | null;
}): void {
  const listing = restaurantesGlobalListingFromRow(row);
  if (!listing) return;
  recordRestaurantesGlobalAnalyticsEvent(listing, "result_card_click", {
    event_source: "results_card",
    metadata: restaurantesListingAnalyticsMetadata(row.slug ?? ""),
  });
}

/** Live public profile: one listing_view per load. */
export function trackRestaurantesPublicProfileView(args: {
  listing: RestaurantesGlobalAnalyticsListing;
  listingSlug: string;
}): void {
  const slug = args.listingSlug.trim();
  if (!slug || !args.listing.id.trim()) return;
  recordRestaurantesGlobalAnalyticsEvent(args.listing, "listing_view", {
    event_source: "detail",
    metadata: restaurantesListingAnalyticsMetadata(slug),
  });
}

export { restaurantesAnalyticsTrackMeta };
