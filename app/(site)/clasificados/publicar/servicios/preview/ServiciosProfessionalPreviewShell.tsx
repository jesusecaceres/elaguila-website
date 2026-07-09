"use client";

import { useEffect, useMemo, useState } from "react";
import type { ServiciosProfileResolved, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { SV } from "@/app/servicios/components/serviciosDesignTokens";
import { LX_PRO_INNER_PAD, LX_PRO_SECTION_GAP } from "@/app/servicios/components/serviciosLeonixBrand";
import { ServiciosProfessionalHero } from "@/app/servicios/components/ServiciosProfessionalHero";
import {
  hasAboutSectionResolved,
  hasGallerySectionResolved,
  hasHeroIdentityResolved,
  hasPaidCouponsSectionResolved,
  hasReviewsSectionResolved,
  hasServicesSectionResolved,
} from "@/app/servicios/lib/serviciosProfilePresence";
import { ServiciosAbout } from "@/app/servicios/components/ServiciosAbout";
import { ServiciosOfferedSection } from "@/app/servicios/components/ServiciosServicesGrid";
import { ServiciosGalleryWithTabs } from "@/app/servicios/components/ServiciosGalleryWithTabs";
import { ServiciosReviews } from "@/app/servicios/components/ServiciosReviews";
import { ServiciosBusinessHubContactCard } from "@/app/servicios/components/ServiciosBusinessHubContactCard";
import { ServiciosCouponsCard } from "@/app/servicios/components/ServiciosCouponsCard";
import { ServiciosVisualProofRow } from "@/app/servicios/components/ServiciosVisualProofRow";
import { ServiciosPublicDetailsCanvas } from "@/app/servicios/components/ServiciosPublicDetailsCanvas";
import { ServiciosGroupedHowSection } from "@/app/servicios/components/ServiciosGroupedHowSection";
import { ServiciosPagosBeneficiosSection } from "@/app/servicios/components/ServiciosPagosBeneficiosSection";
import type { ClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationTypes";
import { loadClasificadosServiciosApplicationResolved } from "../lib/clasificadosServiciosStorage";
import { normalizeClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationNormalize";
import { mergeClasificadosCouponsOntoServiciosProfile } from "../lib/mapClasificadosServiciosApplicationToServiciosDraft";

const SECTION_SCROLL = "scroll-mt-24";

function resolvePreviewDisplayProfile(
  profile: ServiciosProfileResolved,
  lang: ServiciosLang,
  applicationState?: ClasificadosServiciosApplicationState | null,
): ServiciosProfileResolved {
  if (applicationState) {
    if (!applicationState.couponsAddOn) {
      return { ...profile, promotions: [], coupons: [] };
    }
    return mergeClasificadosCouponsOntoServiciosProfile(profile, applicationState, lang);
  }
  return profile;
}

function hasCouponBlock(profile: ServiciosProfileResolved): boolean {
  return (
    hasPaidCouponsSectionResolved(profile) ||
    Boolean(profile.couponFlyer?.imageUrl?.trim()) ||
    Boolean(profile.couponMoreOffers?.url?.trim())
  );
}

export function ServiciosProfessionalPreviewShell({
  profile,
  lang,
  template,
  cityFallback,
  applicationState,
  draftSlug,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template: ServiciosListingTemplate;
  cityFallback?: string;
  applicationState?: ClasificadosServiciosApplicationState | null;
  draftSlug?: string;
}) {
  const syncedProfile = useMemo(
    () => resolvePreviewDisplayProfile(profile, lang, applicationState),
    [profile, lang, applicationState],
  );

  const [displayProfile, setDisplayProfile] = useState(syncedProfile);

  useEffect(() => {
    setDisplayProfile(syncedProfile);
  }, [syncedProfile]);

  useEffect(() => {
    if (applicationState) return;
    if (!draftSlug?.trim()) return;
    let cancelled = false;
    void (async () => {
      const raw = await loadClasificadosServiciosApplicationResolved();
      if (cancelled) return;
      if (!raw) return;
      const normalized = normalizeClasificadosServiciosApplicationState(raw);
      setDisplayProfile((current) => {
        const merged = mergeClasificadosCouponsOntoServiciosProfile(current, normalized, lang);
        if (hasPaidCouponsSectionResolved(merged)) return merged;
        if (hasPaidCouponsSectionResolved(current)) return current;
        return merged;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationState, draftSlug, lang]);

  if (!hasHeroIdentityResolved(displayProfile)) {
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

      <div className={LX_PRO_INNER_PAD}>
        <div className={`flex min-w-0 flex-col ${LX_PRO_SECTION_GAP}`}>
          {hasAboutSectionResolved(displayProfile) ? (
            <ServiciosAbout profile={displayProfile} lang={lang} premiumLeonixTone />
          ) : null}

          <div id="servicios-preview-contact" className={SECTION_SCROLL}>
            <ServiciosBusinessHubContactCard
              profile={displayProfile}
              lang={lang}
              listingTemplate={template}
              directContactFasterResponseHint
              showOfferSidebarTeaser={false}
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

          <ServiciosPublicDetailsCanvas
            profile={displayProfile}
            displayProfile={displayProfile}
            lang={lang}
            template={template}
          />

          <ServiciosGroupedHowSection profile={displayProfile} lang={lang} />

          <ServiciosPagosBeneficiosSection
            profile={displayProfile}
            displayProfile={displayProfile}
            lang={lang}
          />

          {hasReviewsSectionResolved(displayProfile) ? (
            <ServiciosReviews profile={displayProfile} lang={lang} />
          ) : null}
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
