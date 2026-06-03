/**
 * Gate AUTO1 — Autos writes to POST /api/analytics/events (global pipeline).
 * Never sends owner_user_id; server resolves from autos_classifieds_listings.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export const AUTOS_ANALYTICS_SOURCE_TABLE = "autos_classifieds_listings" as const;
export const AUTOS_ANALYTICS_CATEGORY = "autos" as const;

export type AutosGlobalAnalyticsListing = {
  /** autos_classifieds_listings.id (required) */
  id: string;
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

/** Map legacy `autos_classifieds_analytics_events` types → global listing_analytics event_type. */
export function mapAutosOpsEventToGlobal(opsEventType: string): ListingAnalyticsEventType | null {
  const map: Record<string, ListingAnalyticsEventType> = {
    [AUTOS_CLASSIFIEDS_EVENT.resultCardClick]: "result_card_click",
    [AUTOS_CLASSIFIEDS_EVENT.listingOpen]: "listing_view",
    [AUTOS_CLASSIFIEDS_EVENT.callClick]: "phone_click",
    [AUTOS_CLASSIFIEDS_EVENT.whatsappClick]: "whatsapp_click",
    [AUTOS_CLASSIFIEDS_EVENT.websiteClick]: "website_click",
    [AUTOS_CLASSIFIEDS_EVENT.ctaClick]: "cta_click",
    [AUTOS_CLASSIFIEDS_EVENT.appointmentClick]: "contact_click",
    [AUTOS_CLASSIFIEDS_EVENT.save]: "listing_save",
    [AUTOS_CLASSIFIEDS_EVENT.share]: "listing_share",
  };
  return map[opsEventType.trim()] ?? null;
}

export function recordAutosGlobalAnalyticsEvent(
  listing: AutosGlobalAnalyticsListing,
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
    source_table: AUTOS_ANALYTICS_SOURCE_TABLE,
    source_id: sourceId,
    category: AUTOS_ANALYTICS_CATEGORY,
    event_source: opts?.event_source,
    metadata: opts?.metadata,
    anonymous_session_id: token ? undefined : getAnonymousSessionId(),
    canonical_ad_id: listing.leonix_ad_id?.trim() || undefined,
    accessToken: token ?? null,
  }).catch(() => {});
}

export async function recordAutosGlobalAnalyticsEventAuthed(
  listing: AutosGlobalAnalyticsListing,
  eventType: ListingAnalyticsEventType,
  opts?: { event_source?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    recordAutosGlobalAnalyticsEvent(listing, eventType, {
      ...opts,
      accessToken: data.session?.access_token ?? null,
    });
  } catch {
    recordAutosGlobalAnalyticsEvent(listing, eventType, opts);
  }
}

export function autosGlobalListingFromRow(row: {
  id?: string | null;
  leonix_ad_id?: string | null;
}): AutosGlobalAnalyticsListing | null {
  const id = (row.id ?? "").trim();
  if (!id) return null;
  return { id, leonix_ad_id: row.leonix_ad_id ?? null };
}

export function autosEngagementListingKey(row: { id: string; leonix_ad_id?: string | null }): string {
  const ad = (row.leonix_ad_id ?? "").trim();
  if (ad) return ad;
  return (row.id ?? "").trim();
}

export function autosGlobalShareRecorder(
  listing: AutosGlobalAnalyticsListing,
  eventSource: "detail_share" | "results_card_share",
) {
  return (shareMethod: string, extraMeta?: Record<string, unknown>) => {
    recordAutosGlobalAnalyticsEvent(listing, "listing_share", {
      event_source: eventSource,
      metadata: { shareMethod, ...extraMeta },
    });
  };
}

export function autosGlobalSaveRecorder(listing: AutosGlobalAnalyticsListing) {
  return async (isSave: boolean) => {
    await recordAutosGlobalAnalyticsEventAuthed(listing, isSave ? "listing_save" : "listing_unsave", {
      event_source: "detail",
    });
  };
}

export function autosGlobalLikeRecorder(listing: AutosGlobalAnalyticsListing) {
  return async (isLike: boolean) => {
    await recordAutosGlobalAnalyticsEventAuthed(listing, isLike ? "listing_like" : "listing_unlike", {
      event_source: "detail",
    });
  };
}
