import type {
  OfertaLocalBusinessCategory,
  OfertaLocalDraftAssetStatus,
  OfertaLocalDraftAssetType,
  OfertaLocalFeaturedPlacementScope,
  OfertaLocalLanguageTag,
  OfertaLocalMagazineDistributionStatus,
  OfertaLocalMarketType,
  OfertaLocalOfferType,
  OfertaLocalPartnerDiscountReason,
  OfertaLocalPartnerType,
  OfertaLocalPricingPackage,
} from "./ofertasLocalesTypes";

export const OFERTAS_LOCALES_CATEGORY_KEY = "ofertas-locales" as const;
export const OFERTAS_LOCALES_PRODUCT_NAME = "Ofertas Locales";
export const OFERTAS_LOCALES_NAV_LABEL = "Ofertas";

/** Digital-first supermarket value proposition — print is not the core sell. */
export const OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS = [
  "Leonix digital traffic",
  "Shopper intent",
  "Local discovery",
  "ZIP / city / category search",
  "Connection to classifieds, services, restaurants, businesses, newsletters, QR campaigns, and future AI search",
] as const;

/** Positioning vs flyer-only platforms. */
export const OFERTAS_LOCALES_FLIPP_VS_LEONIX_POSITIONING =
  "Flipp is a flyer platform. Leonix is a local community traffic platform that can host weekly specials inside a broader ecosystem of classifieds, services, restaurants, businesses, newsletters, QR campaigns, and future AI item search." as const;

/** Partner discount earned through active Leonix magazine pickup/display participation. */
export const OFERTAS_LOCALES_PARTNER_TYPE: OfertaLocalPartnerType = "magazine_pickup_partner";

export const OFERTAS_LOCALES_PARTNER_DISCOUNT_REASON: OfertaLocalPartnerDiscountReason =
  "pickup_partner_discount";

export const OFERTAS_LOCALES_PICKUP_PARTNER_PRICING_NOTE =
  "The pickup partner rate is the target sellable rate. The regular price protects perceived value and gives the business a reason to join the Leonix distribution network." as const;

export const OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STRATEGIC_NOTE =
  "Ofertas Locales creates a natural reason to connect with supermarkets and local businesses and invite them to become Leonix magazine pickup/distribution partners." as const;

/** Default membership / rewards CTA labels (EN + ES). */
export const OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS = {
  joinRewardsEn: "Join Rewards",
  signUpBeforeYouGoEn: "Sign up before you go",
  activateDigitalCouponsEn: "Activate digital coupons",
  joinRewardsEs: "Unirme a recompensas",
  signUpBeforeYouGoEs: "Regístrate antes de ir",
  activateDigitalCouponsEs: "Activar cupones digitales",
} as const;

export const OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS: ReadonlyArray<{
  value: OfertaLocalMagazineDistributionStatus;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "not_offered", labelEs: "No ofrecido", labelEn: "Not offered" },
  { value: "invited", labelEs: "Invitado", labelEn: "Invited" },
  { value: "active", labelEs: "Activo", labelEn: "Active" },
  { value: "paused", labelEs: "Pausado", labelEn: "Paused" },
  { value: "declined", labelEs: "Declinado", labelEn: "Declined" },
];

/** Planned routes — not implemented in Gate 1. */
export const OFERTAS_LOCALES_ROUTES = {
  landing: "/ofertas-locales",
  results: "/ofertas-locales/resultados",
  detail: "/ofertas-locales/oferta",
  publish: "/publicar/ofertas-locales",
  admin: "/admin/ofertas-locales",
} as const;

/** Step 1 — two base sellable products (Stack 9B). */
export const OFERTAS_LOCALES_STEP1_BASE_PRODUCTS = [
  {
    productKey: "weekly_flyer" as const,
    pricingKey: "digitalWeeklySpecials" as const,
    labelEs: "Volante semanal",
    labelEn: "Weekly Flyer",
    priceDisplayMonthly: 399,
    valueCopyEs:
      "Sube tu volante semanal y ayuda a los compradores a encontrarte por ciudad, ZIP, categoría y negocio.",
    valueCopyEn:
      "Upload your weekly flyer and help shoppers find you by city, ZIP, category, and business.",
  },
  {
    productKey: "coupon_promotion" as const,
    pricingKey: "digitalCouponListing" as const,
    labelEs: "Cupón o promoción",
    labelEn: "Coupon / Promotion",
    priceDisplayMonthly: 199,
    valueCopyEs:
      "Publica cupones, promociones, combos, especiales de temporada o descuentos por tiempo limitado.",
    valueCopyEn:
      "Publish coupons, promotions, bundles, seasonal specials, or limited-time deals.",
  },
] as const;

