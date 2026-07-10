import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import {
  autosAnalyticsContextFromProps,
  trackAutosCustomLinkClickGlobal,
  trackAutosDirectionsClickGlobal,
  trackAutosEmailClickGlobal,
  trackAutosFinancePreapprovalClickGlobal,
  trackAutosGoogleBusinessClickGlobal,
  trackAutosGoogleReviewsClickGlobal,
  trackAutosNamedCtaClick,
  trackAutosPhoneClickGlobal,
  trackAutosScheduleTestDriveClickGlobal,
  trackAutosTextMessageClickGlobal,
  trackAutosWebsiteClickGlobal,
  trackAutosWhatsAppClickGlobal,
  trackAutosYelpClickGlobal,
} from "@/app/lib/clasificados/autos/analytics/autosGlobalAnalytics";
import type { AutosPublicListingAnalyticsProps } from "./autosAnalyticsIdentity";
import {
  autosGlobalListingFromRow,
  recordAutosGlobalAnalyticsEvent,
  type AutosGlobalAnalyticsListing,
} from "./recordAutosGlobalAnalytics";
import type { AutosAnalyticsTrackMeta } from "./autosAnalyticsIdentity";

export type AutosContactCtaType =
  | "phone"
  | "whatsapp"
  | "email"
  | "message"
  | "website"
  | "directions"
  | "contact";

function listingFromMeta(meta?: AutosAnalyticsTrackMeta): AutosGlobalAnalyticsListing | null {
  const sourceId = (meta?.sourceId ?? "").trim();
  if (!sourceId) return null;
  return autosGlobalListingFromRow({ id: sourceId, leonix_ad_id: meta?.leonixAdId });
}

function analyticsContextFromMeta(meta?: AutosAnalyticsTrackMeta) {
  const sourceId = (meta?.sourceId ?? "").trim();
  if (!sourceId) return null;
  return autosAnalyticsContextFromProps({
    listingSourceId: sourceId,
    leonixAdId: meta?.leonixAdId,
    lane: meta?.lane,
    inventoryRole: meta?.inventoryRole as AutosPublicListingAnalyticsProps["inventoryRole"],
    dealerInventoryGroupId: meta?.dealerInventoryGroupId as string | null | undefined,
    dealerInventoryParentListingId: meta?.dealerInventoryParentListingId as string | null | undefined,
  });
}

function eventSourceForMeta(meta?: AutosAnalyticsTrackMeta): string {
  const source = String(meta?.source ?? "");
  if (source.includes("card") || source.includes("result")) return "results_card_contact";
  return "detail_contact";
}

export function trackAutosListingContactCta(
  ctaType: AutosContactCtaType,
  meta?: AutosAnalyticsTrackMeta,
): void {
  const ctx = analyticsContextFromMeta(meta);
  const listing = listingFromMeta(meta);
  const eventSource = eventSourceForMeta(meta);

  if (ctx) {
    if (ctaType === "phone") trackAutosPhoneClickGlobal(ctx, eventSource);
    else if (ctaType === "whatsapp") trackAutosWhatsAppClickGlobal(ctx, eventSource);
    else if (ctaType === "email") trackAutosEmailClickGlobal(ctx, eventSource);
    else if (ctaType === "message") trackAutosTextMessageClickGlobal(ctx, eventSource);
    else if (ctaType === "website") trackAutosWebsiteClickGlobal(ctx, eventSource);
    else if (ctaType === "directions") trackAutosDirectionsClickGlobal(ctx, eventSource);
    else if (ctaType === "contact") {
      trackAutosEventLegacy(listing, "contact_click", eventSource, meta);
    }
    return;
  }

  if (!listing) return;

  const map: Record<AutosContactCtaType, ListingAnalyticsEventType> = {
    phone: "phone_click",
    whatsapp: "whatsapp_click",
    email: "email_click",
    message: "message_click",
    website: "website_click",
    directions: "directions_click",
    contact: "contact_click",
  };
  const globalType = map[ctaType];
  if (!globalType) return;

  recordAutosGlobalAnalyticsEvent(listing, globalType, {
    event_source: eventSourceForMeta(meta),
    metadata: {
      contact_method: ctaType,
      lane: meta?.lane,
      ...(meta ?? {}),
    },
  });
}

