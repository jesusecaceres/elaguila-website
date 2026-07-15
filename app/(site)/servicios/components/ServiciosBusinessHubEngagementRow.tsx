"use client";

import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  serviciosGlobalLikeRecorder,
  serviciosGlobalListingFromRow,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";

const utilityCellClass =
  "flex min-h-[44px] min-w-0 items-stretch justify-center [&_button]:!w-full [&_button]:!max-w-none";

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

  if (!showEngagementActions || hubEngagementVariant === "save_only") return null;

  const title = lang === "en" ? "Actions" : "Acciones";

  return (
    <section aria-labelledby="hub-engagement-heading" className="mt-4" data-servicios-business-hub-engagement="1">
      <h3
        id="hub-engagement-heading"
        className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]"
      >
        {title}
      </h3>
      <div className="mt-2.5 grid max-w-full grid-cols-2 gap-2 sm:gap-2.5">
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
