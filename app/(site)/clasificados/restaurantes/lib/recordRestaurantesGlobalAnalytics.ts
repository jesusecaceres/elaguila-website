/**
 * Gate REST1 — Restaurantes writes to POST /api/analytics/events (global pipeline).
 * Never sends owner_user_id; server resolves from restaurantes_public_listings.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export const RESTAURANTES_ANALYTICS_SOURCE_TABLE = "restaurantes_public_listings" as const;
export const RESTAURANTES_ANALYTICS_CATEGORY = "restaurantes" as const;

export type RestaurantesGlobalAnalyticsListing = {
  /** restaurantes_public_listings.id (required) */
  id: string;
  slug?: string;
  leonix_ad_id?: string | null;
};

function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "lx_analytics_session";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export function mapRestaurantesCtaTypeToGlobal(
  ctaType: string,
): ListingAnalyticsEventType | null {
  const map: Record<string, ListingAnalyticsEventType> = {
    phone: "phone_click",
    whatsapp: "whatsapp_click",
    email: "email_click",
    website: "website_click",
    directions: "directions_click",
    order: "cta_click",
    reserve: "cta_click",
    menu: "cta_click",
    social: "cta_click",
    review: "cta_click",
    general: "cta_click",
    message: "message_click",
    contact: "contact_click",
  };
  return map[ctaType.trim()] ?? null;
}

/** Fire-and-forget global analytics write. Non-fatal by design. */
export function recordRestaurantesGlobalAnalyticsEvent(
  listing: RestaurantesGlobalAnalyticsListing,
  eventType: ListingAnalyticsEventType,
  opts?: {
    event_source?: string;
    metadata?: Record<string, unknown>;
    accessToken?: string | null;
  },
): void {
  const sourceId = (listing.id ?? "").trim();
  if (!sourceId) return;

  const token = opts?.accessToken?.trim();
  void recordAnalyticsEvent({
    event_type: eventType,
    source_table: RESTAURANTES_ANALYTICS_SOURCE_TABLE,
    source_id: sourceId,
    category: RESTAURANTES_ANALYTICS_CATEGORY,
    event_source: opts?.event_source,
    metadata: opts?.metadata,
    anonymous_session_id: token ? undefined : getAnonymousSessionId(),
    canonical_ad_id: listing.leonix_ad_id?.trim() || undefined,
    accessToken: token ?? null,
  }).catch(() => {});
}

export async function recordRestaurantesGlobalAnalyticsEventAuthed(
  listing: RestaurantesGlobalAnalyticsListing,
  eventType: ListingAnalyticsEventType,
  opts?: { event_source?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    recordRestaurantesGlobalAnalyticsEvent(listing, eventType, {
      ...opts,
      accessToken: data.session?.access_token ?? null,
    });
  } catch {
    recordRestaurantesGlobalAnalyticsEvent(listing, eventType, opts);
  }
}

export function restaurantesGlobalListingFromRow(row: {
  id?: string | null;
  slug?: string;
  leonix_ad_id?: string | null;
}): RestaurantesGlobalAnalyticsListing | null {
  const id = (row.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    slug: row.slug?.trim(),
    leonix_ad_id: row.leonix_ad_id ?? null,
  };
}

export function restaurantesGlobalShareRecorder(
  listing: RestaurantesGlobalAnalyticsListing,
  eventSource: "detail_share" | "results_card_share",
) {
  return (shareMethod: string, extraMeta?: Record<string, unknown>) => {
    recordRestaurantesGlobalAnalyticsEvent(listing, "listing_share", {
      event_source: eventSource,
      metadata: { shareMethod, ...extraMeta },
    });
  };
}

export function restaurantesGlobalSaveRecorder(listing: RestaurantesGlobalAnalyticsListing) {
  return async (isSave: boolean) => {
    await recordRestaurantesGlobalAnalyticsEventAuthed(listing, isSave ? "listing_save" : "listing_unsave", {
      event_source: "detail",
    });
  };
}

export function restaurantesGlobalLikeRecorder(listing: RestaurantesGlobalAnalyticsListing) {
  return async (isLike: boolean) => {
    await recordRestaurantesGlobalAnalyticsEventAuthed(listing, isLike ? "listing_like" : "listing_unlike", {
      event_source: "detail",
    });
  };
}
