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
  labelEn: string;
  /** Keyword for results `q=` (locale-specific). */
  resultsQueryEs: string;
  resultsQueryEn: string;
  /** Optional trade `group=` when keyword search is not the best fit */
  resultsGroup?: string;
};

export type ServiciosLandingExploreCategory = {
  id: string;
  labelEs: string;
  labelEn: string;
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

/** Popular shortcuts → `/resultados` with real `q=` keyword search (no counts, no fake rows). */
export const SERVICIOS_LANDING_QUICK_CHIPS: ServiciosQuickChip[] = [
  {
    id: "web",
    labelEs: "Diseño web",
    labelEn: "Web design",
    resultsQueryEs: "diseño web",
    resultsQueryEn: "web design",
  },
  {
    id: "limpieza",
    labelEs: "Limpieza",
    labelEn: "Cleaning",
    resultsQueryEs: "limpieza",
    resultsQueryEn: "cleaning",
  },
  {
    id: "plomeria",
    labelEs: "Plomería",
    labelEn: "Plumbing",
    resultsQueryEs: "plomería",
    resultsQueryEn: "plumbing",
  },
  {
    id: "electricista",
    labelEs: "Electricista",
    labelEn: "Electrician",
    resultsQueryEs: "electricista",
    resultsQueryEn: "electrician",
  },
  {
    id: "jardineria",
    labelEs: "Jardinería",
    labelEn: "Landscaping",
    resultsQueryEs: "jardinería",
    resultsQueryEn: "landscaping",
  },
  {
    id: "mecanica",
    labelEs: "Mecánica",
    labelEn: "Mechanics",
    resultsQueryEs: "mecánica",
    resultsQueryEn: "mechanics",
  },
  {
    id: "reparaciones",
    labelEs: "Reparaciones",
    labelEn: "Repairs",
    resultsQueryEs: "reparaciones",
    resultsQueryEn: "repairs",
  },
  {
    id: "consultoria",
    labelEs: "Consultoría",
    labelEn: "Consulting",
    resultsQueryEs: "consultoría",
    resultsQueryEn: "consulting",
  },
  {
    id: "entretenimiento-musica",
    labelEs: "Entretenimiento y música",
    labelEn: "Entertainment & music",
    resultsQueryEs: "",
    resultsQueryEn: "",
    resultsGroup: "events_entertainment",
  },
  {
    id: "more",
    labelEs: "Ver más",
    labelEn: "See more",
    resultsQueryEs: "",
    resultsQueryEn: "",
  },
];

export const SERVICIOS_LANDING_EXPLORE_CATEGORIES: ServiciosLandingExploreCategory[] = [
  { id: "plomeria", labelEs: "Plomería", labelEn: "Plumbing", icon: "🔧", resultsGroup: "home_trade" },
  { id: "electricista", labelEs: "Electricista", labelEn: "Electrical", icon: "⚡", resultsGroup: "home_trade" },
  { id: "roof", labelEs: "Techado / techo", labelEn: "Roofing", icon: "🏠", resultsGroup: "home_trade" },
  { id: "limpieza", labelEs: "Limpieza", labelEn: "Cleaning", icon: "✨", resultsGroup: "cleaning" },
  { id: "reparacion-auto", labelEs: "Reparación Auto", labelEn: "Auto repair", icon: "🚗", resultsGroup: "automotive" },
  { id: "tutoria", labelEs: "Tutoría", labelEn: "Tutoring", icon: "📚", resultsGroup: "education" },
  { id: "jardineria", labelEs: "Jardinería", labelEn: "Landscaping", icon: "🌿", resultsGroup: "home_trade" },
  { id: "mascotas", labelEs: "Mascotas", labelEn: "Pets", icon: "🐾", resultsGroup: "pets" },
];

