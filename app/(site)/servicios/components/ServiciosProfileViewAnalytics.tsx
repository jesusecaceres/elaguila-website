"use client";

import { useEffect, useRef } from "react";
import { trackServiciosPublicProfileView } from "../lib/serviciosProfileEngagementAnalytics";

/** One profile view per page load — ops analytics + listing_analytics rollup. */
export function ServiciosProfileViewAnalytics({
  listingSlug,
  listingEngagementId,
  engagementOwnerUserId,
}: {
  listingSlug: string;
  listingEngagementId?: string | null;
  engagementOwnerUserId?: string | null;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    const slug = listingSlug.trim();
    if (!slug) return;
    sent.current = true;
    trackServiciosPublicProfileView({
      listingSlug: slug,
      listingEngagementId: (listingEngagementId ?? slug).trim(),
      ownerUserId: engagementOwnerUserId,
    });
  }, [listingSlug, listingEngagementId, engagementOwnerUserId]);
  return null;
}
