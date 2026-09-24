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
 *
 * Servicios False-Gates-Only Final Completion Pass (2026-09-17, Gate 5) — when
 * `persistListingEngagement` is false (non-persisting preview/draft context, e.g. no durable id or
 * share URL yet), the shared LeonixSaveButton renders permanently disabled and reads "Vista
 * previa"/"Preview" instead of "Guardar"/"Save" — the click does nothing. That control is not useful
 * there, so this strip hides it entirely rather than showing a dead button; Like and Share remain
 * (Share degrades to native share without persisted analytics, which is still fully functional).
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
      {persistEngagement ? (
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
      ) : null}
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
      />
    </div>
  );
}
