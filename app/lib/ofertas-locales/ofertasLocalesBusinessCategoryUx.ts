/**
 * Ofertas Locales — primary business category + conditional subtype UX (no DB migration).
 * Subtypes persist in existing market_type / customMarketType fields.
 */

import type {
  OfertaLocalBusinessCategory,
  OfertaLocalDraft,
  OfertaLocalMarketType,
} from "./ofertasLocalesTypes";

export type OfertaLocalSubtypeOption = {
  value: OfertaLocalMarketType;
  labelEs: string;
  labelEn: string;
};

export type OfertaLocalSubtypeLabelKey =
  | "market"
  | "butcher"
  | "bakery"
  | "produce_market"
  | "cuisine"
  | "prepared_food"
  | "automotive"
  | "beauty"
  | "professional"
  | "home"
  | "health"
  | "store"
  | "event"
  | "custom_business";

export const OFERTAS_LOCALES_PRIMARY_BUSINESS_CATEGORY_OPTIONS: ReadonlyArray<{
  value: OfertaLocalBusinessCategory;
  labelEs: string;
  labelEn: string;
}> = [
  { value: "supermarket", labelEs: "Supermercado", labelEn: "Supermarket" },
  { value: "carniceria", labelEs: "Carnicería", labelEn: "Butcher shop" },
  { value: "panaderia", labelEs: "Panadería", labelEn: "Bakery" },
  { value: "produce_market", labelEs: "Mercado de frutas y verduras", labelEn: "Produce market" },
  { value: "restaurant", labelEs: "Restaurante", labelEn: "Restaurant" },
  { value: "prepared_food", labelEs: "Comida preparada", labelEn: "Prepared food" },
  { value: "automotive_services", labelEs: "Servicios automotrices", labelEn: "Automotive services" },
  { value: "beauty_personal_care", labelEs: "Belleza y cuidado personal", labelEn: "Beauty & personal care" },
  { value: "professional_services", labelEs: "Servicios profesionales", labelEn: "Professional services" },
  { value: "home_services", labelEs: "Servicios para el hogar", labelEn: "Home services" },
  { value: "health_wellness", labelEs: "Salud y bienestar", labelEn: "Health & wellness" },
  { value: "retail_store", labelEs: "Tienda", labelEn: "Retail store" },
  { value: "events_entertainment", labelEs: "Eventos y entretenimiento", labelEn: "Events & entertainment" },
  { value: "other_business", labelEs: "Otro negocio", labelEn: "Other business" },
];

const FOOD_MARKET_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "mexican", labelEs: "Mexicano", labelEn: "Mexican" },
  { value: "latino", labelEs: "Latino", labelEn: "Latino" },
  { value: "asian", labelEs: "Asiático", labelEn: "Asian" },
  { value: "indian", labelEs: "Indio", labelEn: "Indian" },
  { value: "middle_eastern", labelEs: "Medio Oriente", labelEn: "Middle Eastern" },
  { value: "international", labelEs: "Internacional", labelEn: "International" },
  { value: "organic", labelEs: "Orgánico", labelEn: "Organic" },
  { value: "specialty", labelEs: "Especialidad", labelEn: "Specialty" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

const BUTCHER_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "mexican", labelEs: "Mexicana", labelEn: "Mexican" },
  { value: "latino", labelEs: "Latina", labelEn: "Latino" },
  { value: "halal", labelEs: "Halal", labelEn: "Halal" },
  { value: "kosher", labelEs: "Kosher", labelEn: "Kosher" },
  { value: "premium_meats", labelEs: "Carnes premium", labelEn: "Premium meats" },
  { value: "poultry", labelEs: "Aves", labelEn: "Poultry" },
  { value: "seafood", labelEs: "Mariscos", labelEn: "Seafood" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otra", labelEn: "Other" },
];

const BAKERY_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "mexican_bakery", labelEs: "Panadería mexicana", labelEn: "Mexican bakery" },
  { value: "latino_bakery", labelEs: "Panadería latina", labelEn: "Latino bakery" },
  { value: "cake_shop", labelEs: "Pastelería", labelEn: "Cake shop" },
  { value: "pastry_shop", labelEs: "Repostería", labelEn: "Pastry shop" },
  { value: "artisan_bread", labelEs: "Pan artesanal", labelEn: "Artisan bread" },
  { value: "donuts", labelEs: "Donas", labelEn: "Donuts" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otra", labelEn: "Other" },
];

