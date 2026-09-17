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
import { ServiciosHours } from "@/app/servicios/components/ServiciosHours";
import { ServiciosBusinessHubContactCard } from "@/app/servicios/components/ServiciosBusinessHubContactCard";
import { ServiciosLikeEngagementCluster } from "@/app/servicios/components/ServiciosLikeEngagementCluster";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosCouponsCard } from "@/app/servicios/components/ServiciosCouponsCard";
import { ServiciosVisualProofRow } from "@/app/servicios/components/ServiciosVisualProofRow";
import { ServiciosPublicDetailsCanvas } from "@/app/servicios/components/ServiciosPublicDetailsCanvas";
import { ServiciosGroupedHowSection } from "@/app/servicios/components/ServiciosGroupedHowSection";
import { ServiciosPagosBeneficiosSection } from "@/app/servicios/components/ServiciosPagosBeneficiosSection";
import { ServiciosEndOfContentShare } from "@/app/servicios/components/ServiciosEndOfContentShare";
import { useServiciosPublicTranslation } from "@/app/servicios/components/ServiciosPublicTranslationLayer";
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

  const [syncedDisplayProfile, setDisplayProfile] = useState(syncedProfile);
  // Servicios Owner QA (⚠️19 / SVC-QA-16) — this Preview shell (used whenever the application has
  // coupons) never adopted the shared Translate Ad layer the published shells use, so the owner saw
  // no translator in Preview. Same hook, same /api/translate-ad engine, same placement above
  // "Sobre nosotros"; it translates user-authored ad prose only, never static UI.
  // Owner QA 914 — this preview shell never threaded the effective content language into its
  // sections, so canonical catalog labels (payments, amenities, generated summary) and every
  // ad-local heading stayed in the page locale even while Translate Ad was active. `displayLang`
  // is the SAME seam the two published shells already use.
  const { displayProfile, translateControl, displayLang } = useServiciosPublicTranslation({
    profile: syncedDisplayProfile,
    lang,
    listingKey: (draftSlug ?? syncedDisplayProfile.identity.slug).trim(),
  });

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

  const previewEngagementListingId = (draftSlug ?? displayProfile.identity.slug).trim();

  return (
    <div
      className="min-w-0 overflow-x-hidden rounded-xl border shadow-sm sm:rounded-2xl"
      style={{ backgroundColor: SV.bg, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <ServiciosProfessionalHero
        profile={displayProfile}
        lang={displayLang}
        template={template}
        cityFallback={cityFallback}
        contactScrollTargetId="servicios-preview-contact"
        engagementSlot={
          <div className="flex flex-wrap items-center gap-2">
            <ServiciosLikeEngagementCluster
              listingId={previewEngagementListingId}
              lang={displayLang}
              persistEngagement={false}
              variant="small"
              tone="hero"
            />
            <LeonixShareButton
              listingId={previewEngagementListingId}
              listingTitle={displayProfile.identity.businessName}
              variant="small"
              lang={displayLang}
              category="servicios"
              persistEngagement={false}
              directNativeShare
            />
          </div>
        }
      />

      <p className="border-b border-[#E8D9C4]/80 bg-[#FFFDF9] px-4 py-2.5 text-center text-[11px] leading-snug text-[#6F6254] sm:px-6">
        {lang === "en"
          ? "Preview — contact actions use your saved phone, WhatsApp, and email below."
          : "Vista previa — el contacto usa el teléfono, WhatsApp y correo que guardaste abajo."}
      </p>

      <div className={LX_PRO_INNER_PAD}>
        <div className={`flex min-w-0 flex-col ${LX_PRO_SECTION_GAP}`}>
          {translateControl ? <div>{translateControl}</div> : null}

          {hasAboutSectionResolved(displayProfile) ? (
            <ServiciosAbout profile={displayProfile} lang={displayLang} premiumLeonixTone />
          ) : null}

          <div id="servicios-preview-contact" className={SECTION_SCROLL}>
            {/* SVC-QA-18 — the hero above already owns Like + Share (exactly as on the published
                profile), so the hub keeps Save only instead of repeating Like/Share a second time. */}
            <ServiciosBusinessHubContactCard
              profile={displayProfile}
              lang={displayLang}
              listingTemplate={template}
              listingSlug={previewEngagementListingId}
              engagementListingId={previewEngagementListingId}
              showEngagementControls
              persistListingEngagement={false}
              hubEngagementVariant="save_only"
              directContactFasterResponseHint
              showOfferSidebarTeaser={false}
            />
          </div>

          <ServiciosVisualProofRow profile={displayProfile} lang={displayLang} />

          {hasCouponBlock(displayProfile) ? (
            <ServiciosCouponsCard
              coupons={displayProfile.coupons}
              lang={displayLang}
              couponFlyer={displayProfile.couponFlyer}
              couponMoreOffers={displayProfile.couponMoreOffers}
              featuredRow
            />
          ) : null}

          {hasGallerySectionResolved(displayProfile) ? (
            <ServiciosGalleryWithTabs profile={displayProfile} lang={displayLang} combinedMediaLayout />
          ) : null}

          {hasServicesSectionResolved(displayProfile) ? (
            <ServiciosOfferedSection
              services={displayProfile.services}
              lang={displayLang}
              profileForQuote={displayProfile}
              premiumLeonixTone
            />
          ) : null}

          {/* Owner QA 914 — same contentLang seam as the published shells: canonical payment /
              amenity labels and the generated summary now follow the effective content language
              instead of always defaulting to the page locale. */}
          <ServiciosPublicDetailsCanvas
            profile={displayProfile}
            displayProfile={displayProfile}
            lang={displayLang}
            contentLang={displayLang}
            template={template}
          />

          <ServiciosGroupedHowSection profile={displayProfile} displayProfile={displayProfile} lang={displayLang} contentLang={displayLang} />

          <ServiciosPagosBeneficiosSection
            profile={displayProfile}
            displayProfile={displayProfile}
            lang={displayLang}
            contentLang={displayLang}
          />

          <ServiciosEndOfContentShare
            lang={displayLang}
            listingId={previewEngagementListingId}
            listingTitle={displayProfile.identity.businessName}
            persistEngagement={false}
          />

          {hasReviewsSectionResolved(displayProfile) ? (
            <ServiciosReviews profile={displayProfile} lang={displayLang} />
          ) : null}

          {/* Gate I.5.4B — same component + same condition as ServiciosProfessionalProfileShell (Published):
              when a structured weekly schedule exists, ServiciosBusinessHubContactCard above already renders
              it inline, so this section is skipped to avoid showing the same weekly list twice. */}
          {!profile.contact.hours?.weeklyRows ? (
            <ServiciosHours profile={profile} lang={displayLang} />
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
