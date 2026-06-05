"use client";

import { useEffect, useRef } from "react";
import { trackEmpleosPublicProfileView } from "../lib/empleosCtaTracking";
import { empleosGlobalListingFromRow } from "../lib/recordEmpleosGlobalAnalytics";

export function EmpleosJobProfileViewAnalytics({
  listingSourceId,
  slug,
  leonixAdId,
}: {
  listingSourceId: string;
  slug?: string | null;
  leonixAdId?: string | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const id = listingSourceId.trim();
    if (!id) return;
    fired.current = true;
    const listing = empleosGlobalListingFromRow({ id, slug, leonix_ad_id: leonixAdId });
    if (!listing) return;
    trackEmpleosPublicProfileView(listing);
  }, [listingSourceId, slug, leonixAdId]);

  return null;
}
