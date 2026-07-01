/**
 * Gate CLASSIFIEDS-ANALYTICS-TRUTH-1
 * Shared global analytics for Comunidad, Clases, and Busco categories.
 * All three categories share the `listings` source_table.
 * Mirrors the enVentaGlobalAnalytics.ts pattern.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";

export const COMMUNITY_ANALYTICS_SOURCE_TABLE = "listings" as const;

export type CommunityAnalyticsCategory = "comunidad" | "clases" | "busco";

export type CommunityGlobalAnalyticsCtx = {
  /** listings.id — internal UUID, used as source_id in DB writes. */
  listingUuid: string;
  category: CommunityAnalyticsCategory;
  /** Leonix display Ad ID — included as canonical_ad_id for display/reference only. */
  leonixAdId?: string | null;
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

const clientDedupe = new Map<string, number>();

function allowClientDedupe(eventType: string, sourceId: string, cooldownMs: number): boolean {
  const key = `${eventType}:${sourceId}`;
  const last = clientDedupe.get(key) ?? 0;
  const now = Date.now();
  if (now - last < cooldownMs) return false;
  clientDedupe.set(key, now);
  return true;
}

function trackCommunityGlobalEvent(
  ctx: CommunityGlobalAnalyticsCtx,
  eventType: ListingAnalyticsEventType,
  eventSource: string,
  opts: { metadata?: Record<string, unknown>; cooldownMs?: number } = {},
): void {
  const sourceId = ctx.listingUuid.trim();
  if (!sourceId) return;

  const cooldown =
    opts.cooldownMs ??
    (eventType === "listing_view" ? 5000 : eventType === "result_card_click" ? 1000 : 500);

  if (!allowClientDedupe(eventType, sourceId, cooldown)) return;

  void recordAnalyticsEvent({
    event_type: eventType,
    source_table: COMMUNITY_ANALYTICS_SOURCE_TABLE,
    source_id: sourceId,
    category: ctx.category,
    event_source: eventSource,
    canonical_ad_id: ctx.leonixAdId?.trim() || undefined,
    anonymous_session_id: getAnonymousSessionId(),
    metadata: opts.metadata,
  });
}

export function trackCommunityListingView(ctx: CommunityGlobalAnalyticsCtx): void {
  trackCommunityGlobalEvent(ctx, "listing_view", "detail");
  trackCommunityGlobalEvent(ctx, "listing_open", "detail");
}

export function trackCommunityListingShare(
  ctx: CommunityGlobalAnalyticsCtx,
  shareMethod?: string,
): void {
  trackCommunityGlobalEvent(ctx, "listing_share", "detail", {
    metadata: shareMethod ? { shareMethod } : undefined,
  });
}

export function trackCommunityPhoneClick(ctx: CommunityGlobalAnalyticsCtx): void {
  trackCommunityGlobalEvent(ctx, "phone_click", "detail");
}

export function trackCommunityWhatsAppClick(ctx: CommunityGlobalAnalyticsCtx): void {
  trackCommunityGlobalEvent(ctx, "whatsapp_click", "detail");
}

export function trackCommunityMessageClick(ctx: CommunityGlobalAnalyticsCtx): void {
  trackCommunityGlobalEvent(ctx, "message_click", "detail");
}

export function trackCommunityEmailClick(ctx: CommunityGlobalAnalyticsCtx): void {
  trackCommunityGlobalEvent(ctx, "email_click", "detail");
}

export function trackCommunityWebsiteClick(
  ctx: CommunityGlobalAnalyticsCtx,
  ctaMeta?: string,
): void {
  trackCommunityGlobalEvent(ctx, "website_click", "detail", {
    metadata: ctaMeta ? { cta: ctaMeta } : undefined,
  });
}

export function trackCommunityLikeToggle(
  ctx: CommunityGlobalAnalyticsCtx,
  isLike: boolean,
): void {
  trackCommunityGlobalEvent(ctx, isLike ? "listing_like" : "listing_unlike", "detail");
}

export function trackCommunityResultCardClick(ctx: CommunityGlobalAnalyticsCtx): void {
  trackCommunityGlobalEvent(ctx, "result_card_click", "results_card", { cooldownMs: 1000 });
}

export function trackCommunityReportSubmit(ctx: CommunityGlobalAnalyticsCtx): void {
  trackCommunityGlobalEvent(ctx, "cta_click", "detail", { metadata: { cta: "report_submit" } });
}