const PRODUCE_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "fruits_vegetables", labelEs: "Frutas y verduras", labelEn: "Fruits & vegetables" },
  { value: "organic", labelEs: "Orgánico", labelEn: "Organic" },
  { value: "latino_market", labelEs: "Mercado latino", labelEn: "Latino market" },
  { value: "asian_market", labelEs: "Mercado asiático", labelEn: "Asian market" },
  { value: "international_market", labelEs: "Mercado internacional", labelEn: "International market" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

const CUISINE_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "mexican", labelEs: "Mexicana", labelEn: "Mexican" },
  { value: "latino", labelEs: "Latina", labelEn: "Latino" },
  { value: "american", labelEs: "Americana", labelEn: "American" },
  { value: "asian", labelEs: "Asiática", labelEn: "Asian" },
  { value: "indian", labelEs: "India", labelEn: "Indian" },
  { value: "middle_eastern", labelEs: "Medio Oriente", labelEn: "Middle Eastern" },
  { value: "italian", labelEs: "Italiana", labelEn: "Italian" },
  { value: "seafood", labelEs: "Mariscos", labelEn: "Seafood" },
  { value: "fast_food", labelEs: "Comida rápida", labelEn: "Fast food" },
  { value: "cafe", labelEs: "Cafetería", labelEn: "Cafe" },
  { value: "desserts", labelEs: "Postres", labelEn: "Desserts" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otra", labelEn: "Other" },
];

const PREPARED_FOOD_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "taqueria", labelEs: "Taquería", labelEn: "Taqueria" },
  { value: "food_truck", labelEs: "Lonchera", labelEn: "Food truck" },
  { value: "catering", labelEs: "Catering", labelEn: "Catering" },
  { value: "meal_prep", labelEs: "Meal prep", labelEn: "Meal prep" },
  { value: "snacks", labelEs: "Antojitos", labelEn: "Snacks & small bites" },
  { value: "tamales", labelEs: "Tamales", labelEn: "Tamales" },
  { value: "desserts", labelEs: "Postres", labelEn: "Desserts" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otra", labelEn: "Other" },
];

const AUTOMOTIVE_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "tire_shop", labelEs: "Llantera", labelEn: "Tire shop" },
  { value: "oil_change", labelEs: "Cambio de aceite", labelEn: "Oil change" },
  { value: "general_mechanic", labelEs: "Mecánico general", labelEn: "General mechanic" },
  { value: "brakes", labelEs: "Frenos", labelEn: "Brakes" },
  { value: "transmission", labelEs: "Transmisión", labelEn: "Transmission" },
  { value: "auto_detailing", labelEs: "Auto detailing", labelEn: "Auto detailing" },
  { value: "car_wash", labelEs: "Lavado de autos", labelEn: "Car wash" },
  { value: "auto_glass", labelEs: "Vidrios", labelEn: "Auto glass" },
  { value: "towing", labelEs: "Remolque", labelEn: "Towing" },
  { value: "smog_check", labelEs: "Smog check", labelEn: "Smog check" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

const BEAUTY_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "beauty_salon", labelEs: "Salón de belleza", labelEn: "Beauty salon" },
  { value: "barbershop", labelEs: "Barbería", labelEn: "Barbershop" },
  { value: "nails", labelEs: "Uñas", labelEn: "Nails" },
  { value: "lashes", labelEs: "Pestañas", labelEn: "Lashes" },
  { value: "brows", labelEs: "Cejas", labelEn: "Brows" },
  { value: "makeup", labelEs: "Maquillaje", labelEn: "Makeup" },
  { value: "spa", labelEs: "Spa", labelEn: "Spa" },
  { value: "massage", labelEs: "Masajes", labelEn: "Massage" },
  { value: "esthetics", labelEs: "Estética", labelEn: "Esthetics" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

const PROFESSIONAL_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "tax_services", labelEs: "Impuestos", labelEn: "Tax services" },
  { value: "accounting", labelEs: "Contabilidad", labelEn: "Accounting" },
  { value: "insurance", labelEs: "Seguros", labelEn: "Insurance" },
  { value: "legal", labelEs: "Legal", labelEn: "Legal" },
  { value: "notary", labelEs: "Notaría", labelEn: "Notary" },
  { value: "real_estate", labelEs: "Bienes raíces", labelEn: "Real estate" },
  { value: "consulting", labelEs: "Consultoría", labelEn: "Consulting" },
  { value: "translation", labelEs: "Traducción", labelEn: "Translation" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

const HOME_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "cleaning", labelEs: "Limpieza", labelEn: "Cleaning" },
  { value: "landscaping", labelEs: "Jardinería", labelEn: "Landscaping" },
  { value: "plumbing", labelEs: "Plomería", labelEn: "Plumbing" },
  { value: "electrical", labelEs: "Electricidad", labelEn: "Electrical" },
  { value: "painting", labelEs: "Pintura", labelEn: "Painting" },
  { value: "remodeling", labelEs: "Remodelación", labelEn: "Remodeling" },
  { value: "moving", labelEs: "Mudanzas", labelEn: "Moving" },
  { value: "repairs", labelEs: "Reparaciones", labelEn: "Repairs" },
  { value: "pest_control", labelEs: "Control de plagas", labelEn: "Pest control" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

const HEALTH_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "dental", labelEs: "Dental", labelEn: "Dental" },
  { value: "chiropractic", labelEs: "Quiropráctico", labelEn: "Chiropractic" },
  { value: "physical_therapy", labelEs: "Terapia física", labelEn: "Physical therapy" },
  { value: "fitness", labelEs: "Fitness", labelEn: "Fitness" },
  { value: "nutrition", labelEs: "Nutrición", labelEn: "Nutrition" },
  { value: "clinic", labelEs: "Clínica", labelEn: "Clinic" },
  { value: "pharmacy", labelEs: "Farmacia", labelEn: "Pharmacy" },
  { value: "family_care", labelEs: "Cuidado familiar", labelEn: "Family care" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

const RETAIL_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "clothing", labelEs: "Ropa", labelEn: "Clothing" },
  { value: "shoes", labelEs: "Zapatos", labelEn: "Shoes" },
  { value: "electronics", labelEs: "Electrónica", labelEn: "Electronics" },
  { value: "furniture", labelEs: "Muebles", labelEn: "Furniture" },
  { value: "jewelry", labelEs: "Joyería", labelEn: "Jewelry" },
  { value: "mobile_phones", labelEs: "Celulares", labelEn: "Mobile phones" },
  { value: "home_goods", labelEs: "Productos para el hogar", labelEn: "Home goods" },
  { value: "gifts", labelEs: "Regalos", labelEn: "Gifts" },
  { value: "general", labelEs: "General", labelEn: "General" },
  { value: "other", labelEs: "Otra", labelEn: "Other" },
];

