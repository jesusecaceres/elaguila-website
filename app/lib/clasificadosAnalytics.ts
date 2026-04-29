/**
 * Leonix Clasificados Analytics - Shared engagement tracking system
 * Supports comprehensive event tracking across all Clasificados categories
 */

import { createSupabaseBrowserClient } from "./supabase/browser";

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

export type ClasificadosEventType =
  // Existing events
  | "listing_view"
  | "listing_save" 
  | "listing_share"
  | "message_sent"
  | "profile_view"
  | "listing_open"
  // New engagement events
  | "listing_like"
  | "listing_unlike"
  | "listing_unsave"
  | "cta_click"
  | "lead_created"
  | "apply_started"
  | "apply_submitted"
  | "phone_click"
  | "whatsapp_click"
  | "website_click"
  | "directions_click";

export type EventSource = 
  | "card"
  | "detail" 
  | "preview"
  | "dashboard"
  | "share_modal"
  | "cta_card"
  | "search_results"
  | "unknown";

export type AnalyticsEvent = {
  listing_id?: string | null;
  listing_slug?: string | null;
  category?: string;
  event_type: ClasificadosEventType;
  event_source?: EventSource;
  owner_user_id?: string | null;
  actor_user_id?: string | null;
  anonymous_session_id?: string | null;
  metadata?: Record<string, any>;
};

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

/**
 * Generate or retrieve anonymous session ID for non-authenticated users
 */
function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "";
  
  const key = "lx_analytics_session";
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/**
 * Get current user ID from session (simplified)
 */
function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  // This would typically come from auth context
  // For now, we'll implement a simple check
  return null; // Will be populated by auth integration
}

// ---------------------------------------------------------------------------
// Double-Count Protection
// ---------------------------------------------------------------------------

/**
 * Prevent duplicate events within the same session
 */
class DuplicateEventProtection {
  private static instance: DuplicateEventProtection;
  private trackedEvents = new Map<string, number>(); // event_key -> timestamp
  
  static getInstance(): DuplicateEventProtection {
    if (!DuplicateEventProtection.instance) {
      DuplicateEventProtection.instance = new DuplicateEventProtection();
    }
    return DuplicateEventProtection.instance;
  }
  
  /**
   * Check if an event should be allowed (not duplicate)
   * Returns true if event is allowed, false if it should be blocked
   */
  shouldAllowEvent(
    eventType: ClasificadosEventType,
    listingId: string,
    userId: string | null,
    cooldownMs: number = 1000
  ): boolean {
    const key = this.getEventKey(eventType, listingId, userId);
    const lastTime = this.trackedEvents.get(key);
    const now = Date.now();
    
    if (lastTime && (now - lastTime) < cooldownMs) {
      return false; // Block duplicate
    }
    
    this.trackedEvents.set(key, now);
    return true;
  }
  
  private getEventKey(eventType: ClasificadosEventType, listingId: string, userId: string | null): string {
    return `${eventType}:${listingId}:${userId || 'anonymous'}`;
  }
  
  /**
   * Clean up old entries (optional maintenance)
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - (5 * 60 * 1000); // 5 minutes ago
    
    for (const [key, timestamp] of this.trackedEvents.entries()) {
      if (timestamp < cutoff) {
        this.trackedEvents.delete(key);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Core Tracking Functions
// ---------------------------------------------------------------------------

/**
 * Track an analytics event with double-count protection
 */
export async function trackClasificadosEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Get user context
    const userId = event.actor_user_id || getCurrentUserId();
    const sessionId = getAnonymousSessionId();
    
    // Apply double-count protection for certain event types
    const protection = DuplicateEventProtection.getInstance();
    
    if (event.listing_id) {
      const shouldAllow = protection.shouldAllowEvent(
        event.event_type,
        event.listing_id,
        userId,
        getCooldownForEventType(event.event_type)
      );
      
      if (!shouldAllow) {
        return; // Silently block duplicate
      }
    }
    
    // Prepare event payload
    const payload = {
      listing_id: event.listing_id || null,
      event_type: event.event_type,
      event_source: event.event_source || "unknown",
      user_id: userId,
      owner_user_id: event.owner_user_id || null,
      anonymous_session_id: userId ? null : sessionId,
      metadata: event.metadata || {},
    };
    
    // Send to database
    const supabase = createSupabaseBrowserClient();
    await supabase.from("listing_analytics").insert(payload);
    
  } catch (error) {
    // Fire-and-forget: do not block UI or throw
    console.warn("Analytics tracking failed:", error);
  }
}

