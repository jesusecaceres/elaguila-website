/**
 * Gate FOOD-L8A — Comida Local public analytics via POST /api/analytics/events.
 * Never sends owner_user_id; server resolves from comida_local_public_listings.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import type { ComidaLocalPreviewContactActionId } from "./comidaLocalPreviewTypes";

export const COMIDA_LOCAL_ANALYTICS_SOURCE_TABLE = "comida_local_public_listings" as const;
export const COMIDA_LOCAL_ANALYTICS_CATEGORY = "comida-local" as const;

/** Semantic Comida Local event names (stored in metadata.comida_event_type). */
export const COMIDA_LOCAL_ANALYTICS_EVENT_TYPES = [
  "profile_view",
  "result_card_click",
  "call_click",
  "sms_click",
  "whatsapp_click",
  "instagram_click",
  "facebook_click",
  "tiktok_click",
  "location_click",
  "website_or_external_click",
] as const;

export type ComidaLocalAnalyticsEventType = (typeof COMIDA_LOCAL_ANALYTICS_EVENT_TYPES)[number];

export type ComidaLocalAnalyticsSource =
  | "results_card"
  | "detail_header"
  | "detail_contact_actions"
  | "detail_location"
  | "detail_socials";

export type ComidaLocalAnalyticsContext = {
  listingId: string;
  leonixAdId?: string | null;
  slug?: string;
};

const COMIDA_EVENT_SET = new Set<string>(COMIDA_LOCAL_ANALYTICS_EVENT_TYPES);

export function isComidaLocalAnalyticsEventType(v: string): v is ComidaLocalAnalyticsEventType {
  return COMIDA_EVENT_SET.has(v);
}

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

function currentPagePath(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.pathname}${window.location.search}`.slice(0, 240);
}

const BLOCKED_METADATA_KEYS = new Set([
  "phone",
  "whatsapp",
  "email",
  "owner_user_id",
  "ownerUserId",
  "tel",
  "sms",
]);

function sanitizeClientMetadata(input?: Record<string, unknown>): Record<string, unknown> {
  if (!input) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const k = key.trim().toLowerCase();
    if (!k || BLOCKED_METADATA_KEYS.has(k)) continue;
    if (typeof value === "string") out[key] = value.slice(0, 200);
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function mapComidaLocalEventToGlobal(
  eventType: ComidaLocalAnalyticsEventType,
): ListingAnalyticsEventType {
  switch (eventType) {
    case "profile_view":
      return "profile_view";
    case "result_card_click":
      return "result_card_click";
    case "call_click":
      return "phone_click";
    case "sms_click":
      return "message_click";
    case "whatsapp_click":
      return "whatsapp_click";
    case "instagram_click":
    case "facebook_click":
    case "tiktok_click":
      return "outbound_click";
    case "location_click":
      return "directions_click";
    case "website_or_external_click":
      return "website_click";
    default:
      return "cta_click";
  }
}

export function comidaLocalContactActionToEventType(
  actionId: ComidaLocalPreviewContactActionId,
): ComidaLocalAnalyticsEventType | null {
  switch (actionId) {
    case "call":
      return "call_click";
    case "sms":
      return "sms_click";
    case "whatsapp":
      return "whatsapp_click";
    case "instagram":
      return "instagram_click";
    case "facebook":
      return "facebook_click";
    case "tiktok":
      return "tiktok_click";
    case "location":
      return "location_click";
    default:
      return null;
  }
}

export function comidaLocalAnalyticsSourceForContactAction(
  actionId: ComidaLocalPreviewContactActionId,
): ComidaLocalAnalyticsSource {
  if (actionId === "location") return "detail_location";
  if (actionId === "instagram" || actionId === "facebook" || actionId === "tiktok") {
    return "detail_socials";
  }
  return "detail_contact_actions";
}

export function comidaLocalListingFromRow(row: {
  id?: string | null;
  slug?: string;
  leonix_ad_id?: string | null;
}): ComidaLocalAnalyticsContext | null {
  const listingId = (row.id ?? "").trim();
  if (!listingId) return null;
  return {
    listingId,
    slug: row.slug?.trim(),
    leonixAdId: row.leonix_ad_id ?? null,
  };
}

/** Fire-and-forget global analytics write. Non-fatal by design. */
export function trackComidaLocalListingEvent(input: {
  listingId: string;
  leonixAdId?: string | null;
  eventType: ComidaLocalAnalyticsEventType;
  source: ComidaLocalAnalyticsSource;
  pagePath?: string;
  metadata?: Record<string, unknown>;
}): void {
  const listingId = input.listingId.trim();
  if (!listingId || !isComidaLocalAnalyticsEventType(input.eventType)) return;

  const globalType = mapComidaLocalEventToGlobal(input.eventType);
  const pagePath = input.pagePath?.trim() || currentPagePath();

  void recordAnalyticsEvent({
    event_type: globalType,
    source_table: COMIDA_LOCAL_ANALYTICS_SOURCE_TABLE,
    source_id: listingId,
    category: COMIDA_LOCAL_ANALYTICS_CATEGORY,
    event_source: input.source,
    canonical_ad_id: input.leonixAdId?.trim() || undefined,
    anonymous_session_id: getAnonymousSessionId(),
    metadata: sanitizeClientMetadata({
      comida_event_type: input.eventType,
      listing_type: COMIDA_LOCAL_ANALYTICS_CATEGORY,
      ...(pagePath ? { page_path: pagePath } : {}),
      ...(input.metadata ?? {}),
    }),
  }).catch(() => {});
}

/** One profile_view per listing per browser session on public detail. */
export function trackComidaLocalProfileViewOnce(ctx: ComidaLocalAnalyticsContext): void {
  const listingId = ctx.listingId.trim();
  if (!listingId || typeof window === "undefined") return;

  const guardKey = `lx_cl_profile_view_${listingId}`;
  if (sessionStorage.getItem(guardKey)) return;
  sessionStorage.setItem(guardKey, "1");

  trackComidaLocalListingEvent({
    listingId,
    leonixAdId: ctx.leonixAdId,
    eventType: "profile_view",
    source: "detail_header",
    metadata: ctx.slug ? { slug: ctx.slug } : undefined,
  });
}
