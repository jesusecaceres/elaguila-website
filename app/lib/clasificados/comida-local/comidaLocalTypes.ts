/**
 * Comida Local — draft types only (no DB / publish integration in FOOD-L2).
 */

export type ComidaLocalContactMethod = "phone" | "whatsapp";

export type ComidaLocalFoodType =
  | "tacos"
  | "pupusas"
  | "tamales"
  | "antojitos"
  | "postres"
  | "bebidas"
  | "mariscos"
  | "comida-casera"
  | "comida-eventos"
  | "otro";

export type ComidaLocalServiceOption = "pickup" | "delivery" | "in_person";

export type ComidaLocalPaymentMethod =
  | "cash"
  | "zelle"
  | "cash_app"
  | "venmo"
  | "card"
  | "other";

export type ComidaLocalPriceLevel = "1" | "2" | "3";

export type ComidaLocalLanguageOption = "es" | "en" | "bilingual";

export type ComidaLocalSocialPlatform = "instagram" | "facebook" | "tiktok";

/** Placeholder image slot — upload wired in FOOD-L3/FOOD-L4. */
export type ComidaLocalImageDraft = {
  /** Local preview URL or empty until upload exists. */
  previewUrl: string;
  /** Future storage key; empty in scaffold. */
  storageKey: string;
};

export type ComidaLocalSectionKey =
  | "identidad"
  | "zona"
  | "que-vendes"
  | "contacto"
  | "ubicacion"
  | "extras"
  | "fotos";

export type ComidaLocalValidationIssue = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type ComidaLocalDraft = {
  businessName: string;
  foodType: ComidaLocalFoodType | "";
  foodTypeCustom: string;
  /** Canonical NorCal city slug/key — wired in FOOD-L3/FOOD-L6. */
  cityCanonical: string;
  /** Display city line while canonical autocomplete is deferred. */
  cityDisplay: string;
  zoneNote: string;
  primaryContactChoice: ComidaLocalContactMethod | "";
  phone: string;
  whatsapp: string;
  queVendes: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  locationNote: string;
  locationUrl: string;
  availabilityNote: string;
  serviceOptions: ComidaLocalServiceOption[];
  paymentMethods: ComidaLocalPaymentMethod[];
  paymentOtherNote: string;
  priceLevel: ComidaLocalPriceLevel | "";
  languages: ComidaLocalLanguageOption[];
  mainPhoto: ComidaLocalImageDraft | null;
  logoImage: ComidaLocalImageDraft | null;
  galleryImages: ComidaLocalImageDraft[];
};
