"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  hasAboutSectionResolved,
  hasGallerySectionResolved,
  hasHeroIdentityResolved,
  hasOfferSectionResolved,
  hasPaidCouponsSectionResolved,
  hasServicesSectionResolved,
} from "../lib/serviciosProfilePresence";
import { ServiciosTopBar } from "./ServiciosTopBar";
import { ServiciosProfessionalHero } from "./ServiciosProfessionalHero";
import { ServiciosAbout } from "./ServiciosAbout";
import { ServiciosOfferedSection } from "./ServiciosServicesGrid";
import { ServiciosGalleryWithTabs } from "./ServiciosGalleryWithTabs";
import { ServiciosPromocionesCard } from "./ServiciosPromocionesCard";
import { ServiciosCouponsCard } from "./ServiciosCouponsCard";
import { ServiciosReviews } from "./ServiciosReviews";
import { ServiciosHours } from "./ServiciosHours";
import { ServiciosBusinessHubContactCard } from "./ServiciosBusinessHubContactCard";
import { ServiciosLeadInquiryForm } from "./ServiciosLeadInquiryForm";
import { ServiciosProfileViewAnalytics } from "./ServiciosProfileViewAnalytics";
import { useServiciosPublicTranslation } from "./ServiciosPublicTranslationLayer";
import { ServiciosVisualProofRow } from "./ServiciosVisualProofRow";
import { ServiciosPublicDetailsCanvas } from "./ServiciosPublicDetailsCanvas";
import { ServiciosGroupedHowSection } from "./ServiciosGroupedHowSection";
import { ServiciosPagosBeneficiosSection } from "./ServiciosPagosBeneficiosSection";
import { SV } from "./serviciosDesignTokens";
import { LX_LINK_ACCENT, LX_PRO_INNER_PAD, LX_PRO_MAIN_MAX } from "./serviciosLeonixBrand";
import { ServiciosTrackedLink } from "./ServiciosTrackedLink";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import {
  serviciosGlobalLikeRecorder,
  serviciosGlobalListingFromRow,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";

function hasCouponBlock(profile: ServiciosProfileResolved): boolean {
  return (
    hasPaidCouponsSectionResolved(profile) ||
    Boolean(profile.couponFlyer?.imageUrl?.trim()) ||
    Boolean(profile.couponMoreOffers?.url?.trim())
  );
}

/** Canonical Trade full presentation — preview + published public detail. */
export function ServiciosProfileView({
  profile,
  lang,
  editBackHref,
  beforeEditBackNavigate,
  noticeBanner,
  justPublishedPanel,
  showTopBar = true,
  analyticsListingSlug,
  listingSourceId = null,
  engagementListingId = null,
  engagementOwnerUserId = null,
  showEngagementControls = true,
  persistListingEngagement = false,
  publicLikeCount,
  listingShareUrl,
  showPublicLeadInquiryForm = false,
  directContactFasterResponseHint = false,
  leonixAdIdFooter,
  serviciosDiscoveryResultsHref,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  editBackHref?: string;
  beforeEditBackNavigate?: () => void;
  noticeBanner?: string;
  justPublishedPanel?: ReactNode;
  showTopBar?: boolean;
  analyticsListingSlug?: string;
  listingSourceId?: string | null;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  showEngagementControls?: boolean;
  persistListingEngagement?: boolean;
  publicLikeCount?: number;
  listingShareUrl?: string;
  showPublicLeadInquiryForm?: boolean;
  directContactFasterResponseHint?: boolean;
  leonixAdIdFooter?: string | null;
  serviciosDiscoveryResultsHref?: string | null;
}) {
  const stickyAsideTop = showTopBar ? "lg:top-[4.5rem]" : "lg:top-4";
  const listingKey = analyticsListingSlug?.trim() || profile.identity.slug;
  const { displayProfile, translateControl } = useServiciosPublicTranslation({ profile, lang, listingKey });

  const lxListingId = (engagementListingId ?? "").trim() || profile.identity.slug;
  const lxOwner = (engagementOwnerUserId ?? "").trim() || undefined;
  const sourceId = (listingSourceId ?? "").trim();
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount)
      ? Math.max(0, Math.floor(publicLikeCount))
      : 0;
  const globalListing =
    sourceId && analyticsListingSlug
      ? serviciosGlobalListingFromRow({
          id: sourceId,
          slug: analyticsListingSlug,
          leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
        })
      : null;
  const heroEngagementActive = showEngagementControls && Boolean(lxListingId.trim());
  const hubVariant = heroEngagementActive ? ("save_only" as const) : ("full" as const);

  const heroEngagementSlot = useMemo(() => {
    if (!heroEngagementActive) return undefined;
    return (
      <div className="flex flex-wrap items-center gap-2" data-servicios-hero-engagement="1">
        <ServiciosLikeEngagementCluster
          listingId={lxListingId}
          ownerUserId={lxOwner}
          lang={lang}
          publicLikeCount={likeCueN}
          persistEngagement={persistListingEngagement}
          variant="small"
          tone="hero"
          recordLikeEvent={globalListing ? serviciosGlobalLikeRecorder(globalListing) : undefined}
        />
        <LeonixShareButton
          listingId={lxListingId}
          listingUrl={listingShareUrl}
          ownerUserId={lxOwner}
          listingTitle={profile.identity.businessName}
          variant="small"
          lang={lang}
          category="servicios"
          persistEngagement={persistListingEngagement}
          recordShareEvent={
            globalListing ? serviciosGlobalShareRecorder(globalListing, "detail_share") : undefined
          }
          directNativeShare
        />
      </div>
    );
  }, [
    globalListing,
    heroEngagementActive,
    lang,
    likeCueN,
    listingShareUrl,
    lxListingId,
    lxOwner,
    persistListingEngagement,
    profile.identity.businessName,
  ]);

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-20 sm:pb-16"
      style={{ backgroundColor: SV.bg }}
      data-servicios-public-shell="trade"
      data-servicios-full-shell="trade-canonical"
    >
      {analyticsListingSlug && listingSourceId?.trim() ? (
        <ServiciosProfileViewAnalytics listingSlug={analyticsListingSlug} listingSourceId={listingSourceId.trim()} />
      ) : null}
      {showTopBar ? (
        <ServiciosTopBar lang={lang} editBackHref={editBackHref} beforeEditBackNavigate={beforeEditBackNavigate} />
      ) : null}

      <main className={`${LX_PRO_MAIN_MAX} px-3 py-4 sm:px-6 sm:py-6 lg:px-8`} style={{ backgroundColor: SV.bg }}>
        <div
          className="overflow-hidden rounded-xl border shadow-sm sm:rounded-2xl"
          style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
        >
          {justPublishedPanel ?? null}
          {noticeBanner ? (
            <p
              className="border-b border-amber-200/80 bg-amber-50/95 px-4 py-3 text-center text-sm font-medium text-amber-950"
              role="status"
            >
              {noticeBanner}
            </p>
          ) : null}

          {hasHeroIdentityResolved(profile) ? (
            <ServiciosProfessionalHero
              profile={displayProfile}
              lang={lang}
              template="standard_service"
              contactScrollTargetId="servicios-trade-contact"
              listingSlug={analyticsListingSlug}
              listingSourceId={sourceId || undefined}
              engagementListingId={engagementListingId}
              engagementOwnerUserId={engagementOwnerUserId}
              engagementSlot={heroEngagementSlot}
            />
          ) : null}

          <div className={LX_PRO_INNER_PAD}>
            <div className="grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="order-1 flex min-w-0 flex-col gap-5 sm:gap-8 lg:order-1">
                {translateControl ? <div>{translateControl}</div> : null}

                {hasAboutSectionResolved(profile) ? (
                  <ServiciosAbout profile={displayProfile} lang={lang} premiumLeonixTone />
                ) : null}

                <div id="servicios-trade-contact">
                  <ServiciosBusinessHubContactCard
                    profile={profile}
                    lang={lang}
                    listingTemplate="standard_service"
                    listingSlug={analyticsListingSlug}
                    listingSourceId={listingSourceId}
                    listingShareUrl={listingShareUrl}
                    engagementListingId={engagementListingId}
                    engagementOwnerUserId={engagementOwnerUserId}
                    showEngagementControls={showEngagementControls}
                    persistListingEngagement={persistListingEngagement}
                    publicLikeCount={publicLikeCount}
                    hubEngagementVariant={hubVariant}
                    directContactFasterResponseHint={directContactFasterResponseHint}
                    showOfferSidebarTeaser={!hasOfferSectionResolved(profile)}
                  />
                </div>

                <ServiciosVisualProofRow profile={displayProfile} lang={lang} />

                {hasCouponBlock(displayProfile) ? (
                  <ServiciosCouponsCard
                    coupons={displayProfile.coupons}
                    lang={lang}
                    couponFlyer={displayProfile.couponFlyer}
                    couponMoreOffers={displayProfile.couponMoreOffers}
                    featuredRow
                  />
                ) : null}

                {hasGallerySectionResolved(displayProfile) ? (
                  <ServiciosGalleryWithTabs
                    profile={displayProfile}
                    lang={lang}
                    listingSlug={analyticsListingSlug}
                    listingSourceId={listingSourceId}
                    listingShareUrl={listingShareUrl}
                    combinedMediaLayout
                  />
                ) : null}

                {hasServicesSectionResolved(profile) ? (
                  <ServiciosOfferedSection
                    services={displayProfile.services}
                    lang={lang}
                    profileForQuote={profile}
                    listingSlug={analyticsListingSlug}
                    listingSourceId={listingSourceId}
                    listingShareUrl={listingShareUrl}
                    premiumLeonixTone
                  />
                ) : null}

                <ServiciosPublicDetailsCanvas profile={profile} displayProfile={displayProfile} lang={lang} />

                <ServiciosGroupedHowSection profile={profile} lang={lang} />

                <ServiciosPagosBeneficiosSection profile={profile} displayProfile={displayProfile} lang={lang} />

                <div className="lg:hidden">
                  <ServiciosPromocionesCard
                    profile={displayProfile}
                    lang={lang}
                    premiumLeonixTone
                    listingSlug={analyticsListingSlug}
                    listingSourceId={listingSourceId}
                    engagementListingId={engagementListingId}
                    engagementOwnerUserId={engagementOwnerUserId}
                  />
                </div>

                {analyticsListingSlug && showPublicLeadInquiryForm ? (
                  <ServiciosLeadInquiryForm listingSlug={analyticsListingSlug} lang={lang} />
                ) : null}

                <ServiciosReviews profile={profile} lang={lang} />

                {!profile.contact.hours?.weeklyRows ? (
                  <ServiciosHours profile={profile} lang={lang} />
                ) : null}
              </div>

              <aside
                className={`order-2 hidden min-w-0 lg:sticky lg:block lg:self-start ${stickyAsideTop} lg:z-10 lg:order-2`}
              >
                <ServiciosPromocionesCard
                  profile={displayProfile}
                  lang={lang}
                  premiumLeonixTone
                  listingSlug={analyticsListingSlug}
                  listingSourceId={listingSourceId}
                  engagementListingId={engagementListingId}
                  engagementOwnerUserId={engagementOwnerUserId}
                />
              </aside>
            </div>

            {leonixAdIdFooter ? (
              <p className="mx-auto mt-8 max-w-3xl border-t border-black/[0.06] pt-4 text-center text-[11px] leading-relaxed text-[#7A7164]">
                {lang === "en" ? "Leonix Ad ID" : "Leonix Ad ID"} # {leonixAdIdFooter}
              </p>
            ) : null}
            {serviciosDiscoveryResultsHref?.trim() ? (
              <div className="mx-auto mt-4 flex max-w-3xl justify-center">
                <ServiciosTrackedLink
                  listingSlug={analyticsListingSlug}
                  sourceId={listingSourceId}
                  engagementListingId={engagementListingId}
                  ownerUserId={engagementOwnerUserId}
                  eventType="cta_secondary_click"
                  href={serviciosDiscoveryResultsHref.trim()}
                  className={LX_LINK_ACCENT}
                  data-servicios-results-cta="1"
                >
                  {lang === "en" ? "View Servicios results" : "Ver resultados de Servicios"}
                </ServiciosTrackedLink>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
