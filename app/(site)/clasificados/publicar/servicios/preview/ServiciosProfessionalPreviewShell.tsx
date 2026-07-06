"use client";

import { useEffect, useMemo, useState } from "react";
import type { ServiciosProfileResolved, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { SV } from "@/app/servicios/components/serviciosDesignTokens";
import {
  LX_CHIP,
  LX_PRO_ASIDE,
  LX_PRO_GRID,
  LX_PRO_INNER_PAD,
  LX_PRO_SECTION_GAP,
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
  hasPaidCouponsSectionResolved,
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
import { ServiciosCouponsCard } from "@/app/servicios/components/ServiciosCouponsCard";
import { ServiciosHighlightsSection } from "@/app/servicios/components/ServiciosHighlightsSection";
import { loadClasificadosServiciosApplicationResolved } from "../lib/clasificadosServiciosStorage";
import { normalizeClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationNormalize";
import { mergeClasificadosCouponsOntoServiciosProfile } from "../lib/mapClasificadosServiciosApplicationToServiciosDraft";

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
  const chips = collectProfessionalServiceChips(profile, 5);
  const servicesTitle = getServicesTitle(template, lang);
  const [displayProfile, setDisplayProfile] = useState(profile);

  useEffect(() => {
    if (!draftSlug?.trim()) {
      setDisplayProfile(profile);
      return;
    }
    let cancelled = false;
    void (async () => {
      const raw = await loadClasificadosServiciosApplicationResolved();
      if (cancelled) return;
      if (!raw) {
        setDisplayProfile({ ...profile, promotions: [] });
        return;
      }
      const normalized = normalizeClasificadosServiciosApplicationState(raw);
      setDisplayProfile(mergeClasificadosCouponsOntoServiciosProfile(profile, normalized, lang));
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, draftSlug, lang]);

  const showCoupons = useMemo(
    () => hasPaidCouponsSectionResolved(displayProfile),
    [displayProfile],
  );

  if (!hasHeroIdentityResolved(profile)) {
    return null;
  }

  return (
    <div
      className="min-w-0 overflow-x-hidden rounded-xl border shadow-sm sm:rounded-2xl"
      style={{ backgroundColor: SV.bg, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <ServiciosProfessionalHero
        profile={displayProfile}
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
        <div className={`mx-4 mt-5 sm:mx-8 lg:mx-10 ${LX_SECTION_CARD} p-4 sm:p-6`}>
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

      <div className={LX_PRO_INNER_PAD}>
        <div className={LX_PRO_GRID}>
          <div className={`order-1 flex min-w-0 flex-col ${LX_PRO_SECTION_GAP}`}>
            {showCoupons ? (
              <ServiciosCouponsCard
                coupons={displayProfile.coupons}
                lang={lang}
                couponFlyer={displayProfile.couponFlyer}
                couponMoreOffers={displayProfile.couponMoreOffers}
                featuredRow
              />
            ) : null}

            {hasGallerySectionResolved(displayProfile) ? (
              <ServiciosGalleryWithTabs profile={displayProfile} lang={lang} combinedMediaLayout />
            ) : null}

            {hasServicesSectionResolved(displayProfile) ? (
              <ServiciosOfferedSection
                services={displayProfile.services}
                lang={lang}
                profileForQuote={displayProfile}
                premiumLeonixTone
              />
            ) : null}

            {hasQuickFactsResolved(displayProfile) ? (
              <ServiciosQuickFacts facts={displayProfile.quickFacts} lang={lang} compact />
            ) : null}

            {hasTrustSectionResolved(displayProfile) ? (
              <ServiciosTrustSection profile={displayProfile} lang={lang} template={template} />
            ) : null}

            {hasAboutSectionResolved(displayProfile) ? (
              <ServiciosAbout profile={displayProfile} lang={lang} premiumLeonixTone />
            ) : null}

            {hasBusinessHighlightsResolved(displayProfile) ? (
              <ServiciosHighlightsSection highlights={displayProfile.highlights} lang={lang} />
            ) : null}

            {hasReviewsSectionResolved(displayProfile) ? (
              <ServiciosReviews profile={displayProfile} lang={lang} />
            ) : null}

            <div id="servicios-preview-contact" className="scroll-mt-20 lg:hidden">
              <ServiciosBusinessHubContactCard
                profile={displayProfile}
                lang={lang}
                listingTemplate={template}
                directContactFasterResponseHint
                showOfferSidebarTeaser={false}
              />
            </div>
          </div>

          <aside className={`order-2 ${LX_PRO_ASIDE}`}>
            <div id="servicios-preview-contact-desktop" className="scroll-mt-20">
              <ServiciosBusinessHubContactCard
                profile={displayProfile}
                lang={lang}
                listingTemplate={template}
                directContactFasterResponseHint
                showOfferSidebarTeaser={false}
              />
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
