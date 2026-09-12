"use client";

import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { serviciosSavedListingExtras } from "@/app/lib/serviciosSavedListingIdentity";
import {
  serviciosGlobalLikeRecorder,
  serviciosGlobalListingFromRow,
  serviciosGlobalSaveRecorder,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";

/**
 * Compact Like → Save → Share controls for live Servicios discovery result cards.
 * Save reuses the shared LeonixSaveButton + serviciosSavedListingExtras engine (same as hub).
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

  const saveExtras =
    sourceId && slug
      ? serviciosSavedListingExtras({
          slug,
          id: sourceId,
          leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
        })
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1" data-servicios-result-card-engagement="1" data-servicios-action-order="like,save,share">
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
      <LeonixSaveButton
        listingId={lxListingId}
        savedListingKey={sourceId || undefined}
        ownerUserId={ownerUserId}
        variant="small"
        lang={lang}
        category="servicios"
        persistEngagement={persistEngagement}
        saveExtras={saveExtras}
        recordSaveEvent={globalListing ? serviciosGlobalSaveRecorder(globalListing) : undefined}
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
