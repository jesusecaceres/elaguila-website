/**
 * Gate SVC1 — Servicios writes to POST /api/analytics/events (global pipeline).
 * Never sends owner_user_id; server resolves from servicios_public_listings.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export const SERVICIOS_ANALYTICS_SOURCE_TABLE = "servicios_public_listings" as const;
export const SERVICIOS_ANALYTICS_CATEGORY = "servicios" as const;

export type ServiciosGlobalAnalyticsListing = {
  /** servicios_public_listings.id (required) */
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

/** Map legacy servicios_analytics_events ops types → global listing_analytics event_type. */
export function mapServiciosOpsEventToGlobal(
  opsEventType: string,
): ListingAnalyticsEventType | null {
  const map: Record<string, ListingAnalyticsEventType> = {
    cta_call_click: "phone_click",
    cta_whatsapp_click: "whatsapp_click",
    cta_email_click: "email_click",
    cta_website_click: "website_click",
    cta_maps_click: "directions_click",
    cta_quote_sms_click: "message_click",
    cta_primary_click: "cta_click",
    cta_secondary_click: "cta_click",
    cta_review_click: "website_click",
    profile_view: "listing_view",
    lead_created: "lead_created",
  };
  return map[opsEventType.trim()] ?? null;
}

/**
 * Fire-and-forget global analytics write. Non-fatal by design.
 */
export function recordServiciosGlobalAnalyticsEvent(
  listing: ServiciosGlobalAnalyticsListing,
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
    source_table: SERVICIOS_ANALYTICS_SOURCE_TABLE,
    source_id: sourceId,
    category: SERVICIOS_ANALYTICS_CATEGORY,
    event_source: opts?.event_source,
    metadata: opts?.metadata,
    anonymous_session_id: token ? undefined : getAnonymousSessionId(),
    canonical_ad_id: listing.leonix_ad_id?.trim() || undefined,
    accessToken: token ?? null,
  }).catch(() => {});
}

export async function recordServiciosGlobalAnalyticsEventAuthed(
  listing: ServiciosGlobalAnalyticsListing,
  eventType: ListingAnalyticsEventType,
  opts?: { event_source?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    recordServiciosGlobalAnalyticsEvent(listing, eventType, {
      ...opts,
      accessToken: data.session?.access_token ?? null,
    });
  } catch {
    recordServiciosGlobalAnalyticsEvent(listing, eventType, opts);
  }
}

export function serviciosGlobalListingFromRow(row: {
  id?: string | null;
  slug?: string;
  leonix_ad_id?: string | null;
}): ServiciosGlobalAnalyticsListing | null {
  const id = (row.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    slug: row.slug?.trim(),
    leonix_ad_id: row.leonix_ad_id ?? null,
  };
}

/** Share/save hooks for Leonix engagement buttons on Servicios surfaces. */
export function serviciosGlobalShareRecorder(
  listing: ServiciosGlobalAnalyticsListing,
  eventSource: "detail_share" | "results_card_share",
) {
  return (shareMethod: string, extraMeta?: Record<string, unknown>) => {
    recordServiciosGlobalAnalyticsEvent(listing, "listing_share", {
      event_source: eventSource,
      metadata: { shareMethod, ...extraMeta },
    });
  };
}

export function serviciosGlobalSaveRecorder(listing: ServiciosGlobalAnalyticsListing) {
  return async (isSave: boolean) => {
    await recordServiciosGlobalAnalyticsEventAuthed(listing, isSave ? "listing_save" : "listing_unsave", {
      event_source: "detail",
    });
  };
}

export function serviciosGlobalLikeRecorder(listing: ServiciosGlobalAnalyticsListing) {
  return async (isLike: boolean) => {
    await recordServiciosGlobalAnalyticsEventAuthed(listing, isLike ? "listing_like" : "listing_unlike", {
      event_source: "detail",
    });
  };
}
