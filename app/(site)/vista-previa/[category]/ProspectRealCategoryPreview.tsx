import type { ReactNode } from "react";

import type { ProspectPreviewPayload } from "@/app/lib/sales/prospectPreviewReader";
import type { ProspectRealComponentCategory } from "@/app/lib/sales/prospectPreviewRealCategories";
import { buildProspectBienesNegocioListing } from "@/app/lib/sales/prospectBienesNegocioListing";
import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";

// SERVICIOS — the exact components + rules the public `/clasificados/servicios/[slug]` page uses.
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { ServiciosProfessionalProfileShell } from "@/app/servicios/components/ServiciosProfessionalProfileShell";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { hasHeroIdentityResolved } from "@/app/servicios/lib/serviciosProfilePresence";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosBusinessProfile } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { mergeServiciosProfileWithApprovedDbReviews } from "@/app/(site)/clasificados/servicios/lib/serviciosDbReviewsMerge";
import { applyServiciosPublicOffersVisibility } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicOffersVisibility";
import { serviciosPublicFooterLeonixAdId } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";
import {
  isServiciosProfessionalTemplate,
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
} from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";

// RESTAURANTES — the exact components + mapping the public `/clasificados/restaurantes/[slug]` page uses.
import { mapRestauranteDraftToShellData } from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { listingJsonToDraft } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { RestauranteAdStoryPreview } from "@/app/clasificados/restaurantes/shell/RestauranteAdStoryPreview";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";
import { restauranteCouponsCapabilityActive } from "@/app/clasificados/restaurantes/lib/restauranteCouponCapabilityServer";

// AUTOS DEALER + BIENES NEGOCIO — client wrappers (they need render-props / hooks).
import { ProspectAutosDealerRealPreview } from "./ProspectAutosDealerRealPreview";
import { ProspectBienesNegocioRealPreview } from "./ProspectBienesNegocioRealPreview";

/**
 * PROSPECT PREVIEW — the four BUSINESS families rendered with the REAL public category components,
 * from the stored row, under the page's own "not published" banner.
 *
 * OWNER LOCK: Quick preview and Full/public are the same presentation. This module therefore owns
 * NO markup, NO CSS and NO width of its own: every width comes from the real component. It does not
 * use `ProspectCategoryPreviewShell`, `layoutQuickMedia` or `ProspectPreviewTranslateAd` — each real
 * component brings its own Translate Ad (the same `TranslateAdControl` + engine the public page uses).
 *
 * NOTHING HERE MUTATES ANYTHING. Every engagement/analytics switch the real components expose is
 * held off (no listing slug / source id, `persistListingEngagement={false}`,
 * `showEngagementControls={false}`, no `publicAnalytics`, no owner id, no view-beacon components).
 * The only extra reads are the SAME read-only entitlement lookups the public pages already do to
 * decide whether coupons/offers are visible.
 *
 * Returns `null` when the stored content cannot produce a real render (e.g. a Servicios draft with
 * no business name yet); the caller then keeps the generic prospect shell rather than faking one.
 */
