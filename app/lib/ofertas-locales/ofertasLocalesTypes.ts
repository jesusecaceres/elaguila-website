/**
 * Ofertas Locales — draft types only (Gate 1 foundation; no DB / routes / analytics wiring).
 */

/** Primary publish lane — shopping specials (weekly ads) vs local coupons/promotions. */
export type OfertaLocalPrimaryAdFormat = "shopping_specials" | "local_coupons";

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
  | "prepared_food"
  | "automotive_services"
  | "beauty_personal_care"
  | "professional_services"
  | "home_services"
  | "health_wellness"
  | "retail_store"
  | "events_entertainment"
  | "other_business"
  /** Legacy persisted primary categories — still valid when reading DB/session. */
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
  | "organic"
  | "specialty"
  | "general"
  | "other"
  | "halal"
  | "kosher"
  | "premium_meats"
  | "poultry"
  | "seafood"
  | "mexican_bakery"
  | "latino_bakery"
  | "cake_shop"
  | "pastry_shop"
  | "artisan_bread"
  | "donuts"
  | "fruits_vegetables"
  | "latino_market"
  | "asian_market"
  | "international_market"
  | "italian"
  | "fast_food"
  | "cafe"
  | "desserts"
  | "taqueria"
  | "food_truck"
  | "catering"
  | "meal_prep"
  | "snacks"
  | "tamales"
  | "tire_shop"
  | "oil_change"
  | "general_mechanic"
  | "brakes"
  | "transmission"
  | "auto_detailing"
  | "car_wash"
  | "auto_glass"
  | "towing"
  | "smog_check"
  | "beauty_salon"
  | "barbershop"
  | "nails"
  | "lashes"
  | "brows"
  | "makeup"
  | "spa"
  | "massage"
  | "esthetics"
  | "tax_services"
  | "accounting"
  | "insurance"
  | "legal"
  | "notary"
  | "real_estate"
  | "consulting"
  | "translation"
  | "cleaning"
  | "landscaping"
  | "plumbing"
  | "electrical"
  | "painting"
  | "remodeling"
  | "moving"
  | "repairs"
  | "pest_control"
  | "dental"
  | "chiropractic"
  | "physical_therapy"
  | "fitness"
  | "nutrition"
  | "clinic"
  | "pharmacy"
  | "family_care"
  | "clothing"
  | "shoes"
  | "electronics"
  | "furniture"
  | "jewelry"
  | "mobile_phones"
  | "home_goods"
  | "gifts"
  | "event_hall"
  | "dj"
  | "photography"
  | "video"
  | "decorations"
  | "table_chair_rentals"
  | "live_music"
  | "bounce_houses"
  | "event_catering";

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
  service_zips: string[];
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  directions_url: string | null;
  membership_url: string | null;
  membership_note: string | null;
  digital_coupon_url: string | null;
  digital_coupon_note: string | null;
  is_magazine_pickup_partner: boolean;
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
  /** Primary ad format lane — drives copy, upload sections, and AI wording. */
  primaryAdFormat: OfertaLocalPrimaryAdFormat | "";
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
  country: string;
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
  xTwitterUrl: string;
  linkedinUrl: string;
  snapchatUrl: string;
  pinterestUrl: string;
  googleBusinessUrl: string;
  googleReviewUrl: string;
  yelpUrl: string;
  /** Optional public contact email — stored in publish metadata when no DB column exists. */
  email: string;
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

/** Future item-level searchable specials (Version 2 — extended Stack 10). */
export type OfertaLocalSearchableItemReviewStatus =
  | "pending"
  | "needs_review"
  | "approved"
  | "rejected";

/** AI scan provider — planning only (Stack 10). */
export type OfertaLocalAiScanProvider =
  | "google_document_ai"
  | "gemini_multimodal"
  | "leonix_manual"
  | "future_provider";

/** Post-scan normalizer — planning only (Stack 10). */
export type OfertaLocalAiNormalizerProvider =
  | "leonix_normalizer"
  | "openai"
  | "gemini"
  | "manual";

/** Candidate lane from OCR normalizer (OL-7B). */
export type OfertaLocalCandidateType = "product_deal" | "coupon" | "promo";

export type OfertaLocalSourceBoundingBox = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

