import type { ReactNode } from "react";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  hasAboutSectionResolved,
  hasBusinessHighlightsResolved,
  hasHeroIdentityResolved,
  hasAmenityOptionsResolved,
  hasCredentialsResolved,
  hasPaymentMethodsResolved,
  hasQuickFactsResolved,
  hasOfferSectionResolved,
} from "../lib/serviciosProfilePresence";
import { ServiciosTopBar } from "./ServiciosTopBar";
import { ServiciosHero } from "./ServiciosHero";
import { ServiciosQuickFacts } from "./ServiciosQuickFacts";
import { ServiciosAbout } from "./ServiciosAbout";
import { ServiciosHighlightsSection } from "./ServiciosHighlightsSection";
import { ServiciosOfferedSection } from "./ServiciosServicesGrid";
import { ServiciosGalleryWithTabs } from "./ServiciosGalleryWithTabs";
import { ServiciosSmartTrustSummary } from "./ServiciosSmartTrustSummary";
import { ServiciosPromocionesCard } from "./ServiciosPromocionesCard";
import { ServiciosTrustSection } from "./ServiciosTrustSection";
import { ServiciosReviews } from "./ServiciosReviews";
import { ServiciosHours } from "./ServiciosHours";
import { ServiciosLicense } from "./ServiciosLicense";
import { ServiciosPagosCard } from "./ServiciosPagosCard";
import { ServiciosOpcionesFacilidadesCard } from "./ServiciosOpcionesFacilidadesCard";
import { ServiciosBusinessHubContactCard } from "./ServiciosBusinessHubContactCard";
import { ServiciosLeadInquiryForm } from "./ServiciosLeadInquiryForm";
import { ServiciosProfileViewAnalytics } from "./ServiciosProfileViewAnalytics";
import { ServiciosPublicTranslationLayer } from "./ServiciosPublicTranslationLayer";
import { SV } from "./serviciosDesignTokens";
import { LX_LINK_ACCENT } from "./serviciosLeonixBrand";
import { ServiciosLanguageChipRow } from "./ServiciosLanguageChipRow";
import { ServiciosTrackedLink } from "./ServiciosTrackedLink";

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
  persistListingEngagement = false,
  publicLikeCount,
  listingShareUrl,
  showPublicLeadInquiryForm = false,
  directContactFasterResponseHint = false,
  leonixAdIdFooter,
  /** Public Clasificados vitrina — link back to discovery results (not browser history). */
  serviciosDiscoveryResultsHref,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  /** Clasificados draft preview — subtle return to the application */
  editBackHref?: string;
  /** Same-tab preview → edit handoff (Leonix publish flow session flags). */
  beforeEditBackNavigate?: () => void;
  /** Optional system notice (e.g. paused listing) — premium, non-alarming */
  noticeBanner?: string;
  /** Gate 20F — success panel after publish (`?justPublished=1`). */
  justPublishedPanel?: ReactNode;
  /** When false, the global Servicios chrome bar is omitted (e.g. Clasificados preview uses an outer wrapper). */
  showTopBar?: boolean;
  /** Public Clasificados slug — enables analytics + tracked outbound CTAs on the action panel. */
  analyticsListingSlug?: string;
  /** `servicios_public_listings.id` for global analytics API (SVC1). */
  listingSourceId?: string | null;
  /** Stable key for Like/Save/Share: `leonix_ad_id`, else listing row `id`, else slug (dev). */
  engagementListingId?: string | null;
  /** Listing owner auth id for analytics rollup. */
  engagementOwnerUserId?: string | null;
  persistListingEngagement?: boolean;
  /** SSR like count from `user_liked_listings` (same keys as Like button); omit on previews. */
  publicLikeCount?: number;
  /** Absolute URL for hero share (SSR from request host when available). */
  listingShareUrl?: string;
  /** Public Clasificados: show quote form only when lead can be emailed to the business (Resend + recipient). */
  showPublicLeadInquiryForm?: boolean;
  /** When the quote form is hidden, nudge visitors toward direct contact CTAs. */
  directContactFasterResponseHint?: boolean;
  leonixAdIdFooter?: string | null;
  serviciosDiscoveryResultsHref?: string | null;
}) {
  const stickyAsideTop = showTopBar ? "lg:top-[4.5rem]" : "lg:top-4";
  const listingKey = analyticsListingSlug?.trim() || profile.identity.slug;

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
        <ServiciosPublicTranslationLayer profile={profile} lang={lang} listingKey={listingKey}>
          {(displayProfile, translateControl) => (
            <>
              {hasHeroIdentityResolved(profile) ? (
                <ServiciosHero profile={displayProfile} lang={lang} publicLikeCount={publicLikeCount} />
              ) : null}

              {hasQuickFactsResolved(profile) ? (
                <div className="mt-5 md:mt-8">
                  <ServiciosQuickFacts facts={profile.quickFacts} lang={lang} />
                </div>
              ) : null}

              <ServiciosLanguageChipRow
                profile={profile.hero}
                lang={lang}
                chipClassName="inline-flex shrink-0 items-center rounded-full border border-[#E8D7B8] bg-[#FCF9F2] px-3 py-1 text-[11px] font-medium text-[#2F2A23]"
                className="mt-4 flex flex-wrap gap-2 md:mt-6"
              />

              {/*
                NEW LAYOUT: Two-column desktop with reorganized sections
                Mobile: stacked order per requirements
              */}
              <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
                {/* Main column: mobile puts About before Trust; promos stay out of the contact panel when a promos section exists. */}
                <div className="order-1 flex min-w-0 flex-col gap-5 sm:gap-8 lg:order-1">
                  {translateControl ? <div className="order-0">{translateControl}</div> : null}

                  {hasAboutSectionResolved(profile) ? (
                    <div className="order-1 lg:order-2">
                      <ServiciosAbout profile={displayProfile} lang={lang} premiumLeonixTone />
                    </div>
                  ) : null}

                  <div className={hasAboutSectionResolved(profile) ? "order-2 lg:order-1" : "order-1 lg:order-1"}>
                    <ServiciosTrustSection profile={profile} lang={lang} />
                  </div>

                  <div className="order-3 lg:hidden">
                    <ServiciosBusinessHubContactCard
                      profile={profile}
                      lang={lang}
                      listingSlug={analyticsListingSlug}
                      listingSourceId={listingSourceId}
                      listingShareUrl={listingShareUrl}
                      engagementListingId={engagementListingId}
                      engagementOwnerUserId={engagementOwnerUserId}
                      persistListingEngagement={persistListingEngagement}
                      publicLikeCount={publicLikeCount}
                      directContactFasterResponseHint={directContactFasterResponseHint}
                      showOfferSidebarTeaser={!hasOfferSectionResolved(profile)}
                    />
                  </div>

                  <div className="order-4 lg:order-3">
                    <ServiciosGalleryWithTabs
                      profile={profile}
                      lang={lang}
                      listingSlug={analyticsListingSlug}
                      listingSourceId={listingSourceId}
                      listingShareUrl={listingShareUrl}
                    />
                  </div>

                  <div className="order-5 lg:hidden">
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

                  {hasCredentialsResolved(profile) ? (
                    <div className="order-6 lg:order-4">
                      <ServiciosLicense profile={profile} lang={lang} />
                    </div>
                  ) : null}

                  <div className="order-7 lg:order-5">
                    <ServiciosOfferedSection
                      services={displayProfile.services}
                      lang={lang}
                      profileForQuote={profile}
                      listingSlug={analyticsListingSlug}
                      listingSourceId={listingSourceId}
                      listingShareUrl={listingShareUrl}
                      premiumLeonixTone
                    />
                  </div>

                  <div className="order-8 lg:order-6">
                    {hasBusinessHighlightsResolved(profile) ? (
                      <ServiciosHighlightsSection highlights={displayProfile.highlights} lang={lang} />
                    ) : null}
                  </div>

            {hasAmenityOptionsResolved(profile) ? (
              <div className="order-9 lg:order-7">
                <ServiciosOpcionesFacilidadesCard profile={profile} lang={lang} />
              </div>
            ) : null}

            {hasPaymentMethodsResolved(profile) ? (
              <div className="order-10 lg:order-8">
                <ServiciosPagosCard profile={profile} lang={lang} />
              </div>
            ) : null}

            {analyticsListingSlug && showPublicLeadInquiryForm ? (
              <div className="order-11 lg:order-9">
                <ServiciosLeadInquiryForm listingSlug={analyticsListingSlug} lang={lang} />
              </div>
            ) : null}

            <div className="order-12 lg:order-10">
              <ServiciosReviews profile={profile} lang={lang} />
            </div>

            <div className="order-13 lg:order-11">
              <ServiciosSmartTrustSummary profile={profile} lang={lang} />
            </div>

            {!profile.contact.hours?.weeklyRows ? (
              <div className="order-14 lg:order-12">
                <ServiciosHours profile={profile} lang={lang} />
              </div>
            ) : null}
          </div>

          {/* Sticky sidebar: desktop only (móvil usa el bloque compacto arriba para evitar duplicar contacto/ofertas) */}
          <aside
            className={`order-2 hidden min-w-0 lg:sticky lg:block lg:self-start ${stickyAsideTop} lg:z-10 lg:order-2`}
          >
            <ServiciosBusinessHubContactCard
              profile={profile}
              lang={lang}
              listingSlug={analyticsListingSlug}
              listingSourceId={listingSourceId}
              listingShareUrl={listingShareUrl}
              engagementListingId={engagementListingId}
              engagementOwnerUserId={engagementOwnerUserId}
              persistListingEngagement={persistListingEngagement}
              publicLikeCount={publicLikeCount}
              directContactFasterResponseHint={directContactFasterResponseHint}
              showOfferSidebarTeaser={!hasOfferSectionResolved(profile)}
            />
            <div className="mt-5 lg:mt-6">
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
          </aside>
        </div>
            </>
          )}
        </ServiciosPublicTranslationLayer>

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
