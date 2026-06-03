/**
 * Restaurantes category analytics — Gate REST1 routes through POST /api/analytics/events.
 * Legacy exports kept for call sites; owner_user_id is never sent (server-resolved).
 */
import type { EventSource } from "@/app/lib/clasificadosAnalytics";
import {
  recordRestaurantesGlobalAnalyticsEvent,
  recordRestaurantesGlobalAnalyticsEventAuthed,
  restaurantesGlobalListingFromRow,
} from "../lib/recordRestaurantesGlobalAnalytics";
import type { RestaurantesGlobalAnalyticsListing } from "../lib/recordRestaurantesGlobalAnalytics";
import type { RestaurantesAnalyticsTrackMeta } from "../lib/restaurantesAnalyticsIdentity";
import { trackRestaurantesListingCta, type RestaurantesCtaType } from "../lib/restaurantesCtaTracking";

function listingFromLegacyId(
  listingId: string,
  options?: { metadata?: Record<string, unknown> },
): RestaurantesGlobalAnalyticsListing | null {
  const sourceId = String(options?.metadata?.sourceId ?? options?.metadata?.source_id ?? "").trim();
  if (sourceId) {
    return restaurantesGlobalListingFromRow({
      id: sourceId,
      leonix_ad_id: /^REST-/i.test(listingId) ? listingId : null,
    });
  }
  if (/^[0-9a-f-]{36}$/i.test(listingId.trim())) {
    return restaurantesGlobalListingFromRow({ id: listingId.trim() });
  }
  return null;
}

function mapEventSource(src?: EventSource): string {
  if (src === "card" || src === "search_results") return "results_card";
  if (src === "share_modal") return "detail_share";
  return "detail";
}

export async function trackRestaurantesListingView(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const listing = listingFromLegacyId(listingId, options);
  if (!listing) return;
  recordRestaurantesGlobalAnalyticsEvent(listing, "listing_view", {
    event_source: mapEventSource(options.eventSource),
    metadata: options.metadata,
  });
}

export async function trackRestaurantesLike(
  listingId: string,
  isLike: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const listing = listingFromLegacyId(listingId, options);
  if (!listing) return;
  await recordRestaurantesGlobalAnalyticsEventAuthed(listing, isLike ? "listing_like" : "listing_unlike", {
    event_source: mapEventSource(options.eventSource),
    metadata: options.metadata,
  });
}

export async function trackRestaurantesSave(
  listingId: string,
  isSave: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const listing = listingFromLegacyId(listingId, options);
  if (!listing) return;
  await recordRestaurantesGlobalAnalyticsEventAuthed(listing, isSave ? "listing_save" : "listing_unsave", {
    event_source: mapEventSource(options.eventSource),
    metadata: options.metadata,
  });
}

export async function trackRestaurantesShare(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    shareMethod?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const listing = listingFromLegacyId(listingId, options);
  if (!listing) return;
  recordRestaurantesGlobalAnalyticsEvent(listing, "listing_share", {
    event_source: options.eventSource === "card" ? "results_card_share" : "detail_share",
    metadata: { shareMethod: options.shareMethod, ...options.metadata },
  });
}

export async function trackRestaurantesCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "order" | "reserve" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const sourceId = String(options.metadata?.sourceId ?? options.metadata?.source_id ?? "").trim();
  const slug = String(options.metadata?.slug ?? "").trim();
  const meta: RestaurantesAnalyticsTrackMeta = {
    sourceId: sourceId || (/^[0-9a-f-]{36}$/i.test(listingId) ? listingId : null),
    engagementListingId: listingId,
    listingSlug: slug || undefined,
    source: options.eventSource === "detail" ? "contact_hub" : "cta_card",
    ...options.metadata,
  };
  trackRestaurantesListingCta(ctaType as RestaurantesCtaType, meta);
}

export async function trackRestaurantesLead(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    leadType?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const listing = listingFromLegacyId(listingId, options);
  if (!listing) return;
  recordRestaurantesGlobalAnalyticsEvent(listing, "lead_created", {
    event_source: mapEventSource(options.eventSource),
    metadata: { leadType: options.leadType, ...options.metadata },
  });
}

