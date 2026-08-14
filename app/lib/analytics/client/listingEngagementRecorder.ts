/**
 * Gate I.10A — Generic canonical listing-engagement recorder.
 *
 * A category-agnostic dispatcher over the canonical, server-validated pipeline
 * (`recordAnalyticsEvent` -> `POST /api/analytics/events`). For category families that
 * already have their own typed adapter (e.g. Comunidad/Clases/Busco's
 * `comunidadClasesBuscoGlobalAnalytics.ts`, Bienes Raíces' `brGlobalAnalytics.ts`, Empleos'
 * `recordEmpleosGlobalAnalytics.ts`), prefer that adapter — this module exists for call sites
 * that don't have one and shouldn't invent a one-off duplicate.
 *
 * No server-only imports. No PII. No category-specific UI or product rules — pure dispatch.
 *
 * "Pipeline": the identity model has no separate pipeline taxonomy beyond `sourceTable` +
 * `category` (see `ListingAnalyticsIdentity`). `sourceTable` is what actually disambiguates
 * pipeline at the DB layer today, so it stands in for "pipeline" here rather than inventing
 * an ungrounded new enum.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type {
  ListingAnalyticsCategory,
  ListingAnalyticsSourceTable,
} from "@/app/lib/analytics/listingAnalyticsIdentity";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export type ListingEngagementIdentity = {
  sourceTable: ListingAnalyticsSourceTable;
  /** Real DB row id. For `listings`/`autos_classifieds_listings` this must be the row UUID. */
  sourceId: string;
  category: ListingAnalyticsCategory;
  canonicalAdId?: string;
};

export type ListingEngagementCtaType =
  | "phone"
  | "sms"
  | "whatsapp"
  | "email"
  | "website"
  | "directions";

type RecordOpts = {
  eventSource?: string;
  metadata?: Record<string, unknown>;
  /** Supabase access token — required for auth-gated event types (e.g. listing_save). */
  accessToken?: string | null;
};

const CTA_EVENT_TYPE: Record<ListingEngagementCtaType, ListingAnalyticsEventType> = {
  phone: "phone_click",
  sms: "message_click",
  whatsapp: "whatsapp_click",
  email: "email_click",
  website: "website_click",
  directions: "directions_click",
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

function defaultCooldownMs(eventType: ListingAnalyticsEventType): number {
  switch (eventType) {
    case "listing_view":
    case "listing_open":
      return 5000;
    case "result_card_click":
      return 1000;
    case "listing_like":
    case "listing_unlike":
    case "listing_save":
    case "listing_unsave":
      return 100;
    default:
      return 500;
  }
}

function recordListingEngagementEvent(
  identity: ListingEngagementIdentity,
  eventType: ListingAnalyticsEventType,
  opts: RecordOpts = {},
): void {
  const sourceId = identity.sourceId.trim();
  const sourceTable = identity.sourceTable.trim();
  if (!sourceId || !sourceTable) return; // fail closed: no provable identity, no request.

  if (!allowClientDedupe(eventType, `${sourceTable}:${sourceId}`, defaultCooldownMs(eventType))) return;

  const token = opts.accessToken?.trim() || null;
  void recordAnalyticsEvent({
    event_type: eventType,
    source_table: sourceTable,
    source_id: sourceId,
    category: identity.category,
    event_source: opts.eventSource,
    metadata: opts.metadata,
    canonical_ad_id: identity.canonicalAdId,
    anonymous_session_id: token ? undefined : getAnonymousSessionId(),
    accessToken: token,
  }).catch(() => {});
}

/** Detail-page mount: fires both `listing_view` and `listing_open` (existing dual-fire convention). */
export function trackListingViewOpen(identity: ListingEngagementIdentity, opts?: RecordOpts): void {
  recordListingEngagementEvent(identity, "listing_view", opts);
  recordListingEngagementEvent(identity, "listing_open", opts);
}

export function trackListingLikeToggle(
  identity: ListingEngagementIdentity,
  isLike: boolean,
  opts?: RecordOpts,
): void {
  recordListingEngagementEvent(identity, isLike ? "listing_like" : "listing_unlike", opts);
}

/** `listing_save`/`listing_unsave` are auth-required server-side — pass `accessToken` in opts. */
export async function trackListingSaveToggle(
  identity: ListingEngagementIdentity,
  isSave: boolean,
  opts?: RecordOpts,
): Promise<void> {
  recordListingEngagementEvent(identity, isSave ? "listing_save" : "listing_unsave", opts);
}

/**
 * Same as `trackListingSaveToggle`, but resolves the current Supabase session's access token
 * first so the auth-required `listing_save`/`listing_unsave` event actually authenticates
 * server-side. Fails closed to an unauthenticated (session-less) attempt rather than throwing.
 */
export async function trackListingSaveToggleAuthed(
  identity: ListingEngagementIdentity,
  isSave: boolean,
  opts?: Omit<RecordOpts, "accessToken">,
): Promise<void> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    await trackListingSaveToggle(identity, isSave, {
      ...opts,
      accessToken: data.session?.access_token ?? null,
    });
  } catch {
    await trackListingSaveToggle(identity, isSave, opts);
  }
}

export function trackListingShare(
  identity: ListingEngagementIdentity,
  shareMethod: string,
  opts?: RecordOpts,
): void {
  recordListingEngagementEvent(identity, "listing_share", {
    ...opts,
    metadata: { shareMethod, ...opts?.metadata },
  });
}

export function trackListingCta(
  identity: ListingEngagementIdentity,
  ctaType: ListingEngagementCtaType,
  opts?: RecordOpts,
): void {
  recordListingEngagementEvent(identity, CTA_EVENT_TYPE[ctaType], {
    ...opts,
    metadata: { ctaType, ...opts?.metadata },
  });
}
