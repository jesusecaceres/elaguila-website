"use client";

import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { serviciosSavedListingExtras } from "@/app/lib/serviciosSavedListingIdentity";
import {
  serviciosGlobalLikeRecorder,
  serviciosGlobalListingFromRow,
  serviciosGlobalSaveRecorder,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";

/**
 * Servicios Owner QA (⚠️64 / SVC-QA-18) — shared action grammar: standard-size controls (never a
 * stretched full-width cell), one row, order Like → Save → Share with Compartir last, matching the
 * hero engagement slot and the results card strip.
 */
const actionRowClass = "mt-2.5 flex max-w-full flex-wrap items-center gap-2";
const actionCellClass = "flex min-h-[44px] items-center [&_button]:!min-h-[40px]";

/**
 * Like / Share — secondary utility actions for the Business Hub contact card.
 */
export function ServiciosBusinessHubEngagementRow({
  profile,
  lang,
  listingSlug,
  listingSourceId = null,
  engagementListingId = null,
  engagementOwnerUserId = null,
  listingShareUrl,
  showEngagementControls = true,
  persistListingEngagement = false,
  publicLikeCount,
  hubEngagementVariant = "full",
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingSlug?: string;
  listingSourceId?: string | null;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  listingShareUrl?: string;
  /** When true, Like / Share render (preview + published). */
  showEngagementControls?: boolean;
  persistListingEngagement?: boolean;
  publicLikeCount?: number;
  /** `save_only` — hub engagement hidden; Like/Share render in hero. */
  hubEngagementVariant?: "full" | "save_only";
}) {
  const lxListingId = (engagementListingId ?? "").trim() || profile.identity.slug;
  const lxOwner = (engagementOwnerUserId ?? "").trim() || undefined;
  const sourceId = (listingSourceId ?? "").trim();
  const slug = (listingSlug ?? profile.identity.slug).trim();
  const globalListing =
    sourceId && slug
      ? serviciosGlobalListingFromRow({
          id: sourceId,
          slug,
          leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
        })
      : null;
  const persistEngagement = persistListingEngagement;
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount) ? Math.max(0, Math.floor(publicLikeCount)) : 0;

  const showEngagementActions = showEngagementControls && Boolean(lxListingId);

  if (!showEngagementActions) return null;

  const title = lang === "en" ? "Actions" : "Acciones";

  /**
   * Save — canonical `saved_listings` write through the shared LeonixSaveButton (auth prompt,
   * self-engagement guard, Guardados dashboard, analytics), never local-only browser state.
   * The identity helper, the global save recorder and the `save_only` variant all already
   * existed; only this render was missing, so `save_only` previously produced no Save control
   * at all and the hero-engagement layout shipped with no way to save a Servicios business.
   */
  const saveExtras =
    sourceId && slug
      ? serviciosSavedListingExtras({
          slug,
          id: sourceId,
          leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
        })
      : undefined;

  const saveButton = (
    <LeonixSaveButton
      listingId={lxListingId}
      savedListingKey={sourceId || undefined}
      ownerUserId={lxOwner}
      variant="default"
      lang={lang}
      category="servicios"
      persistEngagement={persistEngagement}
      saveExtras={saveExtras}
      recordSaveEvent={globalListing ? serviciosGlobalSaveRecorder(globalListing) : undefined}
      className="!border-[color:var(--lx-border,#E8D7B8)]"
    />
  );

  if (hubEngagementVariant === "save_only") {
    return (
      <section aria-labelledby="hub-engagement-heading" className="mt-4" data-servicios-business-hub-engagement="save_only">
        <h3
          id="hub-engagement-heading"
          className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]"
        >
          {title}
        </h3>
        <div className={actionRowClass}>
          <div className={actionCellClass}>{saveButton}</div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="hub-engagement-heading" className="mt-4" data-servicios-business-hub-engagement="1">
      <h3
        id="hub-engagement-heading"
        className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]"
      >
        {title}
      </h3>
      <div className={actionRowClass} data-servicios-action-order="like,save,share">
        <div className={actionCellClass}>
          <ServiciosLikeEngagementCluster
            listingId={lxListingId}
            ownerUserId={lxOwner}
            lang={lang}
            publicLikeCount={likeCueN}
            persistEngagement={persistEngagement}
            variant="default"
            tone="hub"
            recordLikeEvent={globalListing ? serviciosGlobalLikeRecorder(globalListing) : undefined}
          />
        </div>
        <div className={actionCellClass}>{saveButton}</div>
        <div className={actionCellClass}>
          <LeonixShareButton
            listingId={lxListingId}
            listingUrl={listingShareUrl}
            ownerUserId={lxOwner}
            listingTitle={profile.identity.businessName}
            variant="default"
            lang={lang}
            category="servicios"
            className="!border-[color:var(--lx-border,#E8D7B8)]"
            persistEngagement={persistEngagement}
            recordShareEvent={globalListing ? serviciosGlobalShareRecorder(globalListing, "detail_share") : undefined}
            directNativeShare
          />
        </div>
      </div>
    </section>
  );
}
