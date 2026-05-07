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
import { ServiciosGalleryWithTabs } from "./ServiciosGalleryWithTabs";
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

      <main
        className="rounded-2xl border px-4 py-5 shadow-sm sm:px-6 sm:py-6"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      >
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
          NEW LAYOUT: Two-column desktop with reorganized sections
          Mobile: stacked order per requirements
        */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* RIGHT SIDEBAR - Desktop */}
          <aside className={`order-1 min-w-0 lg:order-2 lg:sticky ${stickyAsideTop} lg:z-10 lg:self-start`}>
            {/* Contacto card - conversion center */}
            <ServiciosActionPanel profile={profile} lang={lang} listingSlug={analyticsListingSlug} />
            
            {/* Ofertas especiales - moved under Contacto */}
            <div className="mt-5 lg:mt-6">
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>
          </aside>
          
          {/* LEFT MAIN COLUMN - Desktop */}
          <div className="order-2 flex min-w-0 flex-col gap-6 sm:gap-8 lg:order-1">
            {/* Mobile Contacto card - appears first on mobile */}
            <div className="lg:hidden">
              <ServiciosActionPanel profile={profile} lang={lang} listingSlug={analyticsListingSlug} />
            </div>
            
            {/* Mobile Ofertas especiales - appears after Contacto on mobile */}
            <div className="mt-5 lg:hidden">
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>
            
            {/* 1. Sobre Nosotros (moved up, merged with Resumen Rápido) */}
            {hasAboutSectionResolved(profile) ? (
              <div className="lg:order-1">
                <ServiciosAbout profile={profile} lang={lang} />
              </div>
            ) : null}
            
            {/* 2. Galería de trabajos / Media (moved up with tabs) */}
            <div className="lg:order-2">
              <ServiciosGalleryWithTabs profile={profile} lang={lang} />
            </div>
            
            {/* 3. Credenciales (moved up) */}
            {hasCredentialsResolved(profile) ? (
              <div className="lg:order-3">
                <ServiciosLicense profile={profile} lang={lang} />
              </div>
            ) : null}
            
            {/* 4. Por qué elegirnos (moved after gallery) */}
            <div className="lg:order-4">
              <ServiciosTrustSection profile={profile} lang={lang} />
            </div>
            
            {/* 5. Nuestros servicios */}
            <div className="lg:order-5">
              <ServiciosOfferedSection services={profile.services} lang={lang} profileForQuote={profile} />
            </div>
            
            {/* 6. Confianza y beneficios (merged highlights + trust) */}
            <div className="lg:order-6">
              {hasBusinessHighlightsResolved(profile) ? (
                <ServiciosHighlightsSection highlights={profile.highlights} lang={lang} />
              ) : null}
            </div>
            
            {/* 7. Opciones y facilidades */}
            {hasAmenityOptionsResolved(profile) ? (
              <div className="lg:order-7">
                <ServiciosOpcionesFacilidadesCard profile={profile} lang={lang} />
              </div>
            ) : null}
            
            {/* 8. Pagos */}
            {hasPaymentMethodsResolved(profile) ? (
              <div className="lg:order-8">
                <ServiciosPagosCard profile={profile} lang={lang} />
              </div>
            ) : null}
            
            {/* Lead inquiry form (if enabled) */}
            {analyticsListingSlug && showPublicConversionForms ? (
              <div className="lg:order-9">
                <ServiciosLeadInquiryForm listingSlug={analyticsListingSlug} lang={lang} />
              </div>
            ) : null}
            
            {/* Reviews (bottom) */}
            <div className="lg:order-10">
              <ServiciosReviews profile={profile} lang={lang} />
              {analyticsListingSlug && showPublicConversionForms ? (
                <ServiciosReviewSubmitForm listingSlug={analyticsListingSlug} lang={lang} />
              ) : null}
            </div>
            
            {/* Smart trust summary (moved up, after reviews) */}
            <div className="lg:order-11">
              <ServiciosSmartTrustSummary profile={profile} lang={lang} />
            </div>
            
            {/* Hours only if not shown in contact panel */}
            {!profile.contact.hours?.weeklyRows ? (
              <div className="lg:order-12">
                <ServiciosHours profile={profile} lang={lang} />
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
