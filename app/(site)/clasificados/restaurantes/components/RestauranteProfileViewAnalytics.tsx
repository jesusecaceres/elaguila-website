"use client";

import { useEffect, useRef } from "react";
import { trackRestaurantesPublicProfileView } from "../lib/restaurantesCtaTracking";
import { restaurantesGlobalListingFromRow } from "../lib/recordRestaurantesGlobalAnalytics";

export function RestauranteProfileViewAnalytics({
  listingSlug,
  listingSourceId,
  leonixAdId,
}: {
  listingSlug: string;
  listingSourceId: string;
  leonixAdId?: string | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const id = listingSourceId.trim();
    const slug = listingSlug.trim();
    if (!id || !slug) return;
    fired.current = true;
    const listing = restaurantesGlobalListingFromRow({
      id,
      slug,
      leonix_ad_id: leonixAdId,
    });
    if (!listing) return;
    trackRestaurantesPublicProfileView({ listing, listingSlug: slug });
  }, [listingSlug, listingSourceId, leonixAdId]);

  return null;
}