/** Optional promotion subtype when Coupon / Promotion product is selected (internal offerType). */
export const OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS: ReadonlyArray<{
  value: OfertaLocalOfferType;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "coupon", labelEs: "Cupón general", labelEn: "General coupon" },
  { value: "promotion", labelEs: "Promoción general", labelEn: "General promotion" },
  { value: "seasonal_special", labelEs: "Especial de temporada", labelEn: "Seasonal special" },
  { value: "bundle", labelEs: "Paquete / combo", labelEn: "Bundle / combo" },
  { value: "featured_deal", labelEs: "Oferta por tiempo limitado", labelEn: "Limited-time deal" },
];

/** Application-facing AI add-on monthly display (Stack 9B — no partner label). */
export const OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY = 199;

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

/** Final CFO monthly pricing packages (USD) — regular + pickup partner rates. */
export const OFERTAS_LOCALES_PRICING: Record<
  | "digitalCouponListing"
  | "digitalWeeklySpecials"
  | "quarterLocalDeals"
  | "halfGrowth"
  | "fullAuthority"
  | "specialPlacementCampaign"
  | "aiSearchableSpecialsAddOn"
  | "couponBoostAddOn",
  OfertaLocalPricingPackage
> = {
  digitalCouponListing: {
    label: "Digital Coupon Listing",
    regularPriceMonthly: 199,
    pickupPartnerPriceMonthly: 149,
    interval: "month",
  },
  digitalWeeklySpecials: {
    label: "Digital Weekly Specials",
    regularPriceMonthly: 399,
    pickupPartnerPriceMonthly: 299,
    interval: "month",
  },
  quarterLocalDeals: {
    label: "Quarter Local Deals",
    regularPriceMonthly: 799,
    pickupPartnerPriceMonthly: 599,
    interval: "month",
  },
  halfGrowth: {
    label: "Half Growth",
    regularPriceMonthly: 1199,
    pickupPartnerPriceMonthly: 899,
    interval: "month",
  },
  fullAuthority: {
    label: "Full Authority",
    regularPriceMonthly: 1799,
    pickupPartnerPriceMonthly: 1399,
    interval: "month",
  },
  specialPlacementCampaign: {
    label: "Special Placement Campaign",
    regularPriceMonthly: 2750,
    pickupPartnerPriceMonthly: 2250,
    interval: "month",
  },
  aiSearchableSpecialsAddOn: {
    label: "AI Searchable Specials Add-On",
    regularPriceMonthly: 249,
    pickupPartnerPriceMonthly: 199,
    interval: "month",
    isAddOn: true,
  },
  couponBoostAddOn: {
    label: "Coupon Boost Add-On",
    regularPriceMonthly: 149,
    pickupPartnerPriceMonthly: 99,
    interval: "month",
    isAddOn: true,
  },
} as const;

/** Application UI — digital packages only (Stack 6.5A display subset). */
export const OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS = [
  "digitalCouponListing",
  "digitalWeeklySpecials",
  "aiSearchableSpecialsAddOn",
] as const satisfies ReadonlyArray<keyof typeof OFERTAS_LOCALES_PRICING>;

/** Featured placement scope options — intent only (Stack 8). */
export const OFERTAS_LOCALES_FEATURED_PLACEMENT_SCOPE_OPTIONS: ReadonlyArray<{
  value: OfertaLocalFeaturedPlacementScope;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "zip", labelEs: "Por ZIP", labelEn: "By ZIP" },
  { value: "city", labelEs: "Por ciudad", labelEn: "By city" },
  { value: "category", labelEs: "Por categoría", labelEn: "By category" },
  { value: "homepage_or_section", labelEs: "Página principal o sección", labelEn: "Homepage or section" },
  { value: "newsletter", labelEs: "Newsletter", labelEn: "Newsletter" },
  { value: "not_sure", labelEs: "No estoy seguro", labelEn: "Not sure" },
];

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
  "AI Searchable Specials +$249/mo add-on (pickup partner +$199/mo)",
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

