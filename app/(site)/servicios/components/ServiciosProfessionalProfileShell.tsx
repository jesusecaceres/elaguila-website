"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { SV } from "./serviciosDesignTokens";
import {
  LX_CHIP,
  LX_SECTION_CARD,
  collectProfessionalServiceChips,
  getServicesTitle,
} from "./serviciosLeonixBrand";
import { ServiciosProfessionalHero } from "./ServiciosProfessionalHero";
import {
  hasAboutSectionResolved,
  hasAmenityOptionsResolved,
  hasBusinessHighlightsResolved,
  hasCredentialsResolved,
  hasGallerySectionResolved,
  hasHeroIdentityResolved,
  hasOfferSectionResolved,
  hasPaymentMethodsResolved,
  hasQuickFactsResolved,
  hasReviewsSectionResolved,
  hasServicesSectionResolved,
  hasTrustSectionResolved,
} from "../lib/serviciosProfilePresence";
import { ServiciosTopBar } from "./ServiciosTopBar";
import { ServiciosProfileViewAnalytics } from "./ServiciosProfileViewAnalytics";
import { ServiciosPublicTranslationLayer } from "./ServiciosPublicTranslationLayer";
import { ServiciosQuickFacts } from "./ServiciosQuickFacts";
import { ServiciosAbout } from "./ServiciosAbout";
import { ServiciosTrustSection } from "./ServiciosTrustSection";
import { ServiciosOfferedSection } from "./ServiciosServicesGrid";
import { ServiciosGalleryWithTabs } from "./ServiciosGalleryWithTabs";
import { ServiciosReviews } from "./ServiciosReviews";
import { ServiciosLicense } from "./ServiciosLicense";
import { ServiciosSmartTrustSummary } from "./ServiciosSmartTrustSummary";
import { ServiciosHighlightsSection } from "./ServiciosHighlightsSection";
import { ServiciosPromocionesCard } from "./ServiciosPromocionesCard";
import { ServiciosBusinessHubContactCard } from "./ServiciosBusinessHubContactCard";
import { ServiciosLeadInquiryForm } from "./ServiciosLeadInquiryForm";
import { ServiciosHours } from "./ServiciosHours";
import { ServiciosPagosCard } from "./ServiciosPagosCard";
import { ServiciosOpcionesFacilidadesCard } from "./ServiciosOpcionesFacilidadesCard";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";

const SECTION_SCROLL =
  "scroll-mt-[4.5rem] scroll-mb-24 sm:scroll-mt-20 lg:scroll-mb-0";

type NavItem = { id: string; label: string };

function mobileNavItems(template: ServiciosListingTemplate, lang: ServiciosLang): NavItem[] {
  const en = lang === "en";
  if (template === "legal_provider") {
    return [
      { id: "servicios-pro-overview", label: en ? "Overview" : "Resumen" },
      { id: "servicios-pro-reviews", label: en ? "Reviews" : "Reseñas" },
      { id: "servicios-pro-experience", label: en ? "Experience" : "Experiencia" },
      { id: "servicios-pro-contact", label: en ? "Contact" : "Contacto" },
    ];
  }
  return [
    { id: "servicios-pro-overview", label: en ? "Overview" : "Resumen" },
    { id: "servicios-pro-reviews", label: en ? "Reviews" : "Reseñas" },
    { id: "servicios-pro-services", label: en ? "Services" : "Servicios" },
    { id: "servicios-pro-contact", label: en ? "Contact" : "Contacto" },
  ];
}

function ServiciosProfessionalMobileNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate: (id: string) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E8D9C4] bg-[#FFFDF9]/95 backdrop-blur-md lg:hidden"
      aria-label="Section navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="min-h-[44px] flex-1 touch-manipulation rounded-lg px-1 text-[10px] font-bold leading-tight text-[#2A2620] transition hover:bg-[#F5F0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/50 sm:text-[11px]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export type ServiciosProfessionalProfileShellProps = {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template: ServiciosListingTemplate;
  editBackHref?: string;
  beforeEditBackNavigate?: () => void;
  noticeBanner?: string;
  analyticsListingSlug?: string;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  persistListingEngagement?: boolean;
  publicLikeCount?: number;
  listingShareUrl?: string;
  showPublicLeadInquiryForm?: boolean;
  directContactFasterResponseHint?: boolean;
  leonixAdIdFooter?: string | null;
  serviciosDiscoveryResultsHref?: string | null;
};

export function ServiciosProfessionalProfileShell({
  profile,
  lang,
  template,
  editBackHref,
  beforeEditBackNavigate,
  noticeBanner,
  analyticsListingSlug,
  engagementListingId = null,
  engagementOwnerUserId = null,
  persistListingEngagement = false,
  publicLikeCount,
  listingShareUrl,
  showPublicLeadInquiryForm = false,
  directContactFasterResponseHint = false,
  leonixAdIdFooter,
  serviciosDiscoveryResultsHref,
}: ServiciosProfessionalProfileShellProps) {
  const servicesTitle = getServicesTitle(template, lang);
  const listingKey = analyticsListingSlug?.trim() || profile.identity.slug;
  const navItems = useMemo(() => mobileNavItems(template, lang), [template, lang]);

  const scrollToSection = useCallback((id: string) => {
    let targetId = id;
    if (id === "servicios-pro-contact") {
      const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
      targetId = desktop ? "servicios-pro-contact-desktop" : "servicios-pro-contact";
    }
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const lxListingId = (engagementListingId ?? "").trim() || profile.identity.slug;
  const lxOwner = (engagementOwnerUserId ?? "").trim() || undefined;
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount)
      ? Math.max(0, Math.floor(publicLikeCount))
      : 0;

  const showExperience =
    template === "legal_provider" &&
    (hasCredentialsResolved(profile) || hasBusinessHighlightsResolved(profile));

  const showServicesSection = hasServicesSectionResolved(profile);
  const showReviewsSection = hasReviewsSectionResolved(profile);
  const stickyAsideTop = "lg:top-[4.5rem]";

  if (!hasHeroIdentityResolved(profile)) {
    return null;
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-[5.5rem] sm:pb-[5rem] lg:pb-16"
      style={{ backgroundColor: SV.bg }}
    >
      {analyticsListingSlug ? <ServiciosProfileViewAnalytics listingSlug={analyticsListingSlug} /> : null}
      <ServiciosTopBar lang={lang} editBackHref={editBackHref} beforeEditBackNavigate={beforeEditBackNavigate} />

      <main
        className="mx-auto max-w-[1280px] px-3 py-4 sm:px-6 sm:py-6"
        style={{ backgroundColor: SV.bg }}
      >
        <div
          className="overflow-hidden rounded-xl border shadow-sm sm:rounded-2xl"
          style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
        >
          {noticeBanner ? (
            <p
              className="border-b border-amber-200/80 bg-amber-50/95 px-4 py-3 text-center text-sm font-medium text-amber-950"
              role="status"
            >
              {noticeBanner}
            </p>
          ) : null}

          {serviciosDiscoveryResultsHref?.trim() ? (
            <div className="flex justify-end border-b border-[#E8D9C4]/60 px-4 py-2 sm:px-6">
              <Link
                href={serviciosDiscoveryResultsHref.trim()}
                className="text-sm font-bold text-[#7A1E2C] underline-offset-4 hover:underline"
                data-servicios-results-cta="1"
              >
                {lang === "en" ? "View service results" : "Ver resultados de Servicios"}
              </Link>
            </div>
          ) : null}

          <ServiciosProfessionalHero
            profile={profile}
            lang={lang}
            template={template}
            contactScrollTargetId="servicios-pro-contact"
            listingSlug={analyticsListingSlug}
            engagementSlot={
              persistListingEngagement ? (
                <div className="flex flex-wrap items-center gap-2">
                  <LeonixLikeButton
                    listingId={lxListingId}
                    ownerUserId={lxOwner}
                    variant="small"
                    lang={lang}
                    category="servicios"
                    persistEngagement
                  />
                  <LeonixSaveButton
                    listingId={lxListingId}
                    ownerUserId={lxOwner}
                    variant="small"
                    lang={lang}
                    category="servicios"
                    persistEngagement
                  />
                  <LeonixShareButton
                    listingId={lxListingId}
                    listingUrl={listingShareUrl}
                    ownerUserId={lxOwner}
                    listingTitle={profile.identity.businessName}
                    variant="small"
                    lang={lang}
                    category="servicios"
                    persistEngagement
                  />
                  {likeCueN > 0 ? (
                    <span className="text-[11px] font-semibold text-white/90">
                      {lang === "en" ? `${likeCueN} likes` : `${likeCueN} me gusta`}
                    </span>
                  ) : null}
                </div>
              ) : undefined
            }
          />

          <ServiciosPublicTranslationLayer profile={profile} lang={lang} listingKey={listingKey}>
            {(displayProfile, translateControl) => {
              const chips = collectProfessionalServiceChips(displayProfile, 8);
              return (
          <div className="px-3 py-4 sm:px-6 sm:py-6">
            <section id="servicios-pro-overview" className={`${SECTION_SCROLL} space-y-5 sm:space-y-6`}>
              {translateControl ? <div>{translateControl}</div> : null}

              {(chips.length > 0 || hasQuickFactsResolved(profile)) && (
                <div className={`${LX_SECTION_CARD} p-4 sm:p-5`}>
                  {chips.length > 0 ? (
                    <div className="mb-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6254]">
                        {servicesTitle}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                          <span key={chip} className={LX_CHIP}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {hasQuickFactsResolved(profile) ? (
                    <ServiciosQuickFacts facts={profile.quickFacts} lang={lang} compact />
                  ) : null}
                  {hasTrustSectionResolved(profile) ? (
                    <div className="mt-4">
                      <ServiciosTrustSection profile={profile} lang={lang} template={template} />
                    </div>
                  ) : null}
                </div>
              )}

              {hasAboutSectionResolved(profile) ? <ServiciosAbout profile={displayProfile} lang={lang} /> : null}

              {hasGallerySectionResolved(profile) ? (
                <ServiciosGalleryWithTabs
                  profile={profile}
                  lang={lang}
                  listingSlug={analyticsListingSlug}
                  listingShareUrl={listingShareUrl}
                />
              ) : null}
            </section>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10">
              <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
                {showReviewsSection ? (
                  <section id="servicios-pro-reviews" className={SECTION_SCROLL}>
                    <ServiciosReviews profile={profile} lang={lang} />
                  </section>
                ) : (
                  <section id="servicios-pro-reviews" className={`${SECTION_SCROLL} sr-only`} aria-hidden>
                    <span className="block h-px" />
                  </section>
                )}

                {showExperience ? (
                  <section id="servicios-pro-experience" className={`${SECTION_SCROLL} space-y-5 sm:space-y-6`}>
                    {hasCredentialsResolved(profile) ? (
                      <ServiciosLicense profile={profile} lang={lang} />
                    ) : null}
                    {hasBusinessHighlightsResolved(profile) ? (
                      <ServiciosHighlightsSection highlights={displayProfile.highlights} lang={lang} />
                    ) : null}
                    <ServiciosSmartTrustSummary profile={profile} lang={lang} />
                  </section>
                ) : template === "legal_provider" ? (
                  <section id="servicios-pro-experience" className={`${SECTION_SCROLL} sr-only`} aria-hidden>
                    <span className="block h-px" />
                  </section>
                ) : null}

                {template !== "legal_provider" ? (
                  showServicesSection ? (
                    <section id="servicios-pro-services" className={SECTION_SCROLL}>
                      <ServiciosOfferedSection
                        services={displayProfile.services}
                        lang={lang}
                        profileForQuote={profile}
                        listingSlug={analyticsListingSlug}
                        listingShareUrl={listingShareUrl}
                      />
                    </section>
                  ) : (
                    <section id="servicios-pro-services" className={`${SECTION_SCROLL} sr-only`} aria-hidden>
                      <span className="block h-px" />
                    </section>
                  )
                ) : (
                  <section id="servicios-pro-services" className={`${SECTION_SCROLL} sr-only`} aria-hidden>
                    <span className="block h-px" />
                  </section>
                )}

                {template === "legal_provider" && showServicesSection ? (
                  <ServiciosOfferedSection
                    services={displayProfile.services}
                    lang={lang}
                    profileForQuote={profile}
                    listingSlug={analyticsListingSlug}
                    listingShareUrl={listingShareUrl}
                  />
                ) : null}

                {hasPaymentMethodsResolved(profile) ? (
                  <ServiciosPagosCard profile={profile} lang={lang} />
                ) : null}
                {hasAmenityOptionsResolved(profile) ? (
                  <ServiciosOpcionesFacilidadesCard profile={profile} lang={lang} />
                ) : null}

                <div id="servicios-pro-contact" className={`${SECTION_SCROLL} lg:hidden`}>
                  <ServiciosBusinessHubContactCard
                    profile={profile}
                    lang={lang}
                    listingSlug={analyticsListingSlug}
                    listingShareUrl={listingShareUrl}
                    directContactFasterResponseHint={directContactFasterResponseHint}
                    showOfferSidebarTeaser={!hasOfferSectionResolved(profile)}
                  />
                </div>

                <div className="lg:hidden">
                  <ServiciosPromocionesCard profile={displayProfile} lang={lang} />
                </div>

                {analyticsListingSlug && showPublicLeadInquiryForm ? (
                  <ServiciosLeadInquiryForm listingSlug={analyticsListingSlug} lang={lang} />
                ) : null}

                {!profile.contact.hours?.weeklyRows ? (
                  <ServiciosHours profile={profile} lang={lang} />
                ) : null}
              </div>

              <aside
                className={`hidden min-w-0 lg:sticky lg:block lg:self-start ${stickyAsideTop} lg:z-10`}
              >
                <div id="servicios-pro-contact-desktop" className={SECTION_SCROLL}>
                  <ServiciosBusinessHubContactCard
                    profile={profile}
                    lang={lang}
                    listingSlug={analyticsListingSlug}
                    listingShareUrl={listingShareUrl}
                    directContactFasterResponseHint={directContactFasterResponseHint}
                    showOfferSidebarTeaser={!hasOfferSectionResolved(profile)}
                  />
                </div>
                <div className="mt-5 lg:mt-6">
                  <ServiciosPromocionesCard profile={displayProfile} lang={lang} />
                </div>
              </aside>
            </div>

            {leonixAdIdFooter ? (
              <p className="mx-auto mt-8 max-w-3xl border-t border-black/[0.06] pt-4 text-center text-[11px] leading-relaxed text-[#7A7164]">
                {lang === "en" ? "Leonix Ad ID" : "Leonix Ad ID"} # {leonixAdIdFooter}
              </p>
            ) : null}
          </div>
              );
            }}
          </ServiciosPublicTranslationLayer>
        </div>
      </main>

      <ServiciosProfessionalMobileNav items={navItems} onNavigate={scrollToSection} />
    </div>
  );
}
