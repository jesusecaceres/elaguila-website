import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";

const CATEGORY = "rentas";
const SOURCE_TABLE = "listings";

export type RentasAnalyticsContext = {
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

function normalizeContext(ctxOrId: RentasAnalyticsContext | string): RentasAnalyticsContext {
  return typeof ctxOrId === "string" ? { listingUuid: ctxOrId } : ctxOrId;
}

async function trackRentasGlobalEvent(
  ctxOrId: RentasAnalyticsContext | string,
  eventType: ListingAnalyticsEventType,
  eventSource: string,
  opts: { metadata?: Record<string, unknown>; cooldownMs?: number; authRequired?: boolean } = {},
): Promise<void> {
  const ctx = normalizeContext(ctxOrId);
  const sourceId = ctx.listingUuid.trim();
  if (!sourceId) return;
  const cooldown =
    opts.cooldownMs ??
    (eventType === "listing_view" ? 5000 : eventType === "result_card_click" ? 1000 : 500);
  if (!allowClientDedupe(eventType, sourceId, cooldown)) return;

  const accessToken = await resolveAccessToken(Boolean(opts.authRequired));
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

export function trackRentasListingView(ctxOrId: RentasAnalyticsContext | string, _userId?: string | null) {
  void trackRentasGlobalEvent(ctxOrId, "listing_view", "detail");
}

export function trackRentasResultCardClick(ctxOrId: RentasAnalyticsContext | string) {
  void trackRentasGlobalEvent(ctxOrId, "result_card_click", "results_card", { cooldownMs: 1000 });
}

export function trackRentasContactClick(ctxOrId: RentasAnalyticsContext | string, _userId?: string | null) {
  void trackRentasGlobalEvent(ctxOrId, "contact_click", "detail");
}

export function trackRentasMessageSent(ctxOrId: RentasAnalyticsContext | string, _userId?: string | null) {
  void trackRentasGlobalEvent(ctxOrId, "message_sent", "detail", { authRequired: true });
}

export function trackRentasPhoneClick(ctxOrId: RentasAnalyticsContext | string) {
  void trackRentasGlobalEvent(ctxOrId, "phone_click", "detail");
}

export function trackRentasWhatsappClick(ctxOrId: RentasAnalyticsContext | string) {
  void trackRentasGlobalEvent(ctxOrId, "whatsapp_click", "detail");
}

export function trackRentasEmailClick(ctxOrId: RentasAnalyticsContext | string) {
  void trackRentasGlobalEvent(ctxOrId, "email_click", "detail");
}

export function trackRentasWebsiteClick(ctxOrId: RentasAnalyticsContext | string) {
  void trackRentasGlobalEvent(ctxOrId, "website_click", "detail");
}

export function trackRentasDirectionsClick(ctxOrId: RentasAnalyticsContext | string) {
  void trackRentasGlobalEvent(ctxOrId, "directions_click", "detail");
}

export function trackRentasMessageClick(ctxOrId: RentasAnalyticsContext | string) {
  void trackRentasGlobalEvent(ctxOrId, "message_click", "detail");
}
