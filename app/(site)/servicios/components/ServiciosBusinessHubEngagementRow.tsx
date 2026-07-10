"use client";

import {
  serviciosSavedListingExtras,
  serviciosSavedListingExtrasFromClient,
} from "@/app/lib/serviciosSavedListingIdentity";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  serviciosGlobalLikeRecorder,
  serviciosGlobalListingFromRow,
  serviciosGlobalSaveRecorder,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";
const utilityCellClass =
  "flex min-h-[44px] min-w-0 items-stretch justify-center [&_button]:!w-full [&_button]:!max-w-none";

/**
 * Like / Share / Save — secondary utility actions for the Business Hub contact card.
 * Same Leonix engagement components as the former hero overlay; behavior unchanged.
 */
export function ServiciosBusinessHubEngagementRow({
  profile,
  lang,
  listingSlug,
  listingSourceId = null,
  engagementListingId = null,
  engagementOwnerUserId = null,
  listingShareUrl,
  persistListingEngagement = false,
  publicLikeCount,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingSlug?: string;
  listingSourceId?: string | null;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  listingShareUrl?: string;
  persistListingEngagement?: boolean;
  publicLikeCount?: number;
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
  const saveExtras = sourceId
    ? serviciosSavedListingExtras({
        slug,
        id: sourceId,
        leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
      })
    : serviciosSavedListingExtrasFromClient({
        slug: profile.identity.slug,
        engagementListingId: lxListingId,
      });
  const persistEngagement = persistListingEngagement;
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount) ? Math.max(0, Math.floor(publicLikeCount)) : 0;

  /** Published listings only — preview drafts must not surface like/share/save actions. */
  const showEngagementActions = persistEngagement && Boolean(lxListingId);

  if (!showEngagementActions) return null;

  const title = lang === "en" ? "Actions" : "Acciones";

  return (
    <section aria-labelledby="hub-engagement-heading" className="mt-4" data-servicios-business-hub-engagement="1">
      <h3
        id="hub-engagement-heading"
        className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]"
      >
        {title}
      </h3>
      <div className="mt-2.5 grid max-w-full grid-cols-3 gap-2 sm:gap-2.5">
        <div className={utilityCellClass}>
          <LeonixSaveButton
            listingId={lxListingId}
            ownerUserId={lxOwner}
            variant="default"
            lang={lang}
            category="servicios"
            persistEngagement={persistEngagement}
            saveExtras={saveExtras}
            recordSaveEvent={globalListing ? serviciosGlobalSaveRecorder(globalListing) : undefined}
            className="!shadow-sm"
          />
        </div>
        <div className={utilityCellClass}>
          <LeonixShareButton
            listingId={lxListingId}
            listingUrl={listingShareUrl}
            ownerUserId={lxOwner}
            listingTitle={profile.identity.businessName}
            variant="default"
            lang={lang}
            category="servicios"
            className="!w-full !border-[color:var(--lx-border,#E8D7B8)]"
            persistEngagement={persistEngagement}
            recordShareEvent={globalListing ? serviciosGlobalShareRecorder(globalListing, "detail_share") : undefined}
            directNativeShare
          />
        </div>
        <div className={utilityCellClass}>
          <ServiciosLikeEngagementCluster
            listingId={lxListingId}
            ownerUserId={lxOwner}
            lang={lang}
            publicLikeCount={likeCueN}
            persistEngagement={persistEngagement}
            variant="default"
            tone="hub"
            recordLikeEvent={globalListing ? serviciosGlobalLikeRecorder(globalListing) : undefined}
            className="w-full [&_button]:!w-full"
          />
        </div>
      </div>
    </section>
  );
}
