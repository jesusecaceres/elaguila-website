/**
 * Data shapes for `/clasificados/servicios` landing cards.
 *
 * **Live listings** — `page.tsx` loads `servicios_public_listings` and maps rows via
 * `lib/serviciosLandingPublicMappers.ts` (Destacados / Recientes).
 *
 * **Quick chips & category tiles** — navigation shortcuts only: they send users to `/resultados`
 * with `group` (and `lang`), not live listing feeds.
 */

export type ServiciosLandingCtaKind = "call" | "detail";

export type ServiciosLandingFeaturedBusiness = {
  id: string;
  businessName: string;
  categoryKey: string;
  /** Localized trade / category line for current locale */
  categoryLine: string;
  city: string;
  zipOrArea: string;
  coverImageSrc: string;
  coverImageAlt: string;
  /** Omitted when the published profile has no hero rating/reviews — do not fabricate stars */
  ratingSummary?: { rating: number; reviewCount: number };
  featured: boolean;
  cta: {
    kind: ServiciosLandingCtaKind;
    label: string;
    detailHref?: string;
    telHref?: string;
  };
};

export type ServiciosQuickChip = {
  id: string;
  labelEs: string;
  /** Maps to `group` on `/clasificados/servicios/resultados` where applicable */
  resultsGroup?: string;
};

export type ServiciosLandingExploreCategory = {
  id: string;
  labelEs: string;
  icon: string;
  resultsGroup?: string;
};

export type ServiciosLandingRecentListing = {
  id: string;
  serviceTitle: string;
  businessName: string;
  description: string;
  coverImageSrc: string;
  coverImageAlt: string;
  /** Omitted when no published rating on hero */
  rating?: number;
  sellerPresentation?: "business" | "independent";
  cta: {
    kind: ServiciosLandingCtaKind;
    label: string;
    telHref?: string;
    detailHref?: string;
  };
};

export const SERVICIOS_LANDING_QUICK_CHIPS: ServiciosQuickChip[] = [
  { id: "plomeria", labelEs: "Plomería", resultsGroup: "home_trade" },
  { id: "electricista", labelEs: "Electricista", resultsGroup: "home_trade" },
  { id: "roof", labelEs: "Roofiero", resultsGroup: "home_trade" },
  { id: "limpieza", labelEs: "Limpieza", resultsGroup: "cleaning" },
  { id: "jardineria", labelEs: "Jardinería", resultsGroup: "home_trade" },
  { id: "tutoria", labelEs: "Tutoría", resultsGroup: "education" },
  { id: "auto", labelEs: "Reparación Auto", resultsGroup: "automotive" },
  { id: "more", labelEs: "Ver más" },
];

export const SERVICIOS_LANDING_EXPLORE_CATEGORIES: ServiciosLandingExploreCategory[] = [
  { id: "plomeria", labelEs: "Plomería", icon: "🔧", resultsGroup: "home_trade" },
  { id: "electricista", labelEs: "Electricista", icon: "⚡", resultsGroup: "home_trade" },
  { id: "roof", labelEs: "Roofiero", icon: "🏠", resultsGroup: "home_trade" },
  { id: "limpieza", labelEs: "Limpieza", icon: "✨", resultsGroup: "cleaning" },
  { id: "reparacion-auto", labelEs: "Reparación Auto", icon: "🚗", resultsGroup: "automotive" },
  { id: "tutoria", labelEs: "Tutoría", icon: "📚", resultsGroup: "education" },
  { id: "jardineria", labelEs: "Jardinería", icon: "🌿", resultsGroup: "home_trade" },
  { id: "mascotas", labelEs: "Mascotas", icon: "🐾", resultsGroup: "pets" },
];

