import Link from "next/link";
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
import { ServiciosGalleryWithTabs } from "./ServiciosGalleryWithTabs";
import { ServiciosSmartTrustSummary } from "./ServiciosSmartTrustSummary";
import { ServiciosPromocionesCard } from "./ServiciosPromocionesCard";
import { ServiciosTrustSection } from "./ServiciosTrustSection";
import { ServiciosReviews } from "./ServiciosReviews";
import { ServiciosHours } from "./ServiciosHours";
import { ServiciosLicense } from "./ServiciosLicense";
import { ServiciosPagosCard } from "./ServiciosPagosCard";
import { ServiciosOpcionesFacilidadesCard } from "./ServiciosOpcionesFacilidadesCard";
import { ServiciosActionPanel } from "./ServiciosActionPanel";
import { ServiciosLeadInquiryForm } from "./ServiciosLeadInquiryForm";
import { ServiciosProfileViewAnalytics } from "./ServiciosProfileViewAnalytics";
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
  /** When false, the global Servicios chrome bar is omitted (e.g. Clasificados preview uses an outer wrapper). */
  showTopBar?: boolean;
  /** Public Clasificados slug — enables analytics + tracked outbound CTAs on the action panel. */
  analyticsListingSlug?: string;
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
        {serviciosDiscoveryResultsHref?.trim() ? (
          <div className="mb-3 flex justify-end sm:mb-4">
            <Link
              href={serviciosDiscoveryResultsHref.trim()}
              className="text-sm font-bold text-[#3B66AD] underline-offset-4 hover:underline"
              data-servicios-results-cta="1"
            >
              {lang === "en" ? "View service results" : "Ver resultados de Servicios"}
            </Link>
          </div>
        ) : null}
        {hasHeroIdentityResolved(profile) ? (
          <ServiciosHero
            profile={profile}
            lang={lang}
            engagementListingId={engagementListingId}
            engagementOwnerUserId={engagementOwnerUserId}
            listingShareUrl={listingShareUrl}
            persistListingEngagement={persistListingEngagement}
            publicLikeCount={publicLikeCount}
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
          {/* Main column first on mobile: distinción → sobre nosotros → contacto/ofertas (móvil) → galería → … */}
          <div className="order-1 flex min-w-0 flex-col gap-6 sm:gap-8 lg:order-1">
            <div className="lg:order-1">
              <ServiciosTrustSection profile={profile} lang={lang} />
            </div>

            {hasAboutSectionResolved(profile) ? (
              <div className="lg:order-2">
                <ServiciosAbout profile={profile} lang={lang} />
              </div>
            ) : null}

            <div className="space-y-5 lg:hidden">
              <ServiciosActionPanel
                profile={profile}
                lang={lang}
                listingSlug={analyticsListingSlug}
                directContactFasterResponseHint={directContactFasterResponseHint}
              />
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>

            <div className="lg:order-3">
              <ServiciosGalleryWithTabs profile={profile} lang={lang} />
            </div>

            {hasCredentialsResolved(profile) ? (
              <div className="lg:order-4">
                <ServiciosLicense profile={profile} lang={lang} />
              </div>
            ) : null}

            <div className="lg:order-5">
              <ServiciosOfferedSection services={profile.services} lang={lang} profileForQuote={profile} />
            </div>

            <div className="lg:order-6">
              {hasBusinessHighlightsResolved(profile) ? (
                <ServiciosHighlightsSection highlights={profile.highlights} lang={lang} />
              ) : null}
            </div>

            {hasAmenityOptionsResolved(profile) ? (
              <div className="lg:order-7">
                <ServiciosOpcionesFacilidadesCard profile={profile} lang={lang} />
              </div>
            ) : null}

            {hasPaymentMethodsResolved(profile) ? (
              <div className="lg:order-8">
                <ServiciosPagosCard profile={profile} lang={lang} />
              </div>
            ) : null}

            {analyticsListingSlug && showPublicLeadInquiryForm ? (
              <div className="lg:order-9">
                <ServiciosLeadInquiryForm listingSlug={analyticsListingSlug} lang={lang} />
              </div>
            ) : null}

            <div className="lg:order-10">
              <ServiciosReviews profile={profile} lang={lang} />
            </div>

            <div className="lg:order-11">
              <ServiciosSmartTrustSummary profile={profile} lang={lang} />
            </div>

            {!profile.contact.hours?.weeklyRows ? (
              <div className="lg:order-12">
                <ServiciosHours profile={profile} lang={lang} />
              </div>
            ) : null}
          </div>

          {/* Sticky sidebar: desktop only (móvil usa el bloque compacto arriba para evitar duplicar contacto/ofertas) */}
          <aside
            className={`order-2 hidden min-w-0 lg:sticky lg:block lg:self-start ${stickyAsideTop} lg:z-10 lg:order-2`}
          >
            <ServiciosActionPanel
              profile={profile}
              lang={lang}
              listingSlug={analyticsListingSlug}
              directContactFasterResponseHint={directContactFasterResponseHint}
            />
            <div className="mt-5 lg:mt-6">
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>
          </aside>
        </div>

        {leonixAdIdFooter ? (
          <p className="mx-auto mt-8 max-w-3xl border-t border-black/[0.06] pt-4 text-center text-[11px] leading-relaxed text-[#7A7164]">
            {lang === "en" ? "Leonix Ad ID" : "Leonix Ad ID"} # {leonixAdIdFooter}
          </p>
        ) : null}
      </main>
    </div>
  );
}