/**
 * Get cooldown period for different event types (in milliseconds)
 */
function getCooldownForEventType(eventType: ClasificadosEventType): number {
  switch (eventType) {
    case "listing_view":
      return 5000; // 5 seconds for views
    case "listing_like":
    case "listing_unlike":
    case "listing_save":
    case "listing_unsave":
      return 100; // Quick for like/save actions
    case "listing_share":
      return 1000; // 1 second for shares
    case "cta_click":
    case "phone_click":
    case "whatsapp_click":
    case "website_click":
    case "directions_click":
      return 500; // 500ms for CTA clicks
    default:
      return 1000; // Default 1 second
  }
}

// ---------------------------------------------------------------------------
// Convenience Functions
// ---------------------------------------------------------------------------

/**
 * Track a listing view
 */
export async function trackListingView(
  listingId: string,
  options: {
    category?: string;
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  await trackClasificadosEvent({
    listing_id: listingId,
    category: options.category,
    event_type: "listing_view",
    event_source: options.eventSource || "detail",
    owner_user_id: options.ownerUserId || null,
    metadata: options.metadata,
  });
}

/**
 * Track a like/unlike action
 */
export async function trackListingLike(
  listingId: string,
  isLike: boolean,
  options: {
    category?: string;
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  await trackClasificadosEvent({
    listing_id: listingId,
    category: options.category,
    event_type: isLike ? "listing_like" : "listing_unlike",
    event_source: options.eventSource || "detail",
    owner_user_id: options.ownerUserId || null,
    metadata: options.metadata,
  });
}

/**
 * Track a save/unsave action
 */
export async function trackListingSave(
  listingId: string,
  isSave: boolean,
  options: {
    category?: string;
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  await trackClasificadosEvent({
    listing_id: listingId,
    category: options.category,
    event_type: isSave ? "listing_save" : "listing_unsave",
    event_source: options.eventSource || "detail",
    owner_user_id: options.ownerUserId || null,
    metadata: options.metadata,
  });
}

/**
 * Track a share action
 */
export async function trackListingShare(
  listingId: string,
  options: {
    category?: string;
    ownerUserId?: string;
    eventSource?: EventSource;
    shareMethod?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  await trackClasificadosEvent({
    listing_id: listingId,
    category: options.category,
    event_type: "listing_share",
    event_source: options.eventSource || "share_modal",
    owner_user_id: options.ownerUserId || null,
    metadata: { 
      shareMethod: options.shareMethod || "unknown",
      ...options.metadata 
    },
  });
}

/**
 * Track a CTA click
 */
export async function trackCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "general",
  options: {
    category?: string;
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  const eventTypeMap: Record<string, ClasificadosEventType> = {
    phone: "phone_click",
    whatsapp: "whatsapp_click", 
    website: "website_click",
    directions: "directions_click",
    general: "cta_click"
  };
  
  await trackClasificadosEvent({
    listing_id: listingId,
    category: options.category,
    event_type: eventTypeMap[ctaType],
    event_source: options.eventSource || "cta_card",
    owner_user_id: options.ownerUserId || null,
    metadata: { ctaType, ...options.metadata },
  });
}

/**
 * Track a lead/inquiry
 */
export async function trackLeadCreated(
  listingId: string,
  options: {
    category?: string;
    ownerUserId?: string;
    eventSource?: EventSource;
    leadType?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  await trackClasificadosEvent({
    listing_id: listingId,
    category: options.category,
    event_type: "lead_created",
    event_source: options.eventSource || "detail",
    owner_user_id: options.ownerUserId || null,
    metadata: { leadType: options.leadType || "inquiry", ...options.metadata },
  });
}

/**
 * Track application events
 */
export async function trackApplicationEvent(
  listingId: string,
  stage: "started" | "submitted",
  options: {
    category?: string;
    ownerUserId?: string;
    eventSource?: EventSource;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  await trackClasificadosEvent({
    listing_id: listingId,
    category: options.category,
    event_type: stage === "started" ? "apply_started" : "apply_submitted",
    event_source: options.eventSource || "detail",
    owner_user_id: options.ownerUserId || null,
    metadata: { applicationStage: stage, ...options.metadata },
  });
}

// ---------------------------------------------------------------------------
// Aggregate Reading Functions
// ---------------------------------------------------------------------------

/**
 * Get aggregate metrics for a listing
 */
export type ListingMetrics = {
  views: number;
  uniqueViews?: number;
  likes: number;
  saves: number;
  shares: number;
  ctaClicks: number;
  leads: number;
  applications: number;
  lastEngagement?: string;
};

export async function getListingMetrics(
  listingId: string,
  supabase: any
): Promise<ListingMetrics | null> {
  try {
    const { data: events, error } = await supabase
      .from("listing_analytics")
      .select("event_type, user_id, created_at")
      .eq("listing_id", listingId);
      
    if (error || !events) return null;
    
    const metrics: ListingMetrics = {
      views: 0,
      likes: 0,
      saves: 0,
      shares: 0,
      ctaClicks: 0,
      leads: 0,
      applications: 0,
    };
    
    const viewUsers = new Set<string>();
    let lastEngagement: string | null = null;
    
    for (const event of events) {
      const type = event.event_type;
      const userId = event.user_id;
      const createdAt = event.created_at;
      
      // Track last engagement
      if (!lastEngagement || new Date(createdAt) > new Date(lastEngagement)) {
        lastEngagement = createdAt;
      }
      
      switch (type) {
        case "listing_view":
          metrics.views++;
          if (userId) viewUsers.add(userId);
          break;
        case "listing_like":
          metrics.likes++;
          break;
        case "listing_save":
          metrics.saves++;
          break;
        case "listing_share":
          metrics.shares++;
          break;
        case "cta_click":
        case "phone_click":
        case "whatsapp_click":
        case "website_click":
        case "directions_click":
          metrics.ctaClicks++;
          break;
        case "lead_created":
          metrics.leads++;
          break;
        case "apply_started":
        case "apply_submitted":
          metrics.applications++;
          break;
      }
    }
    
    metrics.uniqueViews = viewUsers.size;
    metrics.lastEngagement = lastEngagement || undefined;
    
    return metrics;
    
  } catch (error) {
    console.warn("Failed to fetch listing metrics:", error);
    return null;
  }
}

/**
 * Get owner dashboard metrics
 */
export type OwnerMetrics = {
  totalViews: number;
  totalLikes: number;
  totalSaves: number;
  totalShares: number;
  totalCtaClicks: number;
  totalLeads: number;
  totalApplications: number;
  listingCount: number;
  lastEngagement?: string;
};

export async function getOwnerMetrics(
  ownerId: string,
  supabase: any
): Promise<OwnerMetrics | null> {
  try {
    // Get owner's listings
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("id")
      .eq("owner_id", ownerId);
      
    if (listingsError || !listings) return null;
    
    const listingIds = listings.map((l: any) => l.id);
    if (listingIds.length === 0) {
      return {
        totalViews: 0,
        totalLikes: 0,
        totalSaves: 0,
        totalShares: 0,
        totalCtaClicks: 0,
        totalLeads: 0,
        totalApplications: 0,
        listingCount: 0,
      };
    }
    
    // Get all analytics events for owner's listings
    const { data: events, error: eventsError } = await supabase
      .from("listing_analytics")
      .select("event_type, user_id, created_at")
      .in("listing_id", listingIds);
      
    if (eventsError || !events) return null;
    
    const metrics: OwnerMetrics = {
      totalViews: 0,
      totalLikes: 0,
      totalSaves: 0,
      totalShares: 0,
      totalCtaClicks: 0,
      totalLeads: 0,
      totalApplications: 0,
      listingCount: listingIds.length,
    };
    
    let lastEngagement: string | null = null;
    
    for (const event of events) {
      const type = event.event_type;
      const createdAt = event.created_at;
      
      // Track last engagement
      if (!lastEngagement || new Date(createdAt) > new Date(lastEngagement)) {
        lastEngagement = createdAt;
      }
      
      switch (type) {
        case "listing_view":
          metrics.totalViews++;
          break;
        case "listing_like":
          metrics.totalLikes++;
          break;
        case "listing_save":
          metrics.totalSaves++;
          break;
        case "listing_share":
          metrics.totalShares++;
          break;
        case "cta_click":
        case "phone_click":
        case "whatsapp_click":
        case "website_click":
        case "directions_click":
          metrics.totalCtaClicks++;
          break;
        case "lead_created":
          metrics.totalLeads++;
          break;
        case "apply_started":
        case "apply_submitted":
          metrics.totalApplications++;
          break;
      }
    }
    
    metrics.lastEngagement = lastEngagement || undefined;
    
    return metrics;
    
  } catch (error) {
    console.warn("Failed to fetch owner metrics:", error);
    return null;
  }
}
