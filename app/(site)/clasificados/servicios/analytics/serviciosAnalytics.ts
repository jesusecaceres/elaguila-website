/**
 * Servicios category analytics - integration with shared Clasificados analytics
 * Provides category-specific tracking functions for servicios listings
 */

import { 
  trackListingView, 
  trackListingSave, 
  trackListingShare,
  trackCtaClick,
  trackLeadCreated,
  type EventSource 
} from "@/app/lib/clasificadosAnalytics";

/**
 * Track a servicios listing view
 */
export async function trackServiciosListingView(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingView(listingId, {
    category: "servicios",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track a servicios save/unsave action
 */
export async function trackServiciosSave(
  listingId: string,
  isSave: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingSave(listingId, isSave, {
    category: "servicios",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track a servicios share action
 */
export async function trackServiciosShare(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    shareMethod?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingShare(listingId, {
    category: "servicios",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "share_modal",
    shareMethod: options.shareMethod,
    metadata: options.metadata,
  });
}

/**
 * Track a servicios CTA click (phone, whatsapp, website, etc.)
 */
export async function trackServiciosCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackCtaClick(listingId, ctaType, {
    category: "servicios",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "cta_card",
    metadata: options.metadata,
  });
}

/**
 * Track a servicios lead/inquiry
 */
export async function trackServiciosLead(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    leadType?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackLeadCreated(listingId, {
    category: "servicios",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    leadType: options.leadType || "inquiry",
    metadata: options.metadata,
  });
}
