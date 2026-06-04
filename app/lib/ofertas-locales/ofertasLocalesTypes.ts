/**
 * Ofertas Locales — draft types only (Gate 1 foundation; no DB / routes / analytics wiring).
 */

export type OfertaLocalOfferType =
  | "weekly_flyer"
  | "coupon"
  | "promotion"
  | "seasonal_special"
  | "bundle"
  | "featured_deal";

export type OfertaLocalBusinessCategory =
  | "supermarket"
  | "carniceria"
  | "panaderia"
  | "produce_market"
  | "restaurant"
  | "tire_shop"
  | "auto_service"
  | "beauty_salon"
  | "tax_service"
  | "retail"
  | "event_hall"
  | "other_service";

export type OfertaLocalMarketType =
  | "mexican"
  | "latino"
  | "asian"
  | "indian"
  | "middle_eastern"
  | "american"
  | "international"
  | "specialty"
  | "general"
  | "other";

export type OfertaLocalLanguageTag = "es" | "en" | "bilingual";

/** Placeholder asset slot — upload wired in a future gate. */
export type OfertaLocalAssetDraft = {
  /** Local preview URL or empty until upload exists. */
  previewUrl: string;
  /** Future storage key; empty in scaffold. */
  storageKey: string;
  /** Optional MIME hint for flyer PDF/image/coupon assets. */
  mimeType: string;
};

export type OfertaLocalValidationIssue = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type OfertaLocalDraft = {
  offerType: OfertaLocalOfferType | "";
  businessCategory: OfertaLocalBusinessCategory | "";
  marketType: OfertaLocalMarketType | "";
  businessName: string;
  title: string;
  description: string;
  couponText: string;
  flyerTitle: string;
  validFrom: string;
  validUntil: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  serviceZipCodes: string[];
  phone: string;
  whatsapp: string;
  websiteUrl: string;
  directionsUrl: string;
  flyerAssets: OfertaLocalAssetDraft[];
  couponAssets: OfertaLocalAssetDraft[];
  isFeaturedRequested: boolean;
  languageTags: OfertaLocalLanguageTag[];
  internalNotes?: string;
};

/** Future item-level searchable specials (Version 2). */
export type OfertaLocalSearchableItemReviewStatus =
  | "pending"
  | "needs_review"
  | "approved"
  | "rejected";

export type OfertaLocalSearchableItemDraft = {
  itemName: string;
  normalizedItemName: string;
  category: string;
  subcategory: string;
  priceText: string;
  priceAmount: number | null;
  unit: string;
  dealType: string;
  quantity: string;
  searchTags: string[];
  sourceAssetId: string;
  sourcePage: number | null;
  confidence: number | null;
  reviewStatus: OfertaLocalSearchableItemReviewStatus;
};

/** Google Document AI scan job lifecycle (Version 2). */
export type OfertaLocalScanJobStatus =
  | "idle"
  | "pending"
  | "processing"
  | "needs_review"
  | "approved"
  | "failed"
  | "cancelled";

export type OfertaLocalScanJobDraft = {
  status: OfertaLocalScanJobStatus;
  sourceAssetId: string;
  startedAt: string;
  completedAt: string;
  errorMessage: string;
};
