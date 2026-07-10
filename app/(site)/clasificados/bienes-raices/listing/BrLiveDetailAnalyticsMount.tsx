"use client";

import { useEffect } from "react";
import {
  trackBrListingOpenGlobal,
  trackBrListingViewGlobal,
  type BrGlobalAnalyticsContext,
} from "@/app/lib/clasificados/bienes-raices/analytics/bienesRaicesGlobalAnalytics";

/** Mount on published BR live detail — records listing_view + listing_open once per session cooldown. */
export function BrLiveDetailAnalyticsMount(ctx: BrGlobalAnalyticsContext) {
  useEffect(() => {
    trackBrListingViewGlobal(ctx);
    trackBrListingOpenGlobal(ctx);
  }, [ctx.listingUuid, ctx.leonixAdId]);
  return null;
}
