"use client";

import type { ServiciosProfileResolved, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { SV } from "@/app/servicios/components/serviciosDesignTokens";
import {
  LX_CHIP,
  LX_SECTION_CARD,
  collectProfessionalServiceChips,
  getServicesTitle,
} from "@/app/servicios/components/serviciosLeonixBrand";
import { ServiciosProfessionalHero } from "@/app/servicios/components/ServiciosProfessionalHero";
import {
  hasAboutSectionResolved,
  hasBusinessHighlightsResolved,
  hasGallerySectionResolved,
  hasHeroIdentityResolved,
  hasQuickFactsResolved,
  hasReviewsSectionResolved,
  hasServicesSectionResolved,
  hasTrustSectionResolved,
} from "@/app/servicios/lib/serviciosProfilePresence";
import { ServiciosQuickFacts } from "@/app/servicios/components/ServiciosQuickFacts";
import { ServiciosAbout } from "@/app/servicios/components/ServiciosAbout";
import { ServiciosTrustSection } from "@/app/servicios/components/ServiciosTrustSection";
import { ServiciosOfferedSection } from "@/app/servicios/components/ServiciosServicesGrid";
import { ServiciosGalleryWithTabs } from "@/app/servicios/components/ServiciosGalleryWithTabs";
import { ServiciosReviews } from "@/app/servicios/components/ServiciosReviews";
import { ServiciosBusinessHubContactCard } from "@/app/servicios/components/ServiciosBusinessHubContactCard";
import { ServiciosPromocionesCard } from "@/app/servicios/components/ServiciosPromocionesCard";
import { ServiciosHighlightsSection } from "@/app/servicios/components/ServiciosHighlightsSection";

export function ServiciosProfessionalPreviewShell({
  profile,
  lang,
  template,
  cityFallback,
  draftSlug,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template: ServiciosListingTemplate;
  cityFallback?: string;
  draftSlug?: string;
}) {
  const chips = collectProfessionalServiceChips(profile, 6);
  const servicesTitle = getServicesTitle(template, lang);

  if (!hasHeroIdentityResolved(profile)) {
    return null;
  }

  return (
    <div
      className="min-w-0 overflow-x-hidden rounded-xl border shadow-sm sm:rounded-2xl"
      style={{ backgroundColor: SV.bg, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <ServiciosProfessionalHero
        profile={profile}
        lang={lang}
        template={template}
        cityFallback={cityFallback}
        contactScrollTargetId="servicios-preview-contact"
      />

      <p className="border-b border-[#E8D9C4]/80 bg-[#FFFDF9] px-4 py-2.5 text-center text-[11px] leading-snug text-[#6F6254] sm:px-6">
        {lang === "en"
          ? "Preview — contact actions use your saved phone, WhatsApp, and email below."
          : "Vista previa — el contacto usa el teléfono, WhatsApp y correo que guardaste abajo."}
      </p>

      {chips.length > 0 ? (
        <div className={`mx-3 mt-4 sm:mx-6 ${LX_SECTION_CARD} p-4 sm:p-5`}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6254]">{servicesTitle}</p>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span key={chip} className={LX_CHIP}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10">
          <div className="order-1 flex min-w-0 flex-col gap-5 sm:gap-6">
            {hasQuickFactsResolved(profile) ? (
              <ServiciosQuickFacts facts={profile.quickFacts} lang={lang} compact />
            ) : null}

            {hasTrustSectionResolved(profile) ? (
              <ServiciosTrustSection profile={profile} lang={lang} template={template} />
            ) : null}

            {hasAboutSectionResolved(profile) ? <ServiciosAbout profile={profile} lang={lang} /> : null}

            <div id="servicios-preview-contact" className="scroll-mt-20 lg:hidden">
              <ServiciosBusinessHubContactCard
                profile={profile}
                lang={lang}
                listingTemplate={template}
                directContactFasterResponseHint
                showOfferSidebarTeaser={false}
              />
            </div>

            {hasGallerySectionResolved(profile) ? (
              <ServiciosGalleryWithTabs profile={profile} lang={lang} />
            ) : null}

            <div className="lg:hidden">
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>

            {hasServicesSectionResolved(profile) ? (
              <ServiciosOfferedSection services={profile.services} lang={lang} profileForQuote={profile} />
            ) : null}

            {hasBusinessHighlightsResolved(profile) ? (
              <ServiciosHighlightsSection highlights={profile.highlights} lang={lang} />
            ) : null}

            {hasReviewsSectionResolved(profile) ? (
              <ServiciosReviews profile={profile} lang={lang} />
            ) : null}
          </div>

          <aside className="order-2 hidden min-w-0 lg:block lg:sticky lg:top-4 lg:self-start">
            <div id="servicios-preview-contact-desktop" className="scroll-mt-20">
              <ServiciosBusinessHubContactCard
                profile={profile}
                lang={lang}
                listingTemplate={template}
                directContactFasterResponseHint
                showOfferSidebarTeaser={false}
              />
            </div>
            <div className="mt-5">
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>
          </aside>
        </div>

        {draftSlug?.trim() ? (
          <p className="mx-auto mt-8 max-w-3xl border-t border-black/[0.06] pt-4 text-center text-[11px] leading-relaxed text-[#7A7164]">
            {lang === "en" ? "Draft URL slug" : "URL borrador"}: {draftSlug.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