export async function renderProspectRealCategoryPreview(args: {
  category: ProspectRealComponentCategory;
  payload: ProspectPreviewPayload;
  lang: "es" | "en";
}): Promise<ReactNode | null> {
  const { category, payload, lang } = args;
  try {
    switch (category) {
      case "servicios":
        return await renderServicios(payload, lang);
      case "restaurantes":
        return await renderRestaurantes(payload, lang);
      case "autos":
        return renderAutosDealer(payload, lang);
      case "bienes-raices":
        return renderBienesNegocio(payload, lang);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

async function renderServicios(payload: ProspectPreviewPayload, lang: ServiciosLang): Promise<ReactNode | null> {
  if (!payload.content) return null;
  const row = payload.row ?? {};
  const profileJson = payload.content as unknown as ServiciosBusinessProfile;

  // Same steps as the public page: merge (no approved DB reviews exist for an unpublished ad),
  // stamp the row's own verified flag, resolve the wire profile for the viewer language.
  const wireMerged = mergeServiciosProfileWithApprovedDbReviews({ ...profileJson }, []);
  wireMerged.identity = { ...wireMerged.identity, leonixVerified: row.leonix_verified === true };
  const profile = resolveServiciosProfile(wireMerged, lang);
  if (!hasHeroIdentityResolved(profile)) return null;

  const leonixAdIdFooter = serviciosPublicFooterLeonixAdId(typeof row.leonix_ad_id === "string" ? row.leonix_ad_id : null);

  // Included offers follow live entitlement truth exactly like the public page (read-only lookup;
  // fails closed).
  const offersAccess = await resolveBusinessToolsAccess({
    category: "servicios",
    listingSource: "servicios_public_listings",
    listingId: payload.listingId,
    capability: "coupons_offers",
  }).catch(() => null);
  const publicProfile = applyServiciosPublicOffersVisibility(profile, offersAccess?.allowed === true);

  const listingTemplate = resolveServiciosListingTemplate({
    businessTypeId: readServiciosProfileBusinessTypeId(profileJson),
    internalGroup: typeof row.internal_group === "string" ? row.internal_group : null,
    categoryLabel: profile.hero.categoryLine,
  });

  // Engagement/analytics OFF: no analyticsListingSlug / listingSourceId / engagementListingId /
  // owner id, no share url, no lead form, no like count. Public-visitor chrome (no top bar).
  const profileShellProps = {
    profile: publicProfile,
    lang,
    showEngagementControls: false,
    persistListingEngagement: false,
    leonixAdIdFooter,
    showPublicLeadInquiryForm: false,
    directContactFasterResponseHint: false,
  } as const;

  return isServiciosProfessionalTemplate(listingTemplate) ? (
    <ServiciosProfessionalProfileShell
      {...profileShellProps}
      template={listingTemplate}
      showTopBar={false}
      showMobileSectionNav={false}
    />
  ) : (
    <ServiciosProfileView {...profileShellProps} showTopBar={false} />
  );
}

async function renderRestaurantes(payload: ProspectPreviewPayload, lang: "es" | "en"): Promise<ReactNode | null> {
  if (!payload.content) return null;
  const draft = listingJsonToDraft(payload.content);
  const shellData = mapRestauranteDraftToShellData(draft, { lang });

  // Coupon module visibility is live commercial truth only, exactly like the public page.
  const couponsIncluded = await restauranteCouponsCapabilityActive(payload.listingId);
  const shellForPublic = {
    ...shellData,
    id: payload.listingId,
    coupons: couponsIncluded ? shellData.coupons : undefined,
    couponFlyer: couponsIncluded ? shellData.couponFlyer : undefined,
    couponMoreOffers: couponsIncluded ? shellData.couponMoreOffers : undefined,
  };

  return (
    <RestaurantesShellChrome lang={lang}>
      <div className="mx-auto max-w-[1280px] space-y-3 px-4 pt-4 md:px-5 lg:px-6">
        <ClasificadosPreviewAdCanvas className="overflow-hidden">
          {/* No RestauranteProfileViewAnalytics beacon. An EMPTY listingSourceId (not undefined —
              the component would fall back to `data.id`) plus persistListingEngagement={false}
              keeps every CTA/engagement recorder and the live Community Trust fetch off. No owner id. */}
          <RestauranteAdStoryPreview
            data={shellForPublic}
            listingId={payload.listingId}
            listingSourceId=""
            listingSlug=""
            lang={lang}
            analyticsOwnerUserId={null}
            persistListingEngagement={false}
            linkedOffers={[]}
          />
        </ClasificadosPreviewAdCanvas>
      </div>
    </RestaurantesShellChrome>
  );
}

function renderAutosDealer(payload: ProspectPreviewPayload, lang: "es" | "en"): ReactNode | null {
  if (!payload.content) return null;
  const authored = payload.row?.lang;
  return (
    <ProspectAutosDealerRealPreview
      listing={payload.content}
      lang={lang}
      authoredLang={authored === "en" || authored === "es" ? authored : null}
      listingKey={payload.listingId}
    />
  );
}

function renderBienesNegocio(payload: ProspectPreviewPayload, lang: "es" | "en"): ReactNode | null {
  const listing = buildProspectBienesNegocioListing(payload.row, payload.listingId);
  if (!listing) return null;
  return <ProspectBienesNegocioRealPreview listing={listing} lang={lang} />;
}
