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
  /** Extra URL params (e.g. licensed=1, langEs=1) */
  resultsParams?: Record<string, string>;
};

export type ServiciosLandingExploreCategory = {
  id: string;
  labelEs: string;
  labelEn: string;
  icon: string;
  /** Trade-family filter — must match `ServiciosInternalGroup` / `SERVICIOS_INTERNAL_GROUP_IDS`. */
  resultsGroup?: string;
  /** Keyword for results `q=` when group filter is not the best fit. */
  resultsQueryEs?: string;
  resultsQueryEn?: string;
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

/** Landing quick chips — compact shortcuts wired to real filters / taxonomy. */
export const SERVICIOS_LANDING_QUICK_CHIPS: ServiciosQuickChip[] = [
  { id: "limpieza", labelEs: "Limpieza", labelEn: "Cleaning", resultsQueryEs: "limpieza", resultsQueryEn: "cleaning" },
  { id: "jardineria", labelEs: "Jardinería", labelEn: "Landscaping", resultsQueryEs: "jardinería", resultsQueryEn: "landscaping" },
  { id: "construccion", labelEs: "Construcción", labelEn: "Construction", resultsGroup: "home_trade", resultsQueryEs: "construcción", resultsQueryEn: "construction" },
  { id: "mecanica", labelEs: "Mecánica", labelEn: "Auto repair", resultsGroup: "automotive", resultsQueryEs: "mecánica", resultsQueryEn: "auto repair" },
  { id: "belleza", labelEs: "Belleza", labelEn: "Beauty", resultsGroup: "health_beauty", resultsQueryEs: "belleza", resultsQueryEn: "beauty" },
  { id: "eventos", labelEs: "Eventos", labelEn: "Events", resultsGroup: "events_entertainment", resultsQueryEs: "", resultsQueryEn: "" },
  { id: "emergency", labelEs: "Emergencia", labelEn: "Emergency", resultsQueryEs: "", resultsQueryEn: "", resultsParams: { emergency: "1" } },
  { id: "lang_es", labelEs: "Habla español", labelEn: "Spanish-speaking", resultsQueryEs: "", resultsQueryEn: "", resultsParams: { langEs: "1" } },
  { id: "licensed", labelEs: "Licenciado", labelEn: "Licensed", resultsQueryEs: "", resultsQueryEn: "", resultsParams: { licensed: "1" } },
  { id: "same_day", labelEs: "Mismo día", labelEn: "Same day", resultsQueryEs: "", resultsQueryEn: "", resultsParams: { same_day: "1" } },
];

export const SERVICIOS_LANDING_EXPLORE_CATEGORIES: ServiciosLandingExploreCategory[] = [
  { id: "abogado", labelEs: "Abogados / Legal", labelEn: "Lawyers / Legal", icon: "scale", resultsQueryEs: "abogado", resultsQueryEn: "lawyer" },
  { id: "contador", labelEs: "Contadores", labelEn: "Accountants", icon: "calculator", resultsQueryEs: "contador", resultsQueryEn: "accountant" },
  { id: "dentista", labelEs: "Dentistas / Salud", labelEn: "Dentists / Health", icon: "health", resultsQueryEs: "dentista", resultsQueryEn: "dentist" },
  { id: "limpieza", labelEs: "Limpieza", labelEn: "Cleaning", icon: "spray", resultsQueryEs: "limpieza", resultsQueryEn: "cleaning" },
  { id: "plomeria", labelEs: "Plomería", labelEn: "Plumbing", icon: "tool", resultsQueryEs: "plomería", resultsQueryEn: "plumbing" },
  { id: "electricista", labelEs: "Electricista", labelEn: "Electrician", icon: "bolt", resultsQueryEs: "electricista", resultsQueryEn: "electrician" },
  { id: "jardineria", labelEs: "Jardinería", labelEn: "Landscaping", icon: "plant", resultsQueryEs: "jardinería", resultsQueryEn: "landscaping" },
  { id: "reparacion-auto", labelEs: "Mecánica / Reparación Auto", labelEn: "Mechanic / Auto repair", icon: "car", resultsQueryEs: "mecánica", resultsQueryEn: "auto repair" },
  { id: "belleza-barberia", labelEs: "Belleza / Barbería", labelEn: "Beauty / Barber", icon: "scissors", resultsQueryEs: "barbería", resultsQueryEn: "barber" },
  { id: "tutoria", labelEs: "Tutoría / Clases", labelEn: "Tutoring / Classes", icon: "book", resultsQueryEs: "tutoría", resultsQueryEn: "tutoring" },
];

