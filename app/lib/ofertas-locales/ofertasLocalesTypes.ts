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

/** Featured placement scope intent — not active until Leonix team follow-up (Stack 8). */
export type OfertaLocalFeaturedPlacementScope =
  | "zip"
  | "city"
  | "category"
  | "homepage_or_section"
  | "newsletter"
  | "not_sure"
  | "none";

/** Magazine pickup / distribution partner lifecycle. */
export type OfertaLocalMagazineDistributionStatus =
  | "not_offered"
  | "invited"
  | "active"
  | "paused"
  | "declined";

/** Partner type — earned through Leonix magazine pickup/display participation. */
export type OfertaLocalPartnerType = "magazine_pickup_partner";

/** Reason a pickup-partner rate applies instead of regular pricing. */
export type OfertaLocalPartnerDiscountReason = "pickup_partner_discount";

/** Monthly pricing package with regular and pickup-partner rates (USD). */
export type OfertaLocalPricingPackage = {
  label: string;
  regularPriceMonthly: number;
  pickupPartnerPriceMonthly: number;
  interval: "month";
  isAddOn?: boolean;
};

/** Draft asset kinds — metadata only until real upload/storage exists. */
export type OfertaLocalDraftAssetType =
  | "flyer_pdf"
  | "flyer_image"
  | "coupon_pdf"
  | "coupon_image"
  | "external_url";

export type OfertaLocalDraftAssetStatus = "draft" | "ready" | "needs_upload" | "removed";

export type OfertaLocalDraftAsset = {
  id: string;
  assetType: OfertaLocalDraftAssetType;
  title: string;
  note: string;
  url: string;
  fileName: string;
  mimeType: string;
  /** Vercel Blob pathname after upload (Stack 6). */
  storagePath: string;
  sizeBytes: number | null;
  pageNumber: number | null;
  sortOrder: number;
  status: OfertaLocalDraftAssetStatus;
};

/** Result from POST /api/ofertas-locales/assets/upload */
export type OfertaLocalUploadedAssetResult = {
  ok: boolean;
  storagePath?: string;
  publicUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  assetType?: OfertaLocalDraftAssetType;
  errors?: string[];
  error?: string;
  detail?: string;
};

export type OfertaLocalPublishStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived"
  | "expired";

/** Asset metadata stored in ofertas_locales.flyer_assets / coupon_assets jsonb. */
export type OfertaLocalPublishedAssetMetadata = {
  id: string;
  assetType: OfertaLocalDraftAssetType;
  title: string;
  note: string;
  url: string;
  fileName: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number | null;
  pageNumber: number | null;
  sortOrder: number;
};

/** Row payload for service-role insert into ofertas_locales. */
export type OfertaLocalDbInsertPayload = {
  owner_id: string;
  status: OfertaLocalPublishStatus;
  offer_type: string;
  business_category: string;
  market_type: string | null;
  business_name: string;
  title: string;
  description: string | null;
  coupon_text: string | null;
  flyer_title: string | null;
  valid_from: string;
  valid_until: string;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string;
  service_zip_codes: string[];
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  directions_url: string | null;
  membership_url: string | null;
  membership_cta_label: string | null;
  membership_note: string | null;
  requires_membership_for_deals: boolean;
  digital_coupon_url: string | null;
  digital_coupon_note: string | null;
  is_magazine_pickup_partner: boolean;
  magazine_distribution_status: string;
  magazine_monthly_drop_estimate: string | null;
  magazine_pickup_notes: string | null;
  flyer_assets: OfertaLocalPublishedAssetMetadata[];
  coupon_assets: OfertaLocalPublishedAssetMetadata[];
  is_featured_requested: boolean;
  language_tags: string[];
  internal_notes: string | null;
  submitted_at: string;
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
  /** When marketType is other — used for display/search instead of “Otro”. */
  customMarketType: string;
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
  /** Business Hub Lite — optional social profile links (Stack 8). */
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  googleBusinessUrl: string;
  directionsUrl: string;
  flyerAssets: OfertaLocalDraftAsset[];
  couponAssets: OfertaLocalDraftAsset[];
  isFeaturedRequested: boolean;
  /** Featured / Destacado placement intent — maps to is_featured_requested on publish (Stack 8). */
  wantsFeaturedPlacement: boolean;
  featuredPlacementScope: OfertaLocalFeaturedPlacementScope;
  /** Optional AI Searchable Specials add-on intent (Stack 6.5A — not active yet). */
  wantsAiSearchableSpecials: boolean;
  languageTags: OfertaLocalLanguageTag[];
  /** Optional rewards / membership program link and CTA copy. */
  membershipUrl: string;
  membershipCtaLabel: string;
  membershipNote: string;
  requiresMembershipForDeals: boolean;
  /** Optional store digital coupon activation link and note. */
  digitalCouponUrl: string;
  digitalCouponNote: string;
  /** Magazine pickup / distribution partner tracking. */
  isMagazinePickupPartner: boolean;
  magazinePickupNotes: string;
  magazineDistributionStatus: OfertaLocalMagazineDistributionStatus;
  magazineMonthlyDropEstimate: string;
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
