"use client";

import { useMemo } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { clasesPublishedQuickToDraft, type ClasesPublishedListingLike } from "../lib/clasesPublishedQuickToDraft";
import type { CommunityGlobalAnalyticsCtx } from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { ClasesQuickAdCanvas } from "./ClasesQuickAdCanvas";

type Props = {
  lang: Lang;
  listing: ClasesPublishedListingLike & { detailPairs?: unknown };
};

export function ClasesPublishedQuickAd({ listing, lang }: Props) {
  const draft = useMemo(() => clasesPublishedQuickToDraft(listing.detailPairs, listing, lang), [listing, lang]);
  if (!draft) return null;
  const analyticsCtx: CommunityGlobalAnalyticsCtx | undefined = listing.id
    ? { listingUuid: listing.id, category: "clases", leonixAdId: listing.leonix_ad_id }
    : undefined;
  return (
    <ClasesQuickAdCanvas
      draft={draft}
      lang={lang}
      shell="embedded"
      contactSectionId="contact-actions"
      heroTestId="community-anuncio-hero"
      analyticsCtx={analyticsCtx}
    />
  );
}
