"use client";

import { useEffect, useRef } from "react";
import { trackAutosPublicProfileView } from "../lib/autosCtaTracking";
import { autosGlobalListingFromRow } from "../lib/recordAutosGlobalAnalytics";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export function AutosVehicleProfileViewAnalytics({
  listingSourceId,
  leonixAdId,
  lane,
}: {
  listingSourceId: string;
  leonixAdId?: string | null;
  lane?: AutosClassifiedsLane | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const id = listingSourceId.trim();
    if (!id) return;
    fired.current = true;
    const listing = autosGlobalListingFromRow({ id, leonix_ad_id: leonixAdId });
    if (!listing) return;
    // Globalization Build D-F3 — this used to also fire trackAutosListingEvent(..., { legacyOnly:
    // true }), a write to the now-retired legacy autos_classifieds_analytics_events table only.
    // The canonical "listing_view" event is already recorded by trackAutosPublicProfileView above
    // (it calls recordAutosGlobalAnalyticsEvent directly), so nothing is lost by removing it.
    trackAutosPublicProfileView({ listing, lane: lane ?? undefined });
  }, [listingSourceId, leonixAdId, lane]);

  return null;
}
