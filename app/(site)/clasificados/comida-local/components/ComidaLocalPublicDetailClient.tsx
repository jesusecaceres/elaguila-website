"use client";

import { useEffect } from "react";
import type { ComidaLocalPublicListingDetailVm } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import {
  trackComidaLocalProfileViewOnce,
  type ComidaLocalAnalyticsContext,
} from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";
import { ComidaLocalDetailShell } from "./ComidaLocalDetailShell";

type Props = {
  vm: ComidaLocalPublicListingDetailVm;
};

export function ComidaLocalPublicDetailClient({ vm }: Props) {
  const analyticsContext: ComidaLocalAnalyticsContext = {
    listingId: vm.id,
    leonixAdId: vm.leonixAdId,
    slug: vm.slug,
  };

  useEffect(() => {
    trackComidaLocalProfileViewOnce(analyticsContext);
  }, [vm.id]);

  return (
    <ComidaLocalDetailShell
      vm={vm}
      leonixAdId={vm.leonixAdId}
      analyticsContext={analyticsContext}
    />
  );
}
