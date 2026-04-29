/**
 * Autos category analytics - extended integration with shared Clasificados analytics
 * Extends existing autos analytics with new event types and shared system
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
 * Track an autos listing view using shared system
 */
export async function trackAutosListingViewShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingView(listingId, {
    category: "autos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an autos like/unlike action (new functionality)
 */
export async function trackAutosLike(
  listingId: string,
  isLike: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingLike(listingId, isLike, {
    category: "autos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an autos save/unsave action using shared system
 */
export async function trackAutosSaveShared(
  listingId: string,
  isSave: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingSave(listingId, isSave, {
    category: "autos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an autos share action using shared system
 */
export async function trackAutosShareShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    shareMethod?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingShare(listingId, {
    category: "autos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "share_modal",
    shareMethod: options.shareMethod,
    metadata: options.metadata,
  });
}

/**
 * Track an autos CTA click (phone, whatsapp, website, directions, appointment, financing)
 */
export async function trackAutosCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "appointment" | "financing" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  // Map autos-specific CTA types to general CTA types
  const mappedCtaType = ctaType === "appointment" || ctaType === "financing" ? "general" : ctaType;
  
  await trackCtaClick(listingId, mappedCtaType, {
    category: "autos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "cta_card",
    metadata: { originalCtaType: ctaType, ...options.metadata },
  });
}

/**
 * Track an autos lead/inquiry using shared system
 */
export async function trackAutosLeadShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    leadType?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackLeadCreated(listingId, {
    category: "autos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    leadType: options.leadType || "inquiry",
    metadata: options.metadata,
  });
}
