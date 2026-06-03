import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
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

function eventSourceForMeta(meta?: AutosAnalyticsTrackMeta): string {
  const source = String(meta?.source ?? "");
  if (source.includes("card") || source.includes("result")) return "results_card_contact";
  return "detail_contact";
}

export function trackAutosListingContactCta(
  ctaType: AutosContactCtaType,
  meta?: AutosAnalyticsTrackMeta,
): void {
  const listing = listingFromMeta(meta);
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
