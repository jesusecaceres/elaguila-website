"use client";

import { useEffect } from "react";
import type { ComidaLocalPublicListingDetailVm } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import {
  trackComidaLocalProfileViewOnce,
  type ComidaLocalAnalyticsContext,
} from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";
import { ComidaLocalDetailShell } from "./ComidaLocalDetailShell";
import { useComidaLocalPublicTranslation } from "../lib/useComidaLocalPublicTranslation";
import type { Locale } from "@/app/lib/translation/types";

type Props = {
  vm: ComidaLocalPublicListingDetailVm;
  lang?: Locale;
};

export function ComidaLocalPublicDetailClient({ vm, lang = "es" }: Props) {
  const analyticsContext: ComidaLocalAnalyticsContext = {
    listingId: vm.id,
    leonixAdId: vm.leonixAdId,
    slug: vm.slug,
  };

  useEffect(() => {
    trackComidaLocalProfileViewOnce(analyticsContext);
  }, [vm.id]);

  const listingKey = vm.leonixAdId ?? vm.slug ?? vm.id;
  const { displayVm, translateControl } = useComidaLocalPublicTranslation(vm, lang, listingKey);

  return (
    <>
      {translateControl ? <div className="mb-3">{translateControl}</div> : null}
      <ComidaLocalDetailShell
        vm={displayVm}
        leonixAdId={displayVm.leonixAdId}
        analyticsContext={analyticsContext}
      />
    </>
  );
}
