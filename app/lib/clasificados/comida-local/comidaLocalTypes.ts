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

export type ComidaLocalImageRole = "main" | "logo" | "gallery";

/** Uploaded image metadata only — no base64, blob, or File handles. */
export type ComidaLocalUploadedImage = {
  id: string;
  role: ComidaLocalImageRole;
  url: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  altText?: string;
  uploadedAt: string;
};

/** Draft/publish image slot (uploaded metadata; legacy previewUrl tolerated on load). */
export type ComidaLocalImageDraft = ComidaLocalUploadedImage & {
  /** @deprecated FOOD-L2 placeholder — stripped on load; use `url`. */
  previewUrl?: string;
  /** @deprecated FOOD-L2 placeholder — use `storagePath`. */
  storageKey?: string;
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
  /** Stable id for draft media uploads and publish upsert. */
  draftListingId: string;
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
