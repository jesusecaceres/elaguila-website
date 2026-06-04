/**
 * Gate EMP1 — Empleos writes to POST /api/analytics/events (global pipeline).
 * Never sends owner_user_id; server resolves from empleos_public_listings.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export const EMPLEOS_ANALYTICS_SOURCE_TABLE = "empleos_public_listings" as const;
export const EMPLEOS_ANALYTICS_CATEGORY = "empleos" as const;

export type EmpleosGlobalAnalyticsListing = {
  /** empleos_public_listings.id (required) */
  id: string;
  slug?: string | null;
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

export function empleosCanonicalAdId(listing: EmpleosGlobalAnalyticsListing): string | undefined {
  const ad = (listing.leonix_ad_id ?? "").trim();
  if (ad) return ad;
  const slug = (listing.slug ?? "").trim();
  if (slug) return slug;
  const id = (listing.id ?? "").trim();
  return id ? `empleos_public_listings:${id}` : undefined;
}

export function recordEmpleosGlobalAnalyticsEvent(
  listing: EmpleosGlobalAnalyticsListing,
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
    source_table: EMPLEOS_ANALYTICS_SOURCE_TABLE,
    source_id: sourceId,
    category: EMPLEOS_ANALYTICS_CATEGORY,
    event_source: opts?.event_source,
    metadata: opts?.metadata,
    anonymous_session_id: token ? undefined : getAnonymousSessionId(),
    canonical_ad_id: empleosCanonicalAdId(listing),
    accessToken: token ?? null,
  }).catch(() => {});
}

export async function recordEmpleosGlobalAnalyticsEventAuthed(
  listing: EmpleosGlobalAnalyticsListing,
  eventType: ListingAnalyticsEventType,
  opts?: { event_source?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    recordEmpleosGlobalAnalyticsEvent(listing, eventType, {
      ...opts,
      accessToken: data.session?.access_token ?? null,
    });
  } catch {
    recordEmpleosGlobalAnalyticsEvent(listing, eventType, opts);
  }
}

export function empleosGlobalListingFromRow(row: {
  id?: string | null;
  slug?: string | null;
  leonix_ad_id?: string | null;
}): EmpleosGlobalAnalyticsListing | null {
  const id = (row.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    slug: row.slug ?? null,
    leonix_ad_id: row.leonix_ad_id ?? null,
  };
}

export function empleosEngagementListingKey(row: {
  id: string;
  slug?: string | null;
  leonix_ad_id?: string | null;
}): string {
  const ad = (row.leonix_ad_id ?? "").trim();
  if (ad) return ad;
  return (row.id ?? "").trim();
}

export function empleosGlobalShareRecorder(
  listing: EmpleosGlobalAnalyticsListing,
  eventSource: "detail_share" | "results_card_share",
) {
  return (shareMethod: string, extraMeta?: Record<string, unknown>) => {
    recordEmpleosGlobalAnalyticsEvent(listing, "listing_share", {
      event_source: eventSource,
      metadata: { shareMethod, ...extraMeta },
    });
  };
}

export function empleosGlobalSaveRecorder(listing: EmpleosGlobalAnalyticsListing) {
  return async (isSave: boolean) => {
    await recordEmpleosGlobalAnalyticsEventAuthed(listing, isSave ? "listing_save" : "listing_unsave", {
      event_source: "detail",
    });
  };
}

export function empleosGlobalLikeRecorder(listing: EmpleosGlobalAnalyticsListing) {
  return async (isLike: boolean) => {
    await recordEmpleosGlobalAnalyticsEventAuthed(listing, isLike ? "listing_like" : "listing_unlike", {
      event_source: "detail",
    });
  };
}
