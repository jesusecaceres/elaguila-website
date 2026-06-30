/**
 * Bienes Raíces — global listing_analytics via POST /api/analytics/events (Varios/Autos pattern).
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const CATEGORY = "bienes-raices";
const SOURCE_TABLE = "listings";

export type BrGlobalAnalyticsContext = {
  listingUuid: string;
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

const AUTH_REQUIRED: ReadonlySet<ListingAnalyticsEventType> = new Set([
  "listing_save",
  "listing_unsave",
  "message_sent",
]);

async function resolveAccessToken(required: boolean): Promise<string | null> {
  if (!required) return null;
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function trackBrGlobalEvent(
  ctx: BrGlobalAnalyticsContext,
  eventType: ListingAnalyticsEventType,
  eventSource: string,
  opts: { metadata?: Record<string, unknown>; cooldownMs?: number } = {},
): Promise<void> {
  const sourceId = ctx.listingUuid.trim();
  if (!sourceId) return;

  const cooldown =
    opts.cooldownMs ??
    (eventType === "listing_view" ? 5000 : eventType === "result_card_click" ? 1000 : 500);

  if (!allowClientDedupe(eventType, sourceId, cooldown)) return;

  const needsAuth = AUTH_REQUIRED.has(eventType);
  const accessToken = await resolveAccessToken(needsAuth);

  void recordAnalyticsEvent({
    event_type: eventType,
    source_table: SOURCE_TABLE,
    source_id: sourceId,
    category: CATEGORY,
    event_source: eventSource,
    canonical_ad_id: ctx.leonixAdId?.trim() || undefined,
    anonymous_session_id: accessToken ? undefined : getAnonymousSessionId(),
    accessToken,
    metadata: opts.metadata,
  });
}

export function brAnalyticsContextFromListing(row: {
  id: string;
  leonix_ad_id?: string | null;
}): BrGlobalAnalyticsContext {
  return {
    listingUuid: row.id.trim(),
    leonixAdId: row.leonix_ad_id?.trim() || undefined,
  };
}

export function trackBrListingViewGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "listing_view", "detail");
}

export function trackBrResultCardClickGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "result_card_click", "results_card", { cooldownMs: 1000 });
}

/** Similar / substitute listing click from BR detail (other-client section). */
export function trackBrSimilarListingClickGlobal(
  ctx: BrGlobalAnalyticsContext,
  sourceListingUuid: string,
): void {
  void trackBrGlobalEvent(ctx, "result_card_click", "detail_similar", {
    cooldownMs: 1000,
    metadata: { source_listing_id: sourceListingUuid, section: "similar_other_client" },
  });
}

export function trackBrListingShareGlobal(ctx: BrGlobalAnalyticsContext, shareMethod?: string): void {
  void trackBrGlobalEvent(ctx, "listing_share", "detail", {
    metadata: shareMethod ? { shareMethod } : undefined,
  });
}

export function trackBrPhoneClickGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "phone_click", "detail_contact");
}

export function trackBrWhatsAppClickGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "whatsapp_click", "detail_contact");
}

export function trackBrEmailClickGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "email_click", "detail_contact");
}

export function trackBrMessageClickGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "message_click", "detail_contact");
}

export function trackBrDirectionsClickGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "directions_click", "detail_contact");
}

export function trackBrWebsiteClickGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "website_click", "detail_contact");
}

export function trackBrTourVideoClickGlobal(ctx: BrGlobalAnalyticsContext, kind: "video" | "tour"): void {
  void trackBrGlobalEvent(ctx, "cta_click", "detail", { metadata: { cta: kind === "tour" ? "virtual_tour" : "video" } });
}

export function trackBrReportSubmitGlobal(ctx: BrGlobalAnalyticsContext): void {
  void trackBrGlobalEvent(ctx, "cta_click", "detail", { metadata: { cta: "report_submit" } });
}

export type BrContactAnalyticsKind = "call" | "whatsapp" | "email" | "sms" | "website" | "directions";

export function trackBrContactClickGlobal(ctx: BrGlobalAnalyticsContext, kind: BrContactAnalyticsKind): void {
  if (kind === "call") trackBrPhoneClickGlobal(ctx);
  else if (kind === "whatsapp") trackBrWhatsAppClickGlobal(ctx);
  else if (kind === "email") trackBrEmailClickGlobal(ctx);
  else if (kind === "sms") trackBrMessageClickGlobal(ctx);
  else if (kind === "website") trackBrWebsiteClickGlobal(ctx);
  else if (kind === "directions") trackBrDirectionsClickGlobal(ctx);
}
