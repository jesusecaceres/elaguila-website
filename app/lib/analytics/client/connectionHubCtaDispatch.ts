/**
 * Package D Build D2, Gate 5 — unified Connection Hub CTA analytics dispatch contract.
 *
 * ONE truthful click-event dispatcher for every Connection Hub-style CTA (phone, WhatsApp, email,
 * website, directions, share, social, review), built on the existing server-validated pipeline
 * (`recordAnalyticsEvent` → POST /api/analytics/events → `listing_analytics`). No new table, no new
 * schema. Reuses `ListingAnalyticsEventType` — never invents a parallel event vocabulary.
 *
 * Rules:
 *  - Click tracking means CLICK only. Never call this to represent a message send, lead, or
 *    conversion that did not actually occur.
 *  - Social and review CTAs use the existing generic `cta_click` type with truthful
 *    `metadata.cta`/`metadata.provider` — the allowlist has no dedicated social_click/review_click
 *    type, and adding one is an unnecessary schema/allowlist change for D2.
 */
import { recordAnalyticsEvent } from "./recordAnalyticsEvent";
import type { ListingAnalyticsSourceTable } from "@/app/lib/analytics/listingAnalyticsIdentity";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";

export type ConnectionHubCtaKind =
  | "phone"
  | "whatsapp"
  | "email"
  | "website"
  | "directions"
  | "share"
  | "social"
  | "review";

export type ConnectionHubCtaDispatchInput = {
  kind: ConnectionHubCtaKind;
  category: string;
  sourceTable: ListingAnalyticsSourceTable | string;
  sourceId: string;
  surface: string;
  /** Required for kind "social" (e.g. "facebook", "instagram", "tiktok") and "review" (e.g.
   * "google", "yelp") — truthfully identifies which provider/platform was clicked. */
  provider?: string;
  leonixAdId?: string | null;
  anonymousSessionId?: string;
  accessToken?: string | null;
};

const DIRECT_EVENT_TYPE: Partial<Record<ConnectionHubCtaKind, ListingAnalyticsEventType>> = {
  phone: "phone_click",
  whatsapp: "whatsapp_click",
  email: "email_click",
  website: "website_click",
  directions: "directions_click",
  share: "listing_share",
};

function resolveEventType(kind: ConnectionHubCtaKind): ListingAnalyticsEventType {
  return DIRECT_EVENT_TYPE[kind] ?? "cta_click";
}

/** Fire-and-forget: never throws, mirrors the existing `*GlobalAnalytics.ts` wrapper convention. */
export function dispatchConnectionHubCta(input: ConnectionHubCtaDispatchInput): void {
  const sourceId = input.sourceId.trim();
  if (!sourceId) return;

  const eventType = resolveEventType(input.kind);
  const metadata: Record<string, unknown> = { cta: input.kind, surface: input.surface };
  if (input.provider) metadata.provider = input.provider;

  void recordAnalyticsEvent({
    event_type: eventType,
    source_table: input.sourceTable,
    source_id: sourceId,
    category: input.category,
    event_source: "business_hub",
    canonical_ad_id: input.leonixAdId?.trim() || undefined,
    anonymous_session_id: input.anonymousSessionId,
    accessToken: input.accessToken,
    metadata,
  });
}