function trackAutosEventLegacy(
  listing: AutosGlobalAnalyticsListing | null,
  eventType: ListingAnalyticsEventType,
  eventSource: string,
  meta?: AutosAnalyticsTrackMeta,
): void {
  if (!listing) return;
  recordAutosGlobalAnalyticsEvent(listing, eventType, {
    event_source: eventSource,
    metadata: {
      lane: meta?.lane,
      ...(meta ?? {}),
    },
  });
}

export function trackAutosGoogleReviewsCta(meta?: AutosAnalyticsTrackMeta): void {
  const ctx = analyticsContextFromMeta(meta);
  if (ctx) trackAutosGoogleReviewsClickGlobal(ctx);
}

export function trackAutosYelpCta(meta?: AutosAnalyticsTrackMeta): void {
  const ctx = analyticsContextFromMeta(meta);
  if (ctx) trackAutosYelpClickGlobal(ctx);
}

export function trackAutosGoogleBusinessCta(meta?: AutosAnalyticsTrackMeta): void {
  const ctx = analyticsContextFromMeta(meta);
  if (ctx) trackAutosGoogleBusinessClickGlobal(ctx);
}

export function trackAutosCustomDealershipLinkCta(meta?: AutosAnalyticsTrackMeta): void {
  const ctx = analyticsContextFromMeta(meta);
  if (ctx) trackAutosCustomLinkClickGlobal(ctx);
}

export function trackAutosScheduleTestDriveCta(meta?: AutosAnalyticsTrackMeta): void {
  const ctx = analyticsContextFromMeta(meta);
  if (ctx) trackAutosScheduleTestDriveClickGlobal(ctx);
}

export function trackAutosFinancePreapprovalCta(meta?: AutosAnalyticsTrackMeta): void {
  const ctx = analyticsContextFromMeta(meta);
  if (ctx) trackAutosFinancePreapprovalClickGlobal(ctx);
}

export function trackAutosDealerInventoryOpenCta(meta?: AutosAnalyticsTrackMeta): void {
  const ctx = analyticsContextFromMeta(meta);
  if (ctx) trackAutosNamedCtaClick(ctx, "dealer_inventory_open");
}

/** Infer contact CTA type from href and record global analytics (AUTO1). */
export function trackAutosContactFromHref(href: string, meta?: AutosAnalyticsTrackMeta): void {
  const h = href.trim().toLowerCase();
  if (!h) return;
  if (h.startsWith("tel:")) {
    trackAutosListingContactCta("phone", meta);
    return;
  }
  if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(h)) {
    trackAutosListingContactCta("whatsapp", meta);
    return;
  }
  if (h.startsWith("mailto:")) {
    trackAutosListingContactCta("email", meta);
    return;
  }
  if (h.startsWith("sms:")) {
    trackAutosListingContactCta("message", meta);
    return;
  }
  if (/google\.com\/maps|maps\.app\.goo\.gl|maps\.google/.test(h)) {
    trackAutosListingContactCta("directions", meta);
    return;
  }
  if (h.startsWith("http://") || h.startsWith("https://")) {
    trackAutosListingContactCta("website", meta);
  }
}

export function trackAutosPublicProfileView(args: {
  listing: AutosGlobalAnalyticsListing;
  lane?: string;
}): void {
  recordAutosGlobalAnalyticsEvent(args.listing, "listing_view", {
    event_source: "detail",
    metadata: args.lane ? { lane: args.lane } : undefined,
  });
}

export function trackAutosResultCardClick(row: {
  id: string;
  leonix_ad_id?: string | null;
  lane?: string;
}): void {
  const listing = autosGlobalListingFromRow(row);
  if (!listing) return;
  recordAutosGlobalAnalyticsEvent(listing, "result_card_click", {
    event_source: "results_card",
    metadata: row.lane ? { lane: row.lane } : undefined,
  });
}
