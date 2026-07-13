"use client";

import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  serviciosGlobalLikeRecorder,
  serviciosGlobalListingFromRow,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";

/**
 * Compact Like + Share controls for Servicios discovery result cards.
 * Visibility (`showEngagementControls`) is separate from persistence (`persistListingEngagement`).
 */
export function ServiciosResultCardEngagementStrip({
  listingId,
  ownerUserId,
  listingTitle,
  listingShareUrl,
  listingSlug,
  listingSourceId,
  lang,
  publicLikeCount,
  showEngagementControls = true,
  persistListingEngagement = false,
}: {
  listingId: string;
  ownerUserId?: string | null;
  listingTitle: string;
  listingShareUrl?: string;
  listingSlug?: string;
  listingSourceId?: string | null;
  lang: ServiciosLang;
  publicLikeCount?: number;
  showEngagementControls?: boolean;
  persistListingEngagement?: boolean;
}) {
  const lxListingId = (listingId ?? "").trim();
  if (!showEngagementControls || !lxListingId) return null;

  const slug = (listingSlug ?? "").trim();
  const sourceId = (listingSourceId ?? "").trim();
  const persistEngagement = persistListingEngagement;
  const shareUrl = persistEngagement ? (listingShareUrl ?? "").trim() || undefined : undefined;
  const globalListing =
    persistEngagement && sourceId && slug
      ? serviciosGlobalListingFromRow({
          id: sourceId,
          slug,
          leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
        })
      : null;
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount)
      ? Math.max(0, Math.floor(publicLikeCount))
      : 0;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1" data-servicios-result-card-engagement="1">
      <ServiciosLikeEngagementCluster
        listingId={lxListingId}
        ownerUserId={ownerUserId}
        lang={lang}
        publicLikeCount={likeCueN}
        persistEngagement={persistEngagement}
        variant="small"
        tone="hub"
        recordLikeEvent={globalListing ? serviciosGlobalLikeRecorder(globalListing) : undefined}
      />
      <LeonixShareButton
        listingId={lxListingId}
        listingUrl={shareUrl}
        ownerUserId={ownerUserId}
        listingTitle={listingTitle}
        variant="small"
        lang={lang}
        category="servicios"
        persistEngagement={persistEngagement}
        recordShareEvent={
          globalListing ? serviciosGlobalShareRecorder(globalListing, "results_card_share") : undefined
        }
        directNativeShare
      />
    </div>
  );
}