export const OFERTAS_LOCALES_DRAFT_ASSET_TYPE_OPTIONS: ReadonlyArray<{
  value: OfertaLocalDraftAssetType;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "flyer_pdf", labelEs: "Volante PDF", labelEn: "Flyer PDF" },
  { value: "flyer_image", labelEs: "Imagen de volante", labelEn: "Flyer image" },
  { value: "coupon_pdf", labelEs: "Cupón PDF", labelEn: "Coupon PDF" },
  { value: "coupon_image", labelEs: "Imagen de cupón", labelEn: "Coupon image" },
  { value: "external_url", labelEs: "URL externa", labelEn: "External URL" },
];

export const OFERTAS_LOCALES_FLYER_DRAFT_ASSET_TYPES: ReadonlyArray<OfertaLocalDraftAssetType> = [
  "flyer_pdf",
  "flyer_image",
  "external_url",
];

export const OFERTAS_LOCALES_COUPON_DRAFT_ASSET_TYPES: ReadonlyArray<OfertaLocalDraftAssetType> = [
  "coupon_pdf",
  "coupon_image",
  "external_url",
];

/** Future accepted MIME families when upload is wired (metadata reference only). */
export const OFERTAS_LOCALES_ACCEPTED_FUTURE_ASSET_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const OFERTAS_LOCALES_DRAFT_ASSET_STATUS_OPTIONS: ReadonlyArray<{
  value: OfertaLocalDraftAssetStatus;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "draft", labelEs: "Borrador", labelEn: "Draft" },
  { value: "ready", labelEs: "Listo", labelEn: "Ready" },
  { value: "needs_upload", labelEs: "Pendiente de carga", labelEn: "Needs upload" },
  { value: "removed", labelEs: "Eliminado", labelEn: "Removed" },
];

export const OFERTAS_LOCALES_MAX_FLYER_ASSETS = 12;
export const OFERTAS_LOCALES_MAX_COUPON_ASSETS = 6;

/** Client-side file picker limits (Stack 5 — no upload yet). */
export const OFERTAS_LOCALES_CLIENT_UPLOAD_MAX_FLYER_MB = 15;
export const OFERTAS_LOCALES_CLIENT_UPLOAD_MAX_COUPON_MB = 10;

export const OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

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
  membershipUrlMax: 500,
  membershipCtaLabelMax: 80,
  membershipNoteMax: 500,
  digitalCouponUrlMax: 500,
  digitalCouponNoteMax: 500,
  magazinePickupNotesMax: 1000,
  magazineMonthlyDropEstimateMax: 40,
  draftAssetTitleMax: 120,
  draftAssetNoteMax: 500,
  draftAssetUrlMax: 500,
  draftAssetFileNameMax: 160,
} as const;

/** AI Product Search architecture — planning constants (Stack 10). */
export const OFERTAS_LOCALES_AI_TOOL_STACK = {
  scanner: "google_document_ai",
  scannerPhase1: "Enterprise Document OCR + Layout Parser",
  scannerPhase2: "Custom Extractor (after sample corpus)",
  normalizer: "leonix_normalizer",
  optionalCleanup: ["openai", "gemini"],
} as const;

export const OFERTAS_LOCALES_AI_PIPELINE_STEPS = [
  "upload_asset",
  "create_scan_job",
  "google_document_ai_scan",
  "leonix_normalizer",
  "item_candidates",
  "business_review",
  "approved_items_live",
  "clickable_item_cards",
  "shopping_list",
  "google_maps_route_v1",
] as const;

export const OFERTAS_LOCALES_AI_REVIEW_RULES = [
  "No AI item goes public without reviewStatus approved",
  "isActive must be true",
  "Parent offer must be approved and within valid dates",
  "Low confidence items default to needs_review",
  "Business can reject or edit before approval",
] as const;

export const OFERTAS_LOCALES_SHOPPING_ROUTE_MAX_STOPS = 5 as const;

export const OFERTAS_LOCALES_GOOGLE_MAPS_ROUTE_V1_NOTE =
  "V1 builds a Google Maps directions URL with up to 5 waypoints — no Maps API key or paid routing API required." as const;
