import type {
  OfertaLocalBusinessCategory,
  OfertaLocalLanguageTag,
  OfertaLocalMarketType,
  OfertaLocalOfferType,
} from "./ofertasLocalesTypes";

export const OFERTAS_LOCALES_CATEGORY_KEY = "ofertas-locales" as const;
export const OFERTAS_LOCALES_PRODUCT_NAME = "Ofertas Locales";
export const OFERTAS_LOCALES_NAV_LABEL = "Ofertas";

/** Planned routes — not implemented in Gate 1. */
export const OFERTAS_LOCALES_ROUTES = {
  landing: "/ofertas-locales",
  results: "/ofertas-locales/resultados",
  detail: "/ofertas-locales/oferta",
  publish: "/publicar/ofertas-locales",
  admin: "/admin/ofertas-locales",
} as const;

export const OFERTAS_LOCALES_OFFER_TYPE_OPTIONS: ReadonlyArray<{
  value: OfertaLocalOfferType;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "weekly_flyer", labelEs: "Volante semanal", labelEn: "Weekly flyer" },
  { value: "coupon", labelEs: "Cupón", labelEn: "Coupon" },
  { value: "promotion", labelEs: "Promoción", labelEn: "Promotion" },
  { value: "seasonal_special", labelEs: "Especial de temporada", labelEn: "Seasonal special" },
  { value: "bundle", labelEs: "Paquete / combo", labelEn: "Bundle" },
  { value: "featured_deal", labelEs: "Oferta destacada", labelEn: "Featured deal" },
];

export const OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS: ReadonlyArray<{
  value: OfertaLocalBusinessCategory;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "supermarket", labelEs: "Supermercado", labelEn: "Supermarket" },
  { value: "carniceria", labelEs: "Carnicería", labelEn: "Butcher shop" },
  { value: "panaderia", labelEs: "Panadería", labelEn: "Bakery" },
  { value: "produce_market", labelEs: "Mercado de produce", labelEn: "Produce market" },
  { value: "restaurant", labelEs: "Restaurante", labelEn: "Restaurant" },
  { value: "tire_shop", labelEs: "Llantera", labelEn: "Tire shop" },
  { value: "auto_service", labelEs: "Servicio automotriz", labelEn: "Auto service" },
  { value: "beauty_salon", labelEs: "Salón de belleza", labelEn: "Beauty salon" },
  { value: "tax_service", labelEs: "Servicios de impuestos", labelEn: "Tax service" },
  { value: "retail", labelEs: "Retail / tienda", labelEn: "Retail" },
  { value: "event_hall", labelEs: "Salón de eventos", labelEn: "Event hall" },
  { value: "other_service", labelEs: "Otro servicio", labelEn: "Other service" },
];

export const OFERTAS_LOCALES_MARKET_TYPE_OPTIONS: ReadonlyArray<{
  value: OfertaLocalMarketType;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "mexican", labelEs: "Mexicano", labelEn: "Mexican" },
  { value: "latino", labelEs: "Latino", labelEn: "Latino" },
  { value: "asian", labelEs: "Asiático", labelEn: "Asian" },
  { value: "indian", labelEs: "Indio", labelEn: "Indian" },
  { value: "middle_eastern", labelEs: "Medio Oriente", labelEn: "Middle Eastern" },
  { value: "american", labelEs: "Americano", labelEn: "American" },
  { value: "international", labelEs: "Internacional", labelEn: "International" },
  { value: "specialty", labelEs: "Especialidad", labelEn: "Specialty" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

export const OFERTAS_LOCALES_LANGUAGE_TAG_OPTIONS: ReadonlyArray<{
  value: OfertaLocalLanguageTag;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "es", labelEs: "Español", labelEn: "Spanish" },
  { value: "en", labelEs: "Inglés", labelEn: "English" },
  { value: "bilingual", labelEs: "Bilingüe", labelEn: "Bilingual" },
];

/** Monthly pricing packages (USD). */
export const OFERTAS_LOCALES_PRICING = {
  digitalCouponListing: { label: "Digital Coupon Listing", amountUsd: 99, interval: "month" as const },
  digitalWeeklySpecials: { label: "Digital Weekly Specials", amountUsd: 199, interval: "month" as const },
  foundingWeeklyPartner: {
    label: "Founding Weekly Partner",
    amountUsd: 499,
    interval: "month" as const,
    durationMonths: 3,
  },
  quarterLocalDeals: { label: "Quarter Local Deals", amountUsd: 599, interval: "month" as const },
  halfGrowth: { label: "Half Growth", amountUsd: 899, interval: "month" as const },
  fullAuthority: { label: "Full Authority", amountUsd: 1399, interval: "month" as const },
  premiumCommunityCampaign: {
    label: "Premium Community Campaign",
    amountUsd: 2000,
    interval: "month" as const,
  },
  aiSearchableSpecialsAddOn: {
    label: "AI Searchable Specials Add-On",
    amountUsd: 199,
    interval: "month" as const,
    isAddOn: true,
  },
  couponBoost: {
    label: "Coupon Boost",
    amountUsdMin: 49,
    amountUsdMax: 99,
    interval: "month" as const,
    isAddOn: true,
  },
} as const;

export const OFERTAS_LOCALES_VERSION_1_FEATURES = [
  "Admin-managed offers",
  "Public landing and results pages",
  "ZIP / city / category / offer-type filters",
  "Flyer, PDF, image, and coupon viewer",
  "Valid-from and valid-until dates",
  "Call, directions, and share buttons",
  "QR-friendly detail pages",
] as const;

export const OFERTAS_LOCALES_VERSION_2_FEATURES = [
  "Manual item entry",
  "Item search",
  "Item-to-flyer flow",
  "Review and approve workflow",
  "Google Document AI scan jobs",
  "AI Searchable Specials +$199/mo add-on",
] as const;

export const OFERTAS_LOCALES_DEFAULT_FILTERS = {
  offerType: "" as OfertaLocalOfferType | "",
  businessCategory: "" as OfertaLocalBusinessCategory | "",
  marketType: "" as OfertaLocalMarketType | "",
  city: "",
  zipCode: "",
  query: "",
  includeExpired: false,
} as const;

/** Validation limits — aligned with future publish forms. */
export const OFERTAS_LOCALES_VALIDATION_LIMITS = {
  businessNameMin: 2,
  businessNameMax: 120,
  titleMin: 3,
  titleMax: 160,
  descriptionMax: 4000,
  couponTextMax: 2000,
  flyerTitleMax: 160,
  cityMax: 80,
  stateMax: 40,
  zipCodeLen: 5,
  serviceZipCodesMax: 25,
  phoneDigitsMin: 10,
  whatsappDigitsMin: 8,
  flyerAssetsMax: 12,
  couponAssetsMax: 6,
  languageTagsMax: 3,
  internalNotesMax: 2000,
} as const;