export type OfertaLocalSearchableItemDraft = {
  /** Draft or DB id when persisted. */
  id?: string;
  ofertaLocalId?: string;
  ownerId?: string;
  businessName?: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZipCode?: string;
  businessLatitude?: number | null;
  businessLongitude?: number | null;
  itemName: string;
  normalizedItemName: string;
  description?: string;
  category: string;
  subcategory: string;
  priceText: string;
  priceAmount: number | null;
  regularPriceText?: string;
  unit: string;
  dealType: string;
  quantity: string;
  searchTags: string[];
  candidateType?: OfertaLocalCandidateType;
  couponTitle?: string;
  offerText?: string;
  terms?: string;
  validFrom?: string;
  validUntil?: string;
  sourceAssetId: string;
  sourceAssetUrl?: string;
  sourceFileName?: string;
  sourcePage: number | null;
  sourceContext?: string;
  sourceBbox?: OfertaLocalSourceBoundingBox | null;
  sourceCropUrl?: string;
  extractedJson?: Record<string, unknown>;
  confidence: number | null;
  reviewStatus: OfertaLocalSearchableItemReviewStatus;
  reviewerNote?: string;
  isActive?: boolean;
  isSponsored?: boolean;
  sponsorshipWeight?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Shopper-facing item card view model — planning only (Stack 10). */
export type OfertaLocalClickableItemCardView = {
  itemTitle: string;
  priceText: string;
  description: string;
  businessName: string;
  addressLabel: string;
  validDateLabel: string;
  sourceAssetUrl: string;
  sourceCropUrl: string;
  callHref: string;
  directionsHref: string;
  fullFlyerHref: string;
  canAddToShoppingList: boolean;
  isSponsored: boolean;
  sponsorshipLabel: string;
};

/** Google Document AI scan job lifecycle (Version 2 — extended Stack 10). */
export type OfertaLocalScanJobStatus =
  | "idle"
  | "pending"
  | "processing"
  | "needs_review"
  | "reviewed"
  | "approved"
  | "failed"
  | "cancelled";

/** Legacy minimal scan job draft — retained for Gate 1 compatibility. */
export type OfertaLocalScanJobDraft = {
  status: OfertaLocalScanJobStatus;
  sourceAssetId: string;
  startedAt: string;
  completedAt: string;
  errorMessage: string;
};

/** Full scan job record shape for future DB/API (Stack 10). */
export type OfertaLocalScanJobRecordDraft = {
  id: string;
  ofertaLocalId: string;
  ownerId: string;
  sourceAssetId: string;
  sourceAssetType: OfertaLocalDraftAssetType | "";
  sourceAssetUrl?: string;
  provider: OfertaLocalAiScanProvider;
  normalizerProvider: OfertaLocalAiNormalizerProvider;
  status: OfertaLocalScanJobStatus;
  startedAt: string;
  completedAt: string;
  rawResultStoragePath: string;
  normalizedResultStoragePath: string;
  errorMessage: string;
  pagesProcessed: number | null;
  itemsExtractedCount: number | null;
  confidenceAverage: number | null;
};

/** Shopping list item — V1 session/local only (Stack 10 planning). */
export type OfertaLocalShoppingListItemDraft = {
  itemId: string;
  ofertaLocalId: string;
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  itemName: string;
  priceText: string;
  quantity: string;
  sourceAssetUrl: string;
  addedAt: string;
};

export type OfertaLocalShoppingListDraft = {
  id: string;
  sessionId: string;
  items: OfertaLocalShoppingListItemDraft[];
  createdAt: string;
  expiresAt: string;
};

export type OfertaLocalShoppingRouteOriginMode = "current_location" | "entered_address" | "omitted";

export type OfertaLocalShoppingRouteStopDraft = {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  itemCount: number;
};

/** Google Maps route V1 — max 5 stops, URL-based (Stack 10 planning). */
export type OfertaLocalShoppingRouteDraft = {
  id: string;
  shoppingListId: string;
  stops: OfertaLocalShoppingRouteStopDraft[];
  maxStops: 5;
  googleMapsUrl: string;
  originMode: OfertaLocalShoppingRouteOriginMode;
  createdAt: string;
};

/** Input for public eligibility checks — Stack 11. */
export type OfertaLocalItemPublicEligibilityInput = {
  review_status: OfertaLocalSearchableItemReviewStatus;
  is_active: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  parentOfferStatus?: OfertaLocalPublishStatus | "";
};

/** Persisted scan job row — mirrors `oferta_local_scan_jobs` (Stack 11). */
export type OfertaLocalScanJobDbRow = {
  id: string;
  oferta_local_id: string;
  owner_id: string;
  source_asset_id: string | null;
  source_asset_type: string | null;
  source_asset_url: string | null;
  provider: OfertaLocalAiScanProvider;
  normalizer_provider: OfertaLocalAiNormalizerProvider;
  status: OfertaLocalScanJobStatus;
  started_at: string | null;
  completed_at: string | null;
  raw_result_storage_path: string | null;
  normalized_result_storage_path: string | null;
  error_message: string | null;
  pages_processed: number;
  items_extracted_count: number;
  confidence_average: number | null;
  source_storage_path?: string | null;
  source_mime_type?: string | null;
  source_asset_kind?: string | null;
  draft_session_id?: string | null;
  raw_ocr_summary?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type OfertaLocalScanJobDbInsert = Omit<
  OfertaLocalScanJobDbRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

/** Persisted item row — mirrors `oferta_local_items` (Stack 11). */
export type OfertaLocalItemDbRow = {
  id: string;
  oferta_local_id: string;
  scan_job_id: string | null;
  owner_id: string;
  business_name: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip_code: string | null;
  business_latitude: number | null;
  business_longitude: number | null;
  item_name: string;
  normalized_item_name: string | null;
  description: string | null;
  price_text: string | null;
  price_amount: number | null;
  unit: string | null;
  deal_type: string | null;
  quantity: string | null;
  category: string | null;
  subcategory: string | null;
  search_tags: string[];
  valid_from: string | null;
  valid_until: string | null;
  source_asset_id: string | null;
  source_asset_url: string | null;
  source_page: number | null;
  source_crop_url: string | null;
  source_file_name: string | null;
  source_context: string | null;
  source_bbox: Record<string, unknown> | null;
  candidate_type: OfertaLocalCandidateType;
  regular_price_text: string | null;
  coupon_title: string | null;
  offer_text: string | null;
  terms: string | null;
  extracted_json: Record<string, unknown>;
  confidence: number | null;
  review_status: OfertaLocalSearchableItemReviewStatus;
  reviewer_note: string | null;
  is_active: boolean;
  is_sponsored: boolean;
  sponsorship_weight: number;
  created_at: string;
  updated_at: string;
};

export type OfertaLocalItemDbInsert = Omit<
  OfertaLocalItemDbRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

/** POST /api/ofertas-locales/scan request (Stack 12). */
export type OfertaLocalScanApiRequest = {
  ofertaLocalId: string;
  assetId: string;
  assetKind: "flyer" | "coupon";
  assetUrl: string;
  storagePath: string;
  mimeType: string;
};

export type OfertaLocalScanApiResponse = {
  ok: boolean;
  scanJobId?: string;
  status?: OfertaLocalScanJobStatus;
  pagesProcessed?: number;
  itemsExtractedCount?: number;
  message?: string;
  configurationMissing?: boolean;
  error?: string;
  detail?: string;
};

/** Owner review status — Stack B (alias of searchable item review status). */
export type OfertaLocalItemReviewStatus = OfertaLocalSearchableItemReviewStatus;

export type OfertaLocalItemReviewViewModel = {
  id: string;
  ofertaLocalId: string;
  scanJobId: string | null;
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
  description: string;
  regularPriceText: string;
  candidateType: OfertaLocalCandidateType;
  couponTitle: string;
  offerText: string;
  terms: string;
  reviewStatus: OfertaLocalItemReviewStatus;
  confidence: number | null;
  confidenceLabel: "high" | "medium" | "low" | "unknown";
  sourceAssetId: string;
  sourceAssetUrl: string;
  sourceFileName: string;
  sourcePage: number | null;
  sourceContext: string;
  sourceBbox: OfertaLocalSourceBoundingBox | null;
  sourceCropUrl: string;
  businessName: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OfertaLocalItemReviewPatch = {
  itemName?: string;
  normalizedItemName?: string;
  category?: string;
  subcategory?: string;
  priceText?: string;
  priceAmount?: number | null;
  unit?: string;
  dealType?: string;
  quantity?: string;
  description?: string;
  regularPriceText?: string;
  couponTitle?: string;
  offerText?: string;
  terms?: string;
  searchTags?: string[];
  reviewStatus?: OfertaLocalItemReviewStatus;
};

export type OfertaLocalScanJobSummary = {
  id: string;
  status: OfertaLocalScanJobStatus;
  itemsExtractedCount: number;
  pagesProcessed: number;
  completedAt: string | null;
};

export type OfertaLocalItemsListApiResponse = {
  ok: boolean;
  items?: OfertaLocalItemReviewViewModel[];
  scanJobs?: OfertaLocalScanJobSummary[];
  summary?: Record<OfertaLocalItemReviewStatus, number>;
  error?: string;
  detail?: string;
};

export type OfertaLocalClickableItemPreviewCard = {
  id: string;
  itemName: string;
  priceDisplay: string;
  categoryLabel: string;
  reviewStatus: OfertaLocalItemReviewStatus;
  confidenceLabel: "high" | "medium" | "low" | "unknown";
  sourcePage: number | null;
  notPublic: true;
};

export type OfertaLocalClickableItemPreviewContext = {
  sourceAssetLabel: string;
  sourceAssetHref: string | null;
  sourceAssetAvailable: boolean;
  highlightSupportDetected: false;
  boundingBoxNote: string;
};

export type OfertaLocalItemPatchApiResponse = {
  ok: boolean;
  item?: OfertaLocalItemReviewViewModel;
  error?: string;
  detail?: string;
};

/** Public shopper search item — Stack D (no private fields). */
export type OfertaLocalPublicSearchItem = {
  id: string;
  itemName: string;
  normalizedItemName: string;
  priceText: string;
  priceAmount: number | null;
  unit: string;
  category: string;
  subcategory: string;
  searchTags: string[];
  sourcePage: number | null;
  sourceAssetLabel: string;
  sourceAssetHref: string | null;
  validFrom: string | null;
  validUntil: string | null;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneDisplay: string;
  phoneHref: string | null;
  whatsappHref: string | null;
  websiteHref: string | null;
  directionsHref: string | null;
  membershipUrl: string | null;
  membershipNote: string;
  requiresMembership: boolean;
  digitalCouponUrl: string | null;
  digitalCouponNote: string;
  offerType: string;
  marketType: string;
  businessCategory: string;
  socialLinks: {
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    youtubeUrl?: string;
    xTwitterUrl?: string;
    linkedinUrl?: string;
    snapchatUrl?: string;
    pinterestUrl?: string;
    googleBusinessUrl?: string;
    googleReviewUrl?: string;
    yelpUrl?: string;
  };
  boundingBoxNote: string;
  updatedAt: string;
};

export type OfertaLocalPublicSearchSort = "newest" | "price_low" | "expiring_soon";

export type OfertaLocalPublicSearchApiResponse = {
  ok: boolean;
  items?: OfertaLocalPublicSearchItem[];
  total?: number;
  message?: string;
  error?: string;
  detail?: string;
};

/** Public approved offer card — FINAL-1 (no private fields). */
export type OfertaLocalPublicOfferCard = {
  id: string;
  businessName: string;
  title: string;
  offerType: string;
  businessCategory: string;
  marketType: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  address: string;
  validFrom: string;
  validUntil: string;
  phoneHref: string | null;
  websiteHref: string | null;
  directionsHref: string | null;
  primaryAssetHref: string | null;
  primaryAssetLabel: string;
  updatedAt: string;
};

export type OfertaLocalPublicOffersApiResponse = {
  ok: boolean;
  offers?: OfertaLocalPublicOfferCard[];
  total?: number;
  message?: string;
  error?: string;
  detail?: string;
};

/** Public-safe social links on offer detail (FINAL-4). */
export type OfertaLocalPublicOfferSocialLinks = {
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  xTwitterUrl?: string;
  linkedinUrl?: string;
  snapchatUrl?: string;
  pinterestUrl?: string;
  googleBusinessUrl?: string;
  googleReviewUrl?: string;
  yelpUrl?: string;
};

export type OfertaLocalPublicDetailAsset = {
  id: string;
  label: string;
  kind: "flyer" | "coupon";
  href: string | null;
  pending: boolean;
};

/** Full public approved offer detail — no private fields (FINAL-4). */
export type OfertaLocalPublicOfferDetail = OfertaLocalPublicOfferCard & {
  description: string;
  couponText: string;
  flyerTitle: string;
  whatsappHref: string | null;
  flyerAssets: OfertaLocalPublicDetailAsset[];
  couponAssets: OfertaLocalPublicDetailAsset[];
  membershipUrl: string | null;
  membershipCtaLabel: string | null;
  membershipNote: string | null;
  requiresMembershipForDeals: boolean;
  digitalCouponUrl: string | null;
  digitalCouponNote: string | null;
  socialLinks: OfertaLocalPublicOfferSocialLinks;
  wantsAiSearchableSpecials: boolean;
  isExpired: boolean;
};

export type OfertaLocalPublicOfferDetailApiResponse = {
  ok: boolean;
  offer?: OfertaLocalPublicOfferDetail;
  error?: string;
  detail?: string;
};
