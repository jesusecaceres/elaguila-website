import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  hasAboutSectionResolved,
  hasBusinessHighlightsResolved,
  hasHeroIdentityResolved,
  hasAmenityOptionsResolved,
  hasCredentialsResolved,
  hasPaymentMethodsResolved,
  hasQuickFactsResolved,
} from "../lib/serviciosProfilePresence";
import { ServiciosTopBar } from "./ServiciosTopBar";
import { ServiciosHero } from "./ServiciosHero";
import { ServiciosQuickFacts } from "./ServiciosQuickFacts";
import { ServiciosAbout } from "./ServiciosAbout";
import { ServiciosHighlightsSection } from "./ServiciosHighlightsSection";
import { ServiciosOfferedSection } from "./ServiciosServicesGrid";
import { ServiciosGallery } from "./ServiciosGallery";
import { ServiciosSmartTrustSummary } from "./ServiciosSmartTrustSummary";
import { ServiciosPromocionesCard } from "./ServiciosPromocionesCard";
import { ServiciosTrustSection } from "./ServiciosTrustSection";
import { ServiciosReviews } from "./ServiciosReviews";
import { ServiciosServiceAreas } from "./ServiciosServiceAreas";
import { ServiciosHours } from "./ServiciosHours";
import { ServiciosLicense } from "./ServiciosLicense";
import { ServiciosPagosCard } from "./ServiciosPagosCard";
import { ServiciosOpcionesFacilidadesCard } from "./ServiciosOpcionesFacilidadesCard";
import { ServiciosCredencialesCard } from "./ServiciosCredencialesCard";
import { ServiciosActionPanel } from "./ServiciosActionPanel";
import { ServiciosLeadInquiryForm } from "./ServiciosLeadInquiryForm";
import { ServiciosProfileViewAnalytics } from "./ServiciosProfileViewAnalytics";
import { ServiciosReviewSubmitForm } from "./ServiciosReviewSubmitForm";
import { SV } from "./serviciosDesignTokens";

export function ServiciosProfileView({
  profile,
  lang,
  editBackHref,
  beforeEditBackNavigate,
  noticeBanner,
  showTopBar = true,
  analyticsListingSlug,
  engagementListingId = null,
  engagementOwnerUserId = null,
  showPublicConversionForms = false,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  /** Clasificados draft preview — subtle return to the application */
  editBackHref?: string;
  /** Same-tab preview → edit handoff (Leonix publish flow session flags). */
  beforeEditBackNavigate?: () => void;
  /** Optional system notice (e.g. paused listing) — premium, non-alarming */
  noticeBanner?: string;
  /** When false, the global Servicios chrome bar is omitted (e.g. Clasificados preview uses an outer wrapper). */
  showTopBar?: boolean;
  /** Public Clasificados slug — enables analytics + tracked outbound CTAs on the action panel. */
  analyticsListingSlug?: string;
  /** Stable Leonix ad id (`servicios_public_listings.leonix_ad_id`) for saves/likes/shares. */
  engagementListingId?: string | null;
  /** Listing owner auth id for analytics rollup. */
  engagementOwnerUserId?: string | null;
  /** When true with `analyticsListingSlug`, shows moderated lead + review forms on the public listing. */
  showPublicConversionForms?: boolean;
}) {
  const stickyAsideTop = showTopBar ? "lg:top-[4.5rem]" : "lg:top-4";

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 sm:pb-16" style={{ backgroundColor: SV.bg }}>
      {analyticsListingSlug ? <ServiciosProfileViewAnalytics listingSlug={analyticsListingSlug} /> : null}
      {showTopBar ? (
        <ServiciosTopBar lang={lang} editBackHref={editBackHref} beforeEditBackNavigate={beforeEditBackNavigate} />
      ) : null}

      <main className="mx-auto max-w-[1280px] px-4 pb-10 pt-4 sm:pt-6 md:px-6 md:pt-8">
        {noticeBanner ? (
          <p
            className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-center text-sm font-medium text-amber-950 shadow-sm"
            role="status"
          >
            {noticeBanner}
          </p>
        ) : null}
        {hasHeroIdentityResolved(profile) ? (
          <ServiciosHero
            profile={profile}
            lang={lang}
            engagementListingId={engagementListingId}
            engagementOwnerUserId={engagementOwnerUserId}
          />
        ) : null}

        {hasQuickFactsResolved(profile) ? (
          <div className="mt-5 md:mt-8">
            <ServiciosQuickFacts facts={profile.quickFacts} lang={lang} />
          </div>
        ) : null}

        {/*
          Mobile / tablet: action panel stacks above main column (order) so CTAs sit near hero + quick facts.
          lg+: classic two-column [content | sticky panel].
        */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
          <aside className={`order-1 min-w-0 lg:order-2 lg:sticky ${stickyAsideTop} lg:z-10 lg:self-start`}>
            <ServiciosActionPanel profile={profile} lang={lang} listingSlug={analyticsListingSlug} />
          </aside>
          <div className="order-2 flex min-w-0 flex-col gap-6 sm:gap-8 lg:order-1">
            {analyticsListingSlug && showPublicConversionForms ? (
              <ServiciosLeadInquiryForm listingSlug={analyticsListingSlug} lang={lang} />
            ) : null}
            <ServiciosSmartTrustSummary profile={profile} lang={lang} />
            <ServiciosPromocionesCard profile={profile} lang={lang} />
            {hasAboutSectionResolved(profile) ? <ServiciosAbout profile={profile} lang={lang} /> : null}
            <ServiciosOfferedSection services={profile.services} lang={lang} profileForQuote={profile} />
            {hasBusinessHighlightsResolved(profile) ? (
              <ServiciosHighlightsSection highlights={profile.highlights} lang={lang} />
            ) : null}
            <ServiciosLicense profile={profile} lang={lang} />
            {hasPaymentMethodsResolved(profile) ? <ServiciosPagosCard profile={profile} lang={lang} /> : null}
            {hasAmenityOptionsResolved(profile) ? (
              <ServiciosOpcionesFacilidadesCard profile={profile} lang={lang} />
            ) : null}
            {hasCredentialsResolved(profile) ? (
              <ServiciosCredencialesCard profile={profile} lang={lang} />
            ) : null}
            <ServiciosGallery profile={profile} lang={lang} />
            <ServiciosHours profile={profile} lang={lang} />
            <ServiciosTrustSection profile={profile} lang={lang} />
            <ServiciosReviews profile={profile} lang={lang} />
            {analyticsListingSlug && showPublicConversionForms ? (
              <ServiciosReviewSubmitForm listingSlug={analyticsListingSlug} lang={lang} />
            ) : null}
            <ServiciosServiceAreas profile={profile} lang={lang} />
          </div>
        </div>
      </main>
    </div>
  );
}
