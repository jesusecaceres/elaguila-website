/**
 * Empleos category analytics - extended integration with shared Clasificados analytics
 * Extends existing empleos analytics with application tracking and shared system
 */

import { 
  trackListingView, 
  trackListingSave, 
  trackListingShare,
  trackCtaClick,
  trackApplicationEvent,
  trackListingLike,
  type EventSource 
} from "@/app/lib/clasificadosAnalytics";

/**
 * Track an empleos listing view using shared system
 */
export async function trackEmpleosListingViewShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingView(listingId, {
    category: "empleos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an empleos like/unlike action (new functionality)
 */
export async function trackEmpleosLike(
  listingId: string,
  isLike: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingLike(listingId, isLike, {
    category: "empleos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an empleos save/unsave action using shared system
 */
export async function trackEmpleosSaveShared(
  listingId: string,
  isSave: boolean,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingSave(listingId, isSave, {
    category: "empleos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an empleos share action using shared system
 */
export async function trackEmpleosShareShared(
  listingId: string,
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    shareMethod?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackListingShare(listingId, {
    category: "empleos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "share_modal",
    shareMethod: options.shareMethod,
    metadata: options.metadata,
  });
}

/**
 * Track an empleos application event (started or submitted)
 */
export async function trackEmpleosApplication(
  listingId: string,
  stage: "started" | "submitted",
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackApplicationEvent(listingId, stage, {
    category: "empleos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "detail",
    metadata: options.metadata,
  });
}

/**
 * Track an empleos CTA click (phone, whatsapp, website, directions)
 */
export async function trackEmpleosCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
) {
  await trackCtaClick(listingId, ctaType, {
    category: "empleos",
    ownerUserId: options.ownerUserId,
    eventSource: options.eventSource || "cta_card",
    metadata: options.metadata,
  });
}
