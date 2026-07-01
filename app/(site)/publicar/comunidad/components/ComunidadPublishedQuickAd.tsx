"use client";

import { useMemo } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { comunidadPublishedQuickToDraft, type ComunidadPublishedListingLike } from "../lib/comunidadPublishedQuickToDraft";
import type { CommunityGlobalAnalyticsCtx } from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { ComunidadQuickAdCanvas } from "./ComunidadQuickAdCanvas";

type Props = {
  lang: Lang;
  listing: ComunidadPublishedListingLike & { detailPairs?: unknown };
};

export function ComunidadPublishedQuickAd({ listing, lang }: Props) {
  const draft = useMemo(() => comunidadPublishedQuickToDraft(listing.detailPairs, listing, lang), [listing, lang]);
  if (!draft) return null;
  const analyticsCtx: CommunityGlobalAnalyticsCtx | undefined = listing.id
    ? { listingUuid: listing.id, category: "comunidad", leonixAdId: listing.leonix_ad_id }
    : undefined;
  const leonixAdId = listing.leonix_ad_id ?? formatLeonixAdId(listing.id);
  return (
    <ComunidadQuickAdCanvas
      draft={draft}
      lang={lang}
      shell="embedded"
      contactSectionId="contact-actions"
      heroTestId="community-anuncio-hero"
      analyticsCtx={analyticsCtx}
      leonixAdId={leonixAdId}
    />
  );
}
