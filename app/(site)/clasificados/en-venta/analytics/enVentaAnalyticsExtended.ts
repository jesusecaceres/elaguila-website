/**
 * En Venta category analytics - extended integration with shared Clasificados analytics
 * Extends existing enVentaAnalytics.ts with new event types and shared system
 */

import { 
  trackListingView, 
  trackListingSave, 
  trackListingShare,
  trackCtaClick,
  trackLeadCreated,
  trackListingLike,
  type EventSource 
} from "@/app/lib/clasificadosAnalytics";

/**
 * Track an en-venta listing view using shared system
 */
export async function trackEnVentaListingViewShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingView(listingId, {
    category: "en-venta",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an en-venta like/unlike action (new functionality)
 */
export async function trackEnVentaLike(
  listingId: string,
  isLike: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingLike(listingId, isLike, {
    category: "en-venta",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an en-venta save/unsave action using shared system
 */
export async function trackEnVentaSaveShared(
  listingId: string,
  isSave: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingSave(listingId, isSave, {
    category: "en-venta",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an en-venta share action using shared system
 */
export async function trackEnVentaShareShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    shareMethod?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingShare(listingId, {
    category: "en-venta",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "share_modal",
    shareMethod: options.shareMethod,
    metadata: options.metadata,
  });
}

/**
 * Track an en-venta CTA click (phone, whatsapp, website, directions)
 */
export async function trackEnVentaCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackCtaClick(listingId, ctaType, {
    category: "en-venta",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "cta_card",
    metadata: options.metadata,
  });
}

/**
 * Track an en-venta lead/inquiry using shared system
 */
export async function trackEnVentaLeadShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    leadType?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackLeadCreated(listingId, {
    category: "en-venta",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    leadType: options.leadType || "inquiry",
    metadata: options.metadata,
  });
}
