/**
 * A5.ANALYTICS-01 — Autos Negocios / dealer listings global analytics adapter.
 * Wraps POST /api/analytics/events via recordAutosGlobalAnalytics (no competing system).
 */
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import {
  AUTOS_ANALYTICS_CATEGORY,
  AUTOS_ANALYTICS_SOURCE_TABLE,
  autosGlobalLikeRecorder,
  autosGlobalListingFromRow,
  autosGlobalShareRecorder,
  recordAutosGlobalAnalyticsEvent,
  recordAutosGlobalAnalyticsEventAuthed,
  type AutosGlobalAnalyticsListing,
} from "@/app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics";
import type { AutosPublicListingAnalyticsProps } from "@/app/(site)/clasificados/autos/lib/autosAnalyticsIdentity";

export type AutosGlobalAnalyticsContext = {
  /** Internal listing UUID — analytics source_id */
  listingUuid: string;
  leonixAdId?: string | null;
  inventoryRole?: "main" | "inventory_vehicle" | null;
  dealerInventoryGroupId?: string | null;
  dealerInventoryParentListingId?: string | null;
  lane?: string;
};

export function autosAnalyticsContextFromProps(
  props?: AutosPublicListingAnalyticsProps | null,
): AutosGlobalAnalyticsContext | null {
  const listingUuid = props?.listingSourceId?.trim();
  if (!listingUuid) return null;
  return {
    listingUuid,
    leonixAdId: props?.leonixAdId?.trim() || null,
    inventoryRole: props?.inventoryRole ?? null,
    dealerInventoryGroupId: props?.dealerInventoryGroupId?.trim() || null,
    dealerInventoryParentListingId: props?.dealerInventoryParentListingId?.trim() || null,
    lane: props?.lane,
  };
}

function listingFromContext(ctx: AutosGlobalAnalyticsContext): AutosGlobalAnalyticsListing | null {
  return autosGlobalListingFromRow({ id: ctx.listingUuid, leonix_ad_id: ctx.leonixAdId });
}

function inventoryMetadata(ctx: AutosGlobalAnalyticsContext): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (ctx.inventoryRole) meta.inventory_role = ctx.inventoryRole;
  if (ctx.dealerInventoryGroupId) meta.dealer_inventory_group_id = ctx.dealerInventoryGroupId;
  if (ctx.dealerInventoryParentListingId) {
    meta.dealer_inventory_parent_listing_id = ctx.dealerInventoryParentListingId;
  }
  if (ctx.lane) meta.lane = ctx.lane;
  return meta;
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

function trackAutosEvent(
  ctx: AutosGlobalAnalyticsContext,
  eventType: ListingAnalyticsEventType,
  eventSource: string,
  opts?: { metadata?: Record<string, unknown>; cooldownMs?: number },
): void {
  const listing = listingFromContext(ctx);
  if (!listing) return;
  const cooldown = opts?.cooldownMs ?? (eventType === "listing_view" ? 5000 : 500);
  if (!allowClientDedupe(eventType, ctx.listingUuid, cooldown)) return;
  recordAutosGlobalAnalyticsEvent(listing, eventType, {
    event_source: eventSource,
    metadata: { ...inventoryMetadata(ctx), ...(opts?.metadata ?? {}) },
  });
}

/** Named dealer CTA — stored as cta_click with canonical cta key in metadata. */
export function trackAutosNamedCtaClick(
  ctx: AutosGlobalAnalyticsContext,
  cta:
    | "google_business_click"
    | "google_reviews_click"
    | "yelp_click"
    | "schedule_test_drive_click"
    | "finance_preapproval_click"
    | "custom_link_click"
    | "dealer_inventory_open",
  eventSource = "detail",
): void {
  trackAutosEvent(ctx, "cta_click", eventSource, { metadata: { cta } });
}

export function trackAutosListingViewGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosEvent(ctx, "listing_view", "detail");
}

export function trackAutosListingOpenGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosEvent(ctx, "listing_open", "results_card", { cooldownMs: 1000 });
}

export function trackAutosResultCardClickGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosEvent(ctx, "result_card_click", "results_card", { cooldownMs: 1000 });
}

export function trackAutosListingShareGlobal(
  ctx: AutosGlobalAnalyticsContext,
  shareMethod?: string,
  eventSource: "detail" | "results_card" = "detail",
): void {
  trackAutosEvent(ctx, "listing_share", eventSource, {
    metadata: shareMethod ? { shareMethod } : undefined,
  });
}

export function trackAutosPhoneClickGlobal(ctx: AutosGlobalAnalyticsContext, eventSource = "detail"): void {
  trackAutosEvent(ctx, "phone_click", eventSource);
}

export function trackAutosWhatsAppClickGlobal(ctx: AutosGlobalAnalyticsContext, eventSource = "detail"): void {
  trackAutosEvent(ctx, "whatsapp_click", eventSource);
}

export function trackAutosEmailClickGlobal(ctx: AutosGlobalAnalyticsContext, eventSource = "detail"): void {
  trackAutosEvent(ctx, "email_click", eventSource);
}

export function trackAutosTextMessageClickGlobal(ctx: AutosGlobalAnalyticsContext, eventSource = "detail"): void {
  trackAutosEvent(ctx, "message_click", eventSource, { metadata: { contact_method: "sms" } });
}

export function trackAutosWebsiteClickGlobal(ctx: AutosGlobalAnalyticsContext, eventSource = "detail"): void {
  trackAutosEvent(ctx, "website_click", eventSource);
}

export function trackAutosDirectionsClickGlobal(ctx: AutosGlobalAnalyticsContext, eventSource = "detail"): void {
  trackAutosEvent(ctx, "directions_click", eventSource);
}

export function trackAutosScheduleTestDriveClickGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosNamedCtaClick(ctx, "schedule_test_drive_click");
}

export function trackAutosFinancePreapprovalClickGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosNamedCtaClick(ctx, "finance_preapproval_click");
}

export function trackAutosGoogleBusinessClickGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosNamedCtaClick(ctx, "google_business_click");
}

export function trackAutosGoogleReviewsClickGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosNamedCtaClick(ctx, "google_reviews_click");
}

export function trackAutosYelpClickGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosNamedCtaClick(ctx, "yelp_click");
}

export function trackAutosCustomLinkClickGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosNamedCtaClick(ctx, "custom_link_click");
}

export function trackAutosDealerInventoryOpenGlobal(ctx: AutosGlobalAnalyticsContext): void {
  trackAutosNamedCtaClick(ctx, "dealer_inventory_open");
}

export function autosGlobalLikeRecorderFromContext(ctx: AutosGlobalAnalyticsContext) {
  const listing = listingFromContext(ctx);
  if (!listing) return undefined;
  return autosGlobalLikeRecorder(listing);
}

export function autosGlobalShareRecorderFromContext(
  ctx: AutosGlobalAnalyticsContext,
  eventSource: "detail_share" | "results_card_share" = "detail_share",
) {
  const listing = listingFromContext(ctx);
  if (!listing) return undefined;
  return autosGlobalShareRecorder(listing, eventSource);
}

export async function trackAutosLikeGlobal(ctx: AutosGlobalAnalyticsContext, isLike: boolean): Promise<void> {
  const listing = listingFromContext(ctx);
  if (!listing) return;
  await recordAutosGlobalAnalyticsEventAuthed(listing, isLike ? "listing_like" : "listing_unlike", {
    event_source: "detail",
    metadata: inventoryMetadata(ctx),
  });
}

export { AUTOS_ANALYTICS_CATEGORY, AUTOS_ANALYTICS_SOURCE_TABLE };
