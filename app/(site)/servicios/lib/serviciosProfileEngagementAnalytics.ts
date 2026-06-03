import {
  mapServiciosOpsEventToGlobal,
  recordServiciosGlobalAnalyticsEvent,
  type ServiciosGlobalAnalyticsListing,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";
import { serviciosListingAnalyticsMetadata } from "./serviciosAnalyticsIdentity";

/** Live public profile: global listing_analytics via /api/analytics/events (one listing_view per load). */
export function trackServiciosPublicProfileView(args: {
  listing: ServiciosGlobalAnalyticsListing;
  listingSlug: string;
}): void {
  const slug = args.listingSlug.trim();
  const id = args.listing.id.trim();
  if (!id || !slug) return;

  const meta = serviciosListingAnalyticsMetadata(slug);

  void fetch("/api/clasificados/servicios/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listingSlug: slug,
      eventType: "profile_view",
      meta: { engagementId: id, sourceId: id, clientListingAnalytics: true, ...meta },
    }),
  }).catch(() => {});

  recordServiciosGlobalAnalyticsEvent(args.listing, "listing_view", {
    event_source: "detail",
    metadata: meta,
  });
}
