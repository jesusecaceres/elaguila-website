"use client";

import { useEffect } from "react";
import {
  trackBrListingViewGlobal,
  type BrGlobalAnalyticsContext,
} from "@/app/lib/clasificados/bienes-raices/brGlobalAnalytics";

/** Mount on published BR live detail — records listing_view once per session cooldown. */
export function BrLiveDetailAnalyticsMount(ctx: BrGlobalAnalyticsContext) {
  useEffect(() => {
    trackBrListingViewGlobal(ctx);
  }, [ctx.listingUuid, ctx.leonixAdId]);
  return null;
}
