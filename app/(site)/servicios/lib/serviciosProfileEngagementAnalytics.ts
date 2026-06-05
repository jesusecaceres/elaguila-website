import { trackClasificadosEvent } from "@/app/lib/clasificadosAnalytics";

/** Live public profile: ops table + owner dashboard rollup via listing_analytics. */
export function trackServiciosPublicProfileView(args: {
  listingEngagementId: string;
  listingSlug: string;
  ownerUserId?: string | null;
}): void {
  const id = args.listingEngagementId.trim();
  const slug = args.listingSlug.trim();
  if (!id && !slug) return;

  void fetch("/api/clasificados/servicios/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingSlug: slug, eventType: "profile_view", meta: { engagementId: id || slug } }),
  }).catch(() => {});

  const listingId = id || slug;
  void trackClasificadosEvent({
    listing_id: listingId,
    category: "servicios",
    event_type: "profile_view",
    event_source: "detail",
    owner_user_id: args.ownerUserId ?? null,
    metadata: { slug },
  });
  void trackClasificadosEvent({
    listing_id: listingId,
    category: "servicios",
    event_type: "listing_open",
    event_source: "detail",
    owner_user_id: args.ownerUserId ?? null,
    metadata: { slug },
  });
}