const EVENT_SUBTYPES: OfertaLocalSubtypeOption[] = [
  { value: "event_hall", labelEs: "Salón de eventos", labelEn: "Event hall" },
  { value: "dj", labelEs: "DJ", labelEn: "DJ" },
  { value: "photography", labelEs: "Fotografía", labelEn: "Photography" },
  { value: "video", labelEs: "Video", labelEn: "Video" },
  { value: "decorations", labelEs: "Decoración", labelEn: "Decorations" },
  { value: "table_chair_rentals", labelEs: "Renta de mesas y sillas", labelEn: "Table & chair rentals" },
  { value: "live_music", labelEs: "Música en vivo", labelEn: "Live music" },
  { value: "bounce_houses", labelEs: "Brincolines", labelEn: "Bounce houses" },
  { value: "event_catering", labelEs: "Catering para eventos", labelEn: "Event catering" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

export const OFERTAS_LOCALES_SUBTYPE_LABELS: Record<
  OfertaLocalSubtypeLabelKey,
  { es: string; en: string }
> = {
  market: { es: "Tipo de mercado o comida", en: "Market / food type" },
  butcher: { es: "Tipo de carnicería", en: "Butcher shop type" },
  bakery: { es: "Tipo de panadería", en: "Bakery type" },
  produce_market: { es: "Tipo de mercado", en: "Market type" },
  cuisine: { es: "Tipo de comida", en: "Cuisine type" },
  prepared_food: { es: "Tipo de comida preparada", en: "Prepared food type" },
  automotive: { es: "Tipo de servicio automotriz", en: "Automotive service type" },
  beauty: { es: "Tipo de servicio de belleza", en: "Beauty service type" },
  professional: { es: "Tipo de servicio profesional", en: "Professional service type" },
  home: { es: "Tipo de servicio para el hogar", en: "Home service type" },
  health: { es: "Tipo de servicio de salud", en: "Health service type" },
  store: { es: "Tipo de tienda", en: "Store type" },
  event: { es: "Tipo de evento o entretenimiento", en: "Event or entertainment type" },
  custom_business: { es: "Describe el tipo de negocio", en: "Describe business type" },
};

export const OFERTAS_LOCALES_BUSINESS_SUBCATEGORY_OPTIONS_BY_CATEGORY: Partial<
  Record<OfertaLocalBusinessCategory, { labelKey: OfertaLocalSubtypeLabelKey; options: OfertaLocalSubtypeOption[] }>
> = {
  supermarket: { labelKey: "market", options: FOOD_MARKET_SUBTYPES },
  carniceria: { labelKey: "butcher", options: BUTCHER_SUBTYPES },
  panaderia: { labelKey: "bakery", options: BAKERY_SUBTYPES },
  produce_market: { labelKey: "produce_market", options: PRODUCE_SUBTYPES },
  restaurant: { labelKey: "cuisine", options: CUISINE_SUBTYPES },
  prepared_food: { labelKey: "prepared_food", options: PREPARED_FOOD_SUBTYPES },
  automotive_services: { labelKey: "automotive", options: AUTOMOTIVE_SUBTYPES },
  beauty_personal_care: { labelKey: "beauty", options: BEAUTY_SUBTYPES },
  professional_services: { labelKey: "professional", options: PROFESSIONAL_SUBTYPES },
  home_services: { labelKey: "home", options: HOME_SUBTYPES },
  health_wellness: { labelKey: "health", options: HEALTH_SUBTYPES },
  retail_store: { labelKey: "store", options: RETAIL_SUBTYPES },
  events_entertainment: { labelKey: "event", options: EVENT_SUBTYPES },
};

/** Legacy primary categories → new model for session/DB reads. */
export const OFERTAS_LOCALES_LEGACY_BUSINESS_CATEGORY_MAP: Partial<
  Record<
    OfertaLocalBusinessCategory,
    { category: OfertaLocalBusinessCategory; marketType?: OfertaLocalMarketType }
  >
> = {
  tire_shop: { category: "automotive_services", marketType: "tire_shop" },
  auto_service: { category: "automotive_services", marketType: "general_mechanic" },
  beauty_salon: { category: "beauty_personal_care", marketType: "beauty_salon" },
  tax_service: { category: "professional_services", marketType: "tax_services" },
  retail: { category: "retail_store" },
  event_hall: { category: "events_entertainment", marketType: "event_hall" },
  other_service: { category: "other_business" },
};

export function normalizeOfertaLocalBusinessCategory(
  category: OfertaLocalBusinessCategory | ""
): OfertaLocalBusinessCategory | "" {
  if (!category) return "";
  const mapped = OFERTAS_LOCALES_LEGACY_BUSINESS_CATEGORY_MAP[category];
  return mapped?.category ?? category;
}

export function normalizeOfertaLocalDraftCategoryFields(
  draft: Pick<OfertaLocalDraft, "businessCategory" | "marketType" | "customMarketType">
): Pick<OfertaLocalDraft, "businessCategory" | "marketType" | "customMarketType"> {
  const rawCategory = draft.businessCategory;
  if (!rawCategory) return { businessCategory: "", marketType: draft.marketType, customMarketType: draft.customMarketType };

  const legacy = OFERTAS_LOCALES_LEGACY_BUSINESS_CATEGORY_MAP[rawCategory];
  if (!legacy) {
    return {
      businessCategory: rawCategory,
      marketType: draft.marketType,
      customMarketType: draft.customMarketType,
    };
  }

  const category = legacy.category;
  let marketType = draft.marketType;
  if (legacy.marketType && !marketType) {
    marketType = legacy.marketType;
  }
  const marketTypeRaw = String(draft.marketType ?? "");
  if (rawCategory === "auto_service" && marketTypeRaw === "auto_service") {
    marketType = "general_mechanic";
  }
  if (rawCategory === "tax_service" && marketTypeRaw === "tax_service") {
    marketType = "tax_services";
  }

  let customMarketType = draft.customMarketType;
  if (category === "other_business" && rawCategory === "other_service" && !customMarketType.trim()) {
    customMarketType = draft.customMarketType;
  }

  return { businessCategory: category, marketType, customMarketType };
}

export function getSubtypeConfigForBusinessCategory(
  category: OfertaLocalBusinessCategory | ""
): { labelKey: OfertaLocalSubtypeLabelKey; options: OfertaLocalSubtypeOption[] } | null {
  const normalized = normalizeOfertaLocalBusinessCategory(category);
  if (!normalized || normalized === "other_business") return null;
  return OFERTAS_LOCALES_BUSINESS_SUBCATEGORY_OPTIONS_BY_CATEGORY[normalized] ?? null;
}

export function getSubtypeOptionsForBusinessCategory(
  category: OfertaLocalBusinessCategory | ""
): OfertaLocalSubtypeOption[] {
  const config = getSubtypeConfigForBusinessCategory(category);
  return config?.options ?? [];
}

export function getSubtypeLabelForBusinessCategory(
  category: OfertaLocalBusinessCategory | "",
  lang: "es" | "en"
): string {
  if (category === "other_business") {
    return OFERTAS_LOCALES_SUBTYPE_LABELS.custom_business[lang];
  }
  const config = getSubtypeConfigForBusinessCategory(category);
  if (!config) return "";
  return OFERTAS_LOCALES_SUBTYPE_LABELS[config.labelKey][lang];
}

export function businessCategoryUsesCustomTypeText(category: OfertaLocalBusinessCategory | ""): boolean {
  return normalizeOfertaLocalBusinessCategory(category) === "other_business";
}

export function businessCategoryShowsSubtypeDropdown(category: OfertaLocalBusinessCategory | ""): boolean {
  return Boolean(getSubtypeConfigForBusinessCategory(category));
}

export function isMarketTypeValidForBusinessCategory(
  category: OfertaLocalBusinessCategory | "",
  marketType: OfertaLocalMarketType | ""
): boolean {
  if (!marketType) return true;
  const options = getSubtypeOptionsForBusinessCategory(category);
  return options.some((o) => o.value === marketType);
}

export function labelForPrimaryBusinessCategory(
  category: OfertaLocalBusinessCategory | "",
  lang: "es" | "en" = "es"
): string {
  const normalized = normalizeOfertaLocalBusinessCategory(category);
  if (!normalized) return "";
  const opt = OFERTAS_LOCALES_PRIMARY_BUSINESS_CATEGORY_OPTIONS.find((o) => o.value === normalized);
  if (opt) return lang === "en" ? opt.labelEn : opt.labelEs;
  // Legacy label fallback from old constants path
  const legacyLabels: Partial<Record<OfertaLocalBusinessCategory, { es: string; en: string }>> = {
    tire_shop: { es: "Llantera", en: "Tire shop" },
    auto_service: { es: "Servicio automotriz", en: "Auto service" },
    beauty_salon: { es: "Salón de belleza", en: "Beauty salon" },
    tax_service: { es: "Servicios de impuestos", en: "Tax service" },
    retail: { es: "Retail / tienda", en: "Retail" },
    event_hall: { es: "Salón de eventos", en: "Event hall" },
    other_service: { es: "Otro servicio", en: "Other service" },
  };
  if (category) {
    const legacy = legacyLabels[category];
    if (legacy) return lang === "en" ? legacy.en : legacy.es;
  }
  return normalized;
}

export function labelForBusinessSubtype(
  category: OfertaLocalBusinessCategory | "",
  marketType: OfertaLocalMarketType | "",
  lang: "es" | "en" = "es"
): string {
  if (!marketType) return "";
  const options = getSubtypeOptionsForBusinessCategory(category);
  const opt = options.find((o) => o.value === marketType);
  if (opt) return lang === "en" ? opt.labelEn : opt.labelEs;
  return marketType;
}

export function buildBusinessCategoryChangePatch(
  draft: Pick<OfertaLocalDraft, "businessCategory" | "marketType" | "customMarketType">,
  nextCategory: OfertaLocalBusinessCategory | ""
): Pick<OfertaLocalDraft, "businessCategory" | "marketType" | "customMarketType"> {
  if (!nextCategory) {
    return { businessCategory: "", marketType: "", customMarketType: "" };
  }
  const compatible = isMarketTypeValidForBusinessCategory(nextCategory, draft.marketType);
  const isOtherBusiness = nextCategory === "other_business";
  return {
    businessCategory: nextCategory,
    marketType: compatible && !isOtherBusiness ? draft.marketType : "",
    customMarketType: isOtherBusiness
      ? draft.customMarketType
      : compatible && draft.marketType === "other"
        ? draft.customMarketType
        : "",
  };
}

/** Flat list of all subtype option values for display fallback. */
export function getAllBusinessSubtypeOptionValues(): OfertaLocalMarketType[] {
  const values = new Set<OfertaLocalMarketType>();
  for (const config of Object.values(OFERTAS_LOCALES_BUSINESS_SUBCATEGORY_OPTIONS_BY_CATEGORY)) {
    if (!config) continue;
    for (const opt of config.options) values.add(opt.value);
  }
  return [...values];
}
