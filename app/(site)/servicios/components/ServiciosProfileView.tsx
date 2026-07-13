"use client";

import type { ReactNode } from "react";
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
import { ServiciosHero } from "./ServiciosHero";
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
import { LX_LINK_ACCENT } from "./serviciosLeonixBrand";
import { ServiciosTrackedLink } from "./ServiciosTrackedLink";

function hasCouponBlock(profile: ServiciosProfileResolved): boolean {
  return (
    hasPaidCouponsSectionResolved(profile) ||
    Boolean(profile.couponFlyer?.imageUrl?.trim()) ||
    Boolean(profile.couponMoreOffers?.url?.trim())
  );
}

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

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 sm:pb-16" style={{ backgroundColor: SV.bg }}>
      {analyticsListingSlug && listingSourceId?.trim() ? (
        <ServiciosProfileViewAnalytics listingSlug={analyticsListingSlug} listingSourceId={listingSourceId.trim()} />
      ) : null}
      {showTopBar ? (
        <ServiciosTopBar lang={lang} editBackHref={editBackHref} beforeEditBackNavigate={beforeEditBackNavigate} />
      ) : null}

      <main
        className="rounded-2xl border px-3 py-4 shadow-sm sm:px-6 sm:py-6"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      >
        {justPublishedPanel ?? null}
        {noticeBanner ? (
          <p
            className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-center text-sm font-medium text-amber-950 shadow-sm"
            role="status"
          >
            {noticeBanner}
          </p>
        ) : null}
        <>
              {hasHeroIdentityResolved(profile) ? (
                <ServiciosHero profile={displayProfile} lang={lang} publicLikeCount={publicLikeCount} />
              ) : null}

              <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="order-1 flex min-w-0 flex-col gap-5 sm:gap-8 lg:order-1">
                  {translateControl ? <div>{translateControl}</div> : null}

                  {hasAboutSectionResolved(profile) ? (
                    <ServiciosAbout profile={displayProfile} lang={lang} premiumLeonixTone />
                  ) : null}

                  <ServiciosBusinessHubContactCard
                    profile={profile}
                    lang={lang}
                    listingSlug={analyticsListingSlug}
                    listingSourceId={listingSourceId}
                    listingShareUrl={listingShareUrl}
                    engagementListingId={engagementListingId}
                    engagementOwnerUserId={engagementOwnerUserId}
                    showEngagementControls={showEngagementControls}
                    persistListingEngagement={persistListingEngagement}
                    publicLikeCount={publicLikeCount}
                    directContactFasterResponseHint={directContactFasterResponseHint}
                    showOfferSidebarTeaser={!hasOfferSectionResolved(profile)}
                  />

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

                  <ServiciosPublicDetailsCanvas
                    profile={profile}
                    displayProfile={displayProfile}
                    lang={lang}
                  />

                  <ServiciosGroupedHowSection profile={profile} lang={lang} />

                  <ServiciosPagosBeneficiosSection
                    profile={profile}
                    displayProfile={displayProfile}
                    lang={lang}
                  />

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
        </>

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
      </main>
    </div>
  );
}
