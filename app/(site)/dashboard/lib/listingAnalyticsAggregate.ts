/**
 * Aggregates `listing_analytics` rows for dashboard listing cards — supports all event types.
 */
export type ListingAnalyticsBucket = {
  views: number;
  uniqueViews: number;
  messages: number;
  saves: number;
  shares: number;
  profileClicks: number;
  /** listing_open events — contact/detail drill-down when tracked */
  listingOpens: number;
  /** New engagement metrics */
  likes: number;
  ctaClicks: number;
  leads: number;
  applications: number;
  lastEngagement?: string;
};

const emptyBucket = (): ListingAnalyticsBucket => ({
  views: 0,
  uniqueViews: 0,
  messages: 0,
  saves: 0,
  shares: 0,
  profileClicks: 0,
  listingOpens: 0,
  likes: 0,
  ctaClicks: 0,
  leads: 0,
  applications: 0,
});

export function aggregateListingAnalyticsEvents(
  events: Array<{ listing_id: string | null; event_type: string; user_id?: string | null; created_at?: string }> | null | undefined,
  listingIds: string[]
): Record<string, ListingAnalyticsBucket> {
  const byId: Record<string, ListingAnalyticsBucket> = {};
  for (const id of listingIds) {
    byId[id] = emptyBucket();
  }
  const viewUserIdsByListing: Record<string, Set<string>> = {};
  for (const id of listingIds) viewUserIdsByListing[id] = new Set<string>();

  for (const row of events ?? []) {
    const lid = row.listing_id;
    if (!lid || !byId[lid]) continue;
    const b = byId[lid];
    const type = row.event_type;
    
    // Track last engagement timestamp
    if (row.created_at && (!b.lastEngagement || new Date(row.created_at) > new Date(b.lastEngagement))) {
      b.lastEngagement = row.created_at;
    }
    
    if (type === "listing_view") {
      b.views += 1;
      if (row.user_id) viewUserIdsByListing[lid].add(row.user_id);
    } else if (type === "message_sent") b.messages += 1;
    else if (type === "listing_save") b.saves += 1;
    else if (type === "listing_share") b.shares += 1;
    else if (type === "profile_view") b.profileClicks += 1;
    else if (type === "listing_open") b.listingOpens += 1;
    // New event types
    else if (type === "listing_like") b.likes += 1;
    else if (type === "cta_click" || type === "phone_click" || type === "whatsapp_click" || type === "website_click" || type === "directions_click") b.ctaClicks += 1;
    else if (type === "lead_created") b.leads += 1;
    else if (type === "apply_started" || type === "apply_submitted") b.applications += 1;
  }

  for (const id of listingIds) {
    byId[id].uniqueViews = viewUserIdsByListing[id].size;
  }
  return byId;
}
