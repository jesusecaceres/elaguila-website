"use client";

import { useEffect, useRef } from "react";
import { trackAutosPublicProfileView } from "../lib/autosCtaTracking";
import { trackAutosListingEvent } from "../lib/autosListingAnalyticsClient";
import { autosGlobalListingFromRow } from "../lib/recordAutosGlobalAnalytics";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
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
    trackAutosPublicProfileView({ listing, lane: lane ?? undefined });
    trackAutosListingEvent(id, AUTOS_CLASSIFIEDS_EVENT.listingOpen, {
      lane: lane ?? undefined,
      leonixAdId,
      legacyOnly: true,
    });
  }, [listingSourceId, leonixAdId, lane]);

  return null;
}
