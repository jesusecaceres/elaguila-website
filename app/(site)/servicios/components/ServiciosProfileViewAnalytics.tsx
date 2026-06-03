"use client";

import { useEffect, useRef } from "react";
import { trackServiciosPublicProfileView } from "../lib/serviciosProfileEngagementAnalytics";

/** One profile view per page load — global API + legacy ops log (no browser listing_analytics insert). */
export function ServiciosProfileViewAnalytics({
  listingSlug,
  listingSourceId,
}: {
  listingSlug: string;
  listingSourceId: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    const slug = listingSlug.trim();
    const id = listingSourceId.trim();
    if (!slug || !id) return;
    sent.current = true;
    trackServiciosPublicProfileView({
      listingSlug: slug,
      listing: { id, slug },
    });
  }, [listingSlug, listingSourceId]);
  return null;
}
