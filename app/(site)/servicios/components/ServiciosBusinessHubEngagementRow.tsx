"use client";

import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
const utilityCellClass =
  "flex min-h-[44px] min-w-0 items-stretch justify-center [&_button]:!w-full [&_button]:!max-w-none";

/**
 * Like / Share / Save — secondary utility actions for the Business Hub contact card.
 * Same Leonix engagement components as the former hero overlay; behavior unchanged.
 */
export function ServiciosBusinessHubEngagementRow({
  profile,
  lang,
  engagementListingId = null,
  engagementOwnerUserId = null,
  listingShareUrl,
  persistListingEngagement = false,
  publicLikeCount,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  listingShareUrl?: string;
  persistListingEngagement?: boolean;
  publicLikeCount?: number;
}) {
  const lxListingId = (engagementListingId ?? "").trim() || profile.identity.slug;
  const lxOwner = (engagementOwnerUserId ?? "").trim() || undefined;
  const persistEngagement = persistListingEngagement;
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount) ? Math.max(0, Math.floor(publicLikeCount)) : 0;

  const showSaveLike = persistEngagement && Boolean(lxListingId);
  const showShare = Boolean(lxListingId) || Boolean((listingShareUrl ?? "").trim());

  if (!showSaveLike && !showShare) return null;

  const title = lang === "en" ? "Actions" : "Acciones";

  return (
    <section aria-labelledby="hub-engagement-heading" className="mt-4" data-servicios-business-hub-engagement="1">
      <h3
        id="hub-engagement-heading"
        className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]"
      >
        {title}
      </h3>
      {showSaveLike ? (
        <div className="mt-2.5 grid max-w-full grid-cols-3 gap-2 sm:gap-2.5">
          <div className={utilityCellClass}>
            <LeonixSaveButton
              listingId={lxListingId}
              ownerUserId={lxOwner}
              variant="default"
              lang={lang}
              category="servicios"
              persistEngagement
              className="!shadow-sm"
            />
          </div>
          {showShare ? (
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
                directNativeShare
              />
            </div>
          ) : (
            <div className="min-h-[44px] min-w-0" aria-hidden />
          )}
          <div className={utilityCellClass}>
            <ServiciosLikeEngagementCluster
              listingId={lxListingId}
              ownerUserId={lxOwner}
              lang={lang}
              publicLikeCount={likeCueN}
              persistEngagement
              variant="default"
              tone="hub"
              className="w-full [&_button]:!w-full"
            />
          </div>
        </div>
      ) : showShare ? (
        <div className={`mt-2.5 ${utilityCellClass}`}>
          <LeonixShareButton
            listingId={lxListingId}
            listingUrl={listingShareUrl}
            ownerUserId={lxOwner}
            listingTitle={profile.identity.businessName}
            variant="default"
            lang={lang}
            category="servicios"
            className="!w-full !max-w-full !border-[color:var(--lx-border,#E8D7B8)]"
            persistEngagement={persistEngagement}
            directNativeShare
          />
        </div>
      ) : null}
    </section>
  );
}
