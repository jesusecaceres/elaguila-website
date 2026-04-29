/**
 * Restaurantes category analytics - integration with shared Clasificados analytics
 * Provides category-specific tracking functions for restaurantes listings
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
 * Track a restaurantes listing view
 */
export async function trackRestaurantesListingView(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingView(listingId, {
    category: "restaurantes",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track a restaurantes like/unlike action
 */
export async function trackRestaurantesLike(
  listingId: string,
  isLike: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingLike(listingId, isLike, {
    category: "restaurantes",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track a restaurantes save/unsave action
 */
export async function trackRestaurantesSave(
  listingId: string,
  isSave: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingSave(listingId, isSave, {
    category: "restaurantes",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track a restaurantes share action
 */
export async function trackRestaurantesShare(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    shareMethod?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingShare(listingId, {
    category: "restaurantes",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "share_modal",
    shareMethod: options.shareMethod,
    metadata: options.metadata,
  });
}

/**
 * Track a restaurantes CTA click (phone, whatsapp, website, directions, order, reserve)
 */
export async function trackRestaurantesCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "order" | "reserve" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  // Map restaurant-specific CTA types to general CTA types
  const mappedCtaType = ctaType === "order" || ctaType === "reserve" ? "general" : ctaType;
  
  await trackCtaClick(listingId, mappedCtaType, {
    category: "restaurantes",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "cta_card",
    metadata: { originalCtaType: ctaType, ...options.metadata },
  });
}

/**
 * Track a restaurantes lead/inquiry (reservation, catering inquiry, etc.)
 */
export async function trackRestaurantesLead(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    leadType?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackLeadCreated(listingId, {
    category: "restaurantes",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    leadType: options.leadType || "inquiry",
    metadata: options.metadata,
  });
}
