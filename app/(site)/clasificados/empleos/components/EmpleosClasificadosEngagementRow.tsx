"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { empleosSavedListingExtras } from "@/app/lib/empleosSavedListingIdentity";
import {
  empleosGlobalLikeRecorder,
  empleosGlobalListingFromRow,
  empleosGlobalSaveRecorder,
  empleosGlobalShareRecorder,
} from "../lib/recordEmpleosGlobalAnalytics";

type Props = {
  lang: Lang;
  /** Leonix engagement key (leonix_ad_id or listing id). */
  listingId: string;
  ownerUserId?: string | null;
  listingTitle: string;
  shareUrl: string;
  persistEngagement: boolean;
  /** empleos_public_listings.id — global analytics (EMP1). */
  listingSourceId?: string | null;
  slug?: string | null;
  leonixAdId?: string | null;
};

export function EmpleosClasificadosEngagementRow({
  lang,
  listingId,
  ownerUserId,
  listingTitle,
  shareUrl,
  persistEngagement,
  listingSourceId,
  slug,
  leonixAdId,
}: Props) {
  const sourceId = (listingSourceId ?? "").trim();
  const globalListing = sourceId
    ? empleosGlobalListingFromRow({ id: sourceId, slug, leonix_ad_id: leonixAdId })
    : null;
  const saveExtras =
    globalListing
      ? empleosSavedListingExtras({
          id: globalListing.id,
          slug: globalListing.slug,
          leonix_ad_id: globalListing.leonix_ad_id,
        })
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[#E8DFD0] pt-4">
      <LeonixLikeButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        variant="small"
        lang={lang}
        category="empleos"
        persistEngagement={persistEngagement}
        recordLikeEvent={globalListing ? empleosGlobalLikeRecorder(globalListing) : undefined}
      />
      <LeonixSaveButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        variant="small"
        lang={lang}
        category="empleos"
        persistEngagement={persistEngagement}
        saveExtras={saveExtras}
        recordSaveEvent={globalListing ? empleosGlobalSaveRecorder(globalListing) : undefined}
      />
      <LeonixShareButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        listingTitle={listingTitle}
        listingUrl={shareUrl}
        variant="small"
        lang={lang}
        category="empleos"
        persistEngagement={persistEngagement}
        recordShareEvent={globalListing ? empleosGlobalShareRecorder(globalListing, "detail_share") : undefined}
      />
    </div>
  );
}
