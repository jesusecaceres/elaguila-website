/**
 * En Venta / Varios — global G2A analytics via POST /api/analytics/events.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const CATEGORY = "en-venta";
const SOURCE_TABLE = "listings";

export type EnVentaGlobalAnalyticsContext = {
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

async function trackEnVentaGlobalEvent(
  ctx: EnVentaGlobalAnalyticsContext,
  eventType: ListingAnalyticsEventType,
  eventSource: string,
  opts: { metadata?: Record<string, unknown>; cooldownMs?: number } = {},
): Promise<void> {
  const sourceId = ctx.listingUuid.trim();
  if (!sourceId) return;

  const cooldown =
    opts.cooldownMs ??
    (eventType === "listing_view"
      ? 5000
      : eventType === "result_card_click"
        ? 1000
        : 500);

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

export function trackEnVentaListingViewGlobal(ctx: EnVentaGlobalAnalyticsContext): void {
  void trackEnVentaGlobalEvent(ctx, "listing_view", "detail");
}

export function trackEnVentaResultCardClickGlobal(ctx: EnVentaGlobalAnalyticsContext): void {
  void trackEnVentaGlobalEvent(ctx, "result_card_click", "results_card", { cooldownMs: 1000 });
}

export function trackEnVentaListingShareGlobal(
  ctx: EnVentaGlobalAnalyticsContext,
  shareMethod?: string,
): void {
  void trackEnVentaGlobalEvent(ctx, "listing_share", "detail", {
    metadata: shareMethod ? { shareMethod } : undefined,
  });
}

export function trackEnVentaPhoneClickGlobal(ctx: EnVentaGlobalAnalyticsContext): void {
  void trackEnVentaGlobalEvent(ctx, "phone_click", "detail");
}

export function trackEnVentaWhatsAppClickGlobal(ctx: EnVentaGlobalAnalyticsContext): void {
  void trackEnVentaGlobalEvent(ctx, "whatsapp_click", "detail");
}

export function trackEnVentaEmailClickGlobal(ctx: EnVentaGlobalAnalyticsContext): void {
  void trackEnVentaGlobalEvent(ctx, "email_click", "detail");
}

export function trackEnVentaMessageClickGlobal(ctx: EnVentaGlobalAnalyticsContext): void {
  void trackEnVentaGlobalEvent(ctx, "message_click", "detail");
}

export function trackEnVentaDirectionsClickGlobal(ctx: EnVentaGlobalAnalyticsContext): void {
  void trackEnVentaGlobalEvent(ctx, "directions_click", "detail");
}

export function trackEnVentaLikeGlobal(ctx: EnVentaGlobalAnalyticsContext, isLike: boolean): void {
  void trackEnVentaGlobalEvent(ctx, isLike ? "listing_like" : "listing_unlike", "detail");
}

export function trackEnVentaSaveGlobal(ctx: EnVentaGlobalAnalyticsContext, isSave: boolean): void {
  void trackEnVentaGlobalEvent(ctx, isSave ? "listing_save" : "listing_unsave", "detail");
}
