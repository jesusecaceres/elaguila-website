"use client";

import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import {
  trackListingCta,
  trackListingShare,
  trackListingViewOpen,
  type ListingEngagementCtaType,
} from "@/app/lib/analytics/client/listingEngagementRecorder";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { leonixAnalyticsAllowed } from "@/app/lib/leonixPublicConsent";
import type { OfertaLocalPublicSearchItem } from "./ofertasLocalesTypes";

type OfertasAnalyticsIdentity = {
  ofertaLocalId: string;
  leonixAdId?: string | null;
};

const SOURCE_TABLE = "ofertas_locales";
const CATEGORY = "ofertas-locales";

function anonymousSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "lx_ofertas_analytics_session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const value = `ofertas_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, value);
  return value;
}

function base(identity: OfertasAnalyticsIdentity) {
  return {
    sourceTable: SOURCE_TABLE,
    sourceId: identity.ofertaLocalId,
    category: CATEGORY,
    canonicalAdId: identity.leonixAdId || undefined,
  };
}

function safeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (key.toLowerCase().includes("stripe") || key.toLowerCase().includes("payment")) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value == null) {
      out[key] = value;
    }
  }
  return out;
}

function canTrackAnalytics(): boolean {
  return typeof window !== "undefined" && leonixAnalyticsAllowed();
}

export function trackOfertaLocalListingOpen(identity: OfertasAnalyticsIdentity, surface: string): void {
  if (!canTrackAnalytics()) return;
  trackListingViewOpen(base(identity), {
    eventSource: surface,
    metadata: safeMetadata({ surface }),
  });
}

export function trackOfertaLocalShare(identity: OfertasAnalyticsIdentity, shareMethod: string, surface: string): void {
  if (!canTrackAnalytics()) return;
  trackListingShare(base(identity), shareMethod, {
    eventSource: surface,
    metadata: safeMetadata({ surface }),
  });
}

export function trackOfertaLocalCta(identity: OfertasAnalyticsIdentity, ctaType: ListingEngagementCtaType, surface: string): void {
  if (!canTrackAnalytics()) return;
  trackListingCta(base(identity), ctaType, {
    eventSource: surface,
    metadata: safeMetadata({ surface }),
  });
}

export function trackOfertaLocalEvent(
  identity: OfertasAnalyticsIdentity,
  eventType: ListingAnalyticsEventType,
  metadata?: Record<string, unknown>,
): void {
  if (!canTrackAnalytics()) return;
  void recordAnalyticsEvent({
    event_type: eventType,
    source_table: SOURCE_TABLE,
    source_id: identity.ofertaLocalId,
    category: CATEGORY,
    canonical_ad_id: identity.leonixAdId || undefined,
    anonymous_session_id: anonymousSessionId(),
    event_source: "ofertas_public",
    metadata: safeMetadata(metadata),
  });
}

export function trackOfertaLocalProductOpen(identity: OfertasAnalyticsIdentity, item: OfertaLocalPublicSearchItem, surface: string): void {
  trackOfertaLocalEvent(identity, item.offerType === "weekly_flyer" ? "product_open" : "coupon_open", {
    surface,
    productId: item.id,
    productType: item.offerType,
    partnerStatus: item.partner.isVerifiedPartner ? "verified_partner" : "standard",
  });
}
