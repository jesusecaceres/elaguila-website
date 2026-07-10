"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { SV } from "./serviciosDesignTokens";
import {
  LX_PRO_INNER_PAD,
  LX_PRO_MAIN_MAX,
  LX_PRO_SECTION_GAP,
} from "./serviciosLeonixBrand";
import { ServiciosProfessionalHero } from "./ServiciosProfessionalHero";
import {
  hasAboutSectionResolved,
  hasGallerySectionResolved,
  hasHeroIdentityResolved,
  hasPaidCouponsSectionResolved,
  hasReviewsSectionResolved,
  hasServicesSectionResolved,
} from "../lib/serviciosProfilePresence";
import { ServiciosTopBar } from "./ServiciosTopBar";
import { ServiciosProfileViewAnalytics } from "./ServiciosProfileViewAnalytics";
import { ServiciosPublicTranslationLayer } from "./ServiciosPublicTranslationLayer";
import { ServiciosAbout } from "./ServiciosAbout";
import { ServiciosOfferedSection } from "./ServiciosServicesGrid";
import { ServiciosGalleryWithTabs } from "./ServiciosGalleryWithTabs";
import { ServiciosReviews } from "./ServiciosReviews";
import { ServiciosCouponsCard } from "./ServiciosCouponsCard";
import { ServiciosBusinessHubContactCard } from "./ServiciosBusinessHubContactCard";
import { ServiciosLeadInquiryForm } from "./ServiciosLeadInquiryForm";
import { ServiciosTrackedLink } from "./ServiciosTrackedLink";
import { ServiciosHours } from "./ServiciosHours";
import { ServiciosVisualProofRow } from "./ServiciosVisualProofRow";
import { ServiciosPublicDetailsCanvas } from "./ServiciosPublicDetailsCanvas";
import { ServiciosGroupedHowSection } from "./ServiciosGroupedHowSection";
import { ServiciosPagosBeneficiosSection } from "./ServiciosPagosBeneficiosSection";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import {
  serviciosSavedListingExtras,
  serviciosSavedListingExtrasFromClient,
} from "@/app/lib/serviciosSavedListingIdentity";
import {
  serviciosGlobalListingFromRow,
  serviciosGlobalLikeRecorder,
  serviciosGlobalSaveRecorder,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { ServiciosLikeEngagementCluster } from "./ServiciosLikeEngagementCluster";

const SECTION_SCROLL =
  "scroll-mt-[4.5rem] scroll-mb-24 sm:scroll-mt-20 lg:scroll-mb-0";

type NavItem = { id: string; label: string };

function mobileNavItems(template: ServiciosListingTemplate, lang: ServiciosLang): NavItem[] {
  const en = lang === "en";
  void template;
  return [
    { id: "servicios-pro-overview", label: en ? "Overview" : "Resumen" },
    { id: "servicios-pro-services", label: en ? "Services" : "Servicios" },
    { id: "servicios-pro-reviews", label: en ? "Reviews" : "Reseñas" },
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
  /** Gate 20F — success panel after publish (`?justPublished=1`). */
  justPublishedPanel?: ReactNode;
  analyticsListingSlug?: string;
  listingSourceId?: string | null;
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
  justPublishedPanel,
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
  serviciosDiscoveryResultsHref,
}: ServiciosProfessionalProfileShellProps) {
  const listingKey = analyticsListingSlug?.trim() || profile.identity.slug;
  const navItems = useMemo(() => mobileNavItems(template, lang), [template, lang]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const lxListingId = (engagementListingId ?? "").trim() || profile.identity.slug;
  const lxOwner = (engagementOwnerUserId ?? "").trim() || undefined;
  const sourceId = (listingSourceId ?? "").trim();
  const saveExtras = sourceId
    ? serviciosSavedListingExtras({
        slug: profile.identity.slug,
        id: sourceId,
        leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
      })
    : serviciosSavedListingExtrasFromClient({
        slug: profile.identity.slug,
        engagementListingId: lxListingId,
      });
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount)
      ? Math.max(0, Math.floor(publicLikeCount))
      : 0;
  const globalListing =
    sourceId && analyticsListingSlug
      ? serviciosGlobalListingFromRow({
          id: sourceId,
          slug: analyticsListingSlug,
          leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(lxListingId) ? lxListingId : null,
        })
      : null;

  const showServicesSection = hasServicesSectionResolved(profile);
  const showReviewsSection = hasReviewsSectionResolved(profile);

  if (!hasHeroIdentityResolved(profile)) {
    return null;
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-[5.5rem] sm:pb-[5rem] lg:pb-16"
      style={{ backgroundColor: SV.bg }}
    >
      {analyticsListingSlug && listingSourceId?.trim() ? (
        <ServiciosProfileViewAnalytics listingSlug={analyticsListingSlug} listingSourceId={listingSourceId.trim()} />
      ) : null}
      <ServiciosTopBar lang={lang} editBackHref={editBackHref} beforeEditBackNavigate={beforeEditBackNavigate} />

      <main className={`${LX_PRO_MAIN_MAX} px-3 py-4 sm:px-6 sm:py-6 lg:px-8`} style={{ backgroundColor: SV.bg }}>
        <div
          className="overflow-hidden rounded-xl border shadow-sm sm:rounded-2xl"
          style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
        >
          {justPublishedPanel ?? null}
          {noticeBanner ? (
            <p
              className="border-b border-amber-200/80 bg-amber-50/95 px-4 py-3 text-center text-sm font-medium text-amber-950"
              role="status"
            >
              {noticeBanner}
            </p>
          ) : null}

          <ServiciosProfessionalHero
            profile={profile}
            lang={lang}
            template={template}
            contactScrollTargetId="servicios-pro-contact"
            listingSlug={analyticsListingSlug}
            listingSourceId={sourceId || undefined}
            engagementListingId={engagementListingId}
            engagementOwnerUserId={engagementOwnerUserId}
            engagementSlot={
              persistListingEngagement ? (
                <div className="flex flex-wrap items-center gap-2">
                  <ServiciosLikeEngagementCluster
                    listingId={lxListingId}
                    ownerUserId={lxOwner}
                    lang={lang}
                    publicLikeCount={likeCueN}
                    persistEngagement={persistListingEngagement}
                    variant="small"
                    tone="hero"
                    recordLikeEvent={
                      globalListing ? serviciosGlobalLikeRecorder(globalListing) : undefined
                    }
                  />
                  <LeonixSaveButton
                    listingId={lxListingId}
                    ownerUserId={lxOwner}
                    variant="small"
                    lang={lang}
                    category="servicios"
                    persistEngagement={persistListingEngagement}
                    saveExtras={saveExtras}
                    recordSaveEvent={
                      globalListing ? serviciosGlobalSaveRecorder(globalListing) : undefined
                    }
                  />
                  <LeonixShareButton
                    listingId={lxListingId}
                    listingUrl={listingShareUrl}
                    ownerUserId={lxOwner}
                    listingTitle={profile.identity.businessName}
                    variant="small"
                    lang={lang}
                    category="servicios"
                    persistEngagement={persistListingEngagement}
                    recordShareEvent={
                      globalListing ? serviciosGlobalShareRecorder(globalListing, "detail_share") : undefined
                    }
                    directNativeShare
                  />
                </div>
              ) : undefined
            }
          />

          <ServiciosPublicTranslationLayer profile={profile} lang={lang} listingKey={listingKey}>
            {(displayProfile, translateControl) => {
              const showCouponBlock =
                hasPaidCouponsSectionResolved(displayProfile) ||
                Boolean(displayProfile.couponFlyer?.imageUrl?.trim()) ||
                Boolean(displayProfile.couponMoreOffers?.url?.trim());

              return (
          <div className={LX_PRO_INNER_PAD}>
            <section id="servicios-pro-overview" className={`${SECTION_SCROLL} ${LX_PRO_SECTION_GAP}`}>
              {translateControl ? <div>{translateControl}</div> : null}

              {hasAboutSectionResolved(profile) ? (
                <ServiciosAbout profile={displayProfile} lang={lang} premiumLeonixTone />
              ) : null}

              <div id="servicios-pro-contact" className={SECTION_SCROLL}>
                <ServiciosBusinessHubContactCard
                  profile={profile}
                  lang={lang}
                  listingTemplate={template}
                  listingSlug={analyticsListingSlug}
                  listingSourceId={sourceId || listingSourceId}
                  listingShareUrl={listingShareUrl}
                  engagementListingId={engagementListingId}
                  engagementOwnerUserId={engagementOwnerUserId}
                  persistListingEngagement={persistListingEngagement}
                  publicLikeCount={publicLikeCount}
                  directContactFasterResponseHint={directContactFasterResponseHint}
                  showOfferSidebarTeaser={false}
                />
              </div>

              <ServiciosVisualProofRow profile={displayProfile} lang={lang} />

              {showCouponBlock ? (
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
                  listingSourceId={sourceId || listingSourceId}
                  listingShareUrl={listingShareUrl}
                  combinedMediaLayout
                />
              ) : null}

              {showServicesSection ? (
                <section id="servicios-pro-services" className={SECTION_SCROLL}>
                  <ServiciosOfferedSection
                    services={displayProfile.services}
                    lang={lang}
                    profileForQuote={profile}
                    listingSlug={analyticsListingSlug}
                    listingSourceId={sourceId || listingSourceId}
                    listingShareUrl={listingShareUrl}
                    premiumLeonixTone
                  />
                </section>
              ) : null}

              <ServiciosPublicDetailsCanvas
                profile={profile}
                displayProfile={displayProfile}
                lang={lang}
                template={template}
              />

              <ServiciosGroupedHowSection profile={profile} lang={lang} />

              <ServiciosPagosBeneficiosSection
                profile={profile}
                displayProfile={displayProfile}
                lang={lang}
              />
            </section>

            <div className={`flex min-w-0 flex-col ${LX_PRO_SECTION_GAP}`}>
              {showReviewsSection ? (
                <section id="servicios-pro-reviews" className={SECTION_SCROLL}>
                  <ServiciosReviews profile={profile} lang={lang} />
                </section>
              ) : (
                <section id="servicios-pro-reviews" className={`${SECTION_SCROLL} sr-only`} aria-hidden>
                  <span className="block h-px" />
                </section>
              )}

              {analyticsListingSlug && showPublicLeadInquiryForm ? (
                <ServiciosLeadInquiryForm listingSlug={analyticsListingSlug} lang={lang} />
              ) : null}

              {!profile.contact.hours?.weeklyRows ? (
                <ServiciosHours profile={profile} lang={lang} />
              ) : null}
            </div>

            {leonixAdIdFooter ? (
              <p className="mx-auto mt-8 max-w-3xl border-t border-black/[0.06] pt-4 text-center text-[11px] leading-relaxed text-[#7A7164]">
                {lang === "en" ? "Leonix Ad ID" : "Leonix Ad ID"} # {leonixAdIdFooter}
              </p>
            ) : null}
            {serviciosDiscoveryResultsHref?.trim() ? (
              <div className="mx-auto mt-4 flex max-w-3xl justify-center pb-2">
                <ServiciosTrackedLink
                  listingSlug={analyticsListingSlug}
                  sourceId={sourceId || listingSourceId}
                  engagementListingId={engagementListingId}
                  ownerUserId={engagementOwnerUserId}
                  eventType="cta_secondary_click"
                  href={serviciosDiscoveryResultsHref.trim()}
                  className="text-sm font-bold text-[#7A1E2C] underline-offset-4 hover:underline"
                  data-servicios-results-cta="1"
                >
                  {lang === "en" ? "View Servicios results" : "Ver resultados de Servicios"}
                </ServiciosTrackedLink>
              </div>
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
