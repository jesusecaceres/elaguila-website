import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import {
  empleosGlobalListingFromRow,
  recordEmpleosGlobalAnalyticsEvent,
  type EmpleosGlobalAnalyticsListing,
} from "./recordEmpleosGlobalAnalytics";
import type { EmpleosAnalyticsTrackMeta } from "./empleosAnalyticsIdentity";

export type EmpleosContactCtaType =
  | "phone"
  | "whatsapp"
  | "email"
  | "message"
  | "website"
  | "directions"
  | "contact";

export type EmpleosApplyMethod = "internal" | "external_url" | "email" | "phone" | "whatsapp" | "unknown";

function listingFromMeta(meta?: EmpleosAnalyticsTrackMeta): EmpleosGlobalAnalyticsListing | null {
  const sourceId = (meta?.sourceId ?? "").trim();
  if (!sourceId) return null;
  return empleosGlobalListingFromRow({
    id: sourceId,
    slug: meta?.slug,
    leonix_ad_id: meta?.leonixAdId,
  });
}

function eventSourceForMeta(meta?: EmpleosAnalyticsTrackMeta): string {
  const source = String(meta?.source ?? "");
  if (source.includes("card") || source.includes("result")) return "results_card_contact";
  if (source.includes("apply")) return "detail_apply";
  return "detail_contact";
}

export function trackEmpleosListingContactCta(
  ctaType: EmpleosContactCtaType,
  meta?: EmpleosAnalyticsTrackMeta,
  opts?: { useOutbound?: boolean },
): void {
  const listing = listingFromMeta(meta);
  if (!listing) return;

  const map: Record<EmpleosContactCtaType, ListingAnalyticsEventType> = {
    phone: "phone_click",
    whatsapp: "whatsapp_click",
    email: "email_click",
    message: "message_click",
    website: opts?.useOutbound ? "outbound_click" : "website_click",
    directions: "directions_click",
    contact: "contact_click",
  };
  const globalType = map[ctaType];
  if (!globalType) return;

  recordEmpleosGlobalAnalyticsEvent(listing, globalType, {
    event_source: eventSourceForMeta(meta),
    metadata: {
      contact_method: ctaType,
      ...(meta ?? {}),
    },
  });
}

export function trackEmpleosContactFromHref(href: string, meta?: EmpleosAnalyticsTrackMeta): void {
  const h = href.trim().toLowerCase();
  if (!h) return;
  if (h.startsWith("tel:")) {
    trackEmpleosListingContactCta("phone", meta);
    return;
  }
  if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(h)) {
    trackEmpleosListingContactCta("whatsapp", meta);
    return;
  }
  if (h.startsWith("mailto:")) {
    trackEmpleosListingContactCta("email", meta);
    return;
  }
  if (h.startsWith("sms:")) {
    trackEmpleosListingContactCta("message", meta);
    return;
  }
  if (/google\.com\/maps|maps\.app\.goo\.gl|maps\.google/.test(h)) {
    trackEmpleosListingContactCta("directions", meta);
    return;
  }
  if (h.startsWith("http://") || h.startsWith("https://")) {
    trackEmpleosListingContactCta("website", meta, { useOutbound: true });
  }
}

export function trackEmpleosPublicProfileView(listing: EmpleosGlobalAnalyticsListing): void {
  recordEmpleosGlobalAnalyticsEvent(listing, "listing_view", {
    event_source: "detail",
  });
}

export function trackEmpleosResultCardClick(row: {
  id: string;
  slug?: string | null;
  leonix_ad_id?: string | null;
}): void {
  const listing = empleosGlobalListingFromRow(row);
  if (!listing) return;
  recordEmpleosGlobalAnalyticsEvent(listing, "result_card_click", {
    event_source: "results_card",
  });
}

export function trackEmpleosApplyStarted(
  listing: EmpleosGlobalAnalyticsListing,
  applyMethod: EmpleosApplyMethod,
): void {
  recordEmpleosGlobalAnalyticsEvent(listing, "apply_started", {
    event_source: "detail_apply",
    metadata: { apply_method: applyMethod },
  });
}

export function trackEmpleosApplySubmitted(
  listing: EmpleosGlobalAnalyticsListing,
  applyMethod: EmpleosApplyMethod = "internal",
): void {
  recordEmpleosGlobalAnalyticsEvent(listing, "apply_submitted", {
    event_source: "detail_apply",
    metadata: { apply_method: applyMethod },
  });
}

/** Premium/quick sidebar sheet CTAs (no href). */
export function trackEmpleosSidebarContactCta(
  ctaType: EmpleosContactCtaType,
  meta?: EmpleosAnalyticsTrackMeta,
): void {
  trackEmpleosListingContactCta(ctaType, { ...meta, source: meta?.source ?? "detail_contact" });
}
