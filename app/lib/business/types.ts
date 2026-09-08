/**
 * Canonical Business Identity domain types (Leonix Business Concierge, Package BCO-2).
 * Mirrors supabase/migrations/20260715120000_business_identity_foundation_bco1.sql exactly.
 * No `any`, no unsafe casts — every row-mapping function in repositories/ must satisfy these.
 */

export type PrimaryLanguage = "es" | "en";
export type BusinessStatus = "active" | "archived" | "suspended";
export type OnboardingStatus = "not_started" | "in_progress" | "complete";
export type CreationSource = "onboarding_wizard" | "staff_assisted" | "system_backfill";

/** Gate BCO-3R: 16-item controlled taxonomy, enforced by a DB CHECK (businesses_broad_business_type_chk). */
export type BroadBusinessType =
  | "retail_ecommerce" | "professional_services" | "food_hospitality" | "health_beauty_wellness"
  | "construction_trades" | "technology_digital_services" | "education_training_coaching"
  | "real_estate_property_services" | "automotive_transportation" | "manufacturing_local_production"
  | "arts_entertainment_events" | "home_personal_services" | "nonprofit_faith_community"
  | "agriculture_food_production" | "finance_insurance" | "other";

/** Gate BCO-3R: enforced by a DB CHECK (businesses_business_stage_chk). Replaces the earlier unconstrained set. */
export type BusinessStage = "planning_prelaunch" | "newly_opened" | "operating" | "growing" | "established_mature" | "paused_restructuring";

export type OperatingModel = "fixed_location" | "mobile" | "online_remote" | "regional" | "hybrid" | "multiple_locations";
export type SalesRelationship = "b2c" | "b2b" | "b2g" | "direct_to_consumer" | "wholesale" | "marketplace" | "subscription" | "nonprofit_community" | "other";
export type SalesChannel = "physical_location" | "website" | "social_media" | "phone" | "whatsapp" | "marketplace_platform" | "mobile_on_site" | "events" | "referrals" | "other";
export type AuthorizationRole = "owner" | "authorized_representative";

export type Business = {
  id: string;
  displayName: string;
  legalName: string | null;
  publicName: string | null;
  normalizedName: string;
  slug: string;
  broadBusinessType: BroadBusinessType;
  specificBusinessType: string | null;
  customSpecificType: string | null;
  businessStage: BusinessStage;
  /** ES/EN app-interface language for this record — distinct from businessPrimaryLanguage. */
  primaryLanguage: PrimaryLanguage;
  /** The business's own real-world operating language (global, unconstrained). */
  businessPrimaryLanguage: string | null;
  businessAdditionalLanguages: readonly string[];
  yearStarted: number | null;
  operatingModels: readonly OperatingModel[];
  salesRelationships: readonly SalesRelationship[];
  salesChannels: readonly SalesChannel[];
  /** Gate BCO-3R-B.2 — single business-wide preferred response method, server-validated against entered contacts at finalize time. */
  preferredResponseMethod: PreferredResponseMethod | null;
  status: BusinessStatus;
  onboardingStatus: OnboardingStatus;
  creationSource: CreationSource;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type MembershipRole = "owner" | "member";
export type MembershipStatus = "invited" | "active" | "revoked";

export type BusinessMembership = {
  id: string;
  businessId: string;
  userId: string;
  membershipRole: MembershipRole;
  membershipStatus: MembershipStatus;
  isPrimaryOwner: boolean;
  invitedByUserId: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Gate BCO-3R ownership-authorization metadata, set at creation time on the founding row. */
  authorizationRole: AuthorizationRole;
  representativeRelationship: string | null;
  representativeContactEmail: string | null;
  representativeNote: string | null;
  manualReviewFlag: boolean;
};

export type ContactType = "phone" | "email" | "website";
export type ChannelKind = "whatsapp" | "call" | "email";
/** Gate BCO-3R-B.2 — "support" renamed to "customer_service" (migrated safely), "quotes" added. */
export type ContactLabel = "main" | "sales" | "customer_service" | "booking" | "quotes" | "billing" | "other";
export type ContactVisibility = "public" | "private";
/** Gate BCO-3R-B.2 — only meaningful for contactType === "phone". */
export type ContactCapability = "calls" | "sms" | "whatsapp";
/** Gate BCO-3R-B.2 — single business-wide preferred response method (businesses.preferred_response_method). */
export type PreferredResponseMethod = "whatsapp" | "phone_call" | "sms" | "email";

export type BusinessContact = {
  id: string;
  businessId: string;
  contactType: ContactType;
  value: string;
  normalizedValue: string;
  preferredChannel: boolean;
  channelKind: ChannelKind | null;
  isPrimary: boolean;
  label: ContactLabel;
  visibility: ContactVisibility;
  /** Gate BCO-3R-B.2 — which response channels this phone number supports; always [] for non-phone contacts. */
  capabilities: readonly ContactCapability[];
  createdAt: string;
  updatedAt: string;
};

export type DigitalProfilePlatform =
  | "google_business"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "yelp"
  | "whatsapp_business"
  | "snapchat"
  | "pinterest"
  | "other";

export type BusinessDigitalProfile = {
  id: string;
  businessId: string;
  platform: DigitalProfilePlatform;
  handleOrUrl: string;
  createdAt: string;
  updatedAt: string;
};

/** Gate BCO-3R-B.2 — repeatable, labeled business links (business_custom_links). */
export type CustomLinkType = "booking" | "menu_catalog" | "order_online" | "portfolio" | "request_quote" | "reviews" | "other";

export type BusinessCustomLink = {
  id: string;
  businessId: string;
  linkType: CustomLinkType;
  /** Required (non-empty) when linkType === "other"; null otherwise. */
  customLabel: string | null;
  displayUrl: string;
  normalizedUrl: string;
  visibility: ContactVisibility;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AreaKind = "physical_address" | "service_area_text";

// ---------------------------------------------------------------------------
// Service coverage (Gate BCO-3R-B.3). A strict, versioned, nested shape embedded in
// StructuredLocationDetailsV1.coverage — replaces the old scattered coverageType/nationwide/
// international fields above (kept as-is, untouched, for backward compatibility with any v2
// record written before this gate) with one unified "how far does your business serve" model.
// ---------------------------------------------------------------------------

export type CoverageLevel = "local" | "multi_city" | "one_state" | "multi_state" | "nationwide" | "multi_country" | "worldwide";

export type DeliveryModel = "fully_remote" | "digital_delivery" | "shipping" | "consultation" | "other";

/**
 * Records a region-shortcut interaction for audit/summary purposes only. `wholeRegion: true` is
 * set only when the owner explicitly confirmed "select all countries in this region" — the
 * region code is never itself treated as the stored coverage; `countryCodes` is always the real,
 * resolved ISO list at the moment of selection, per the gate's "do not store a region name as a
 * substitute for actual selected countries" rule.
 */
export type CoverageRegionSelection = {
  regionCode: string;
  wholeRegion: boolean;
  countryCodes: readonly string[];
};

export type ServiceCoverageV1 = {
  schemaVersion: 1;
  level: CoverageLevel | "";
  // Local — radius around a base location (baseCity/baseStateProvince/basePostalCode below reuse
  // the pre-existing top-level fields so the owner never re-types the same city twice).
  radiusValue?: number;
  radiusUnit?: "miles" | "kilometers";
  nearbyNeighborhoods?: readonly string[];
  localNote?: string;
  // Multi-city
  citiesServed?: readonly string[];
  citiesStateProvince?: string;
  // One state / multiple states — country served comes from the shared serviceArea.country field.
  stateProvince?: string;
  statesProvincesServed?: readonly string[];
  excludedStatesProvinces?: readonly string[];
  excludedCitiesOrAreas?: readonly string[];
  multiStateSelectAllConfirmed?: boolean;
  // Nationwide
  nationwideConfirmed?: boolean;
  // Multiple countries
  countriesServedCodes?: readonly string[];
  excludedCountries?: readonly string[];
  regionSelections?: readonly CoverageRegionSelection[];
  // Worldwide — languagesServed reuses the pre-existing top-level field.
  worldwideConfirmed?: boolean;
  primaryTimeZone?: string;
  additionalTimeZones?: readonly string[];
  deliveryModels?: readonly DeliveryModel[];
  deliveryModelOtherNote?: string;
};

/** Versioned JSONB shape stored in business_service_areas.structured_details (Gate BCO-3R). */
export type StructuredLocationDetailsV1 = {
  schemaVersion: 1;
  streetNumber?: string;
  streetName?: string;
  unit?: string;
  neighborhood?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  addressVisibility?: "public_exact" | "city_only" | "private";
  interactionMode?: "business_travels" | "customer_visits" | "both";
  coverageType?: "local_city" | "custom_radius" | "selected_cities" | "selected_regions" | "nationwide" | "international";
  serviceRadius?: number;
  radiusUnit?: "miles" | "kilometers";
  citiesServed?: readonly string[];
  regionsServed?: readonly string[];
  postalCodesServed?: readonly string[];
  countriesServed?: readonly string[];
  timezone?: string;
  languagesServed?: readonly string[];
  nationwide?: boolean;
  international?: boolean;
  hasMultipleLocations?: boolean;
  customCoverageDescription?: string;
  baseCity?: string;
  baseStateProvince?: string;
  basePostalCode?: string;
  /** Gate BCO-3R-B — free-text territory name when `country === "OTHER"` (no stable ISO code). */
  customCountryName?: string;
  /** Gate BCO-3R-B — optional approximate count for the "multiple locations" operating model. */
  approximateLocationCount?: number;
  /** Gate BCO-3R-B.3 — strict versioned service-coverage shape. See ServiceCoverageV1 above. */
  coverage?: ServiceCoverageV1;
};

export type BusinessServiceArea = {
  id: string;
  businessId: string;
  country: string | null;
  structuredDetails: StructuredLocationDetailsV1;
  areaKind: AreaKind;
  rawText: string;
  normalizedText: string;
  cityHint: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListingRelationshipRole = "primary" | "secondary";
export type ListingLinkStatus = "pending" | "verified" | "rejected" | "removed";

export type BusinessListingLink = {
  id: string;
  businessId: string;
  listingSource: string;
  listingId: string;
  relationshipRole: ListingRelationshipRole;
  linkedBy: string;
  linkedAt: string;
  verifiedAt: string | null;
  status: ListingLinkStatus;
};

/** Versioned draft payload — schemaVersion allows the wizard (Package 3) to evolve the shape safely. */
export type BusinessOnboardingDraftPayloadV1 = {
  schemaVersion: 1;
  basics?: {
    displayName?: string;
    broadBusinessType?: string;
    businessStage?: string;
    primaryLanguage?: PrimaryLanguage;
  };
  contact?: {
    contactType?: ContactType;
    value?: string;
    preferredChannel?: boolean;
    channelKind?: ChannelKind | null;
  };
  serviceArea?: {
    areaKind?: AreaKind;
    rawText?: string;
  };
  listingCandidate?: {
    listingSource?: string;
    listingId?: string;
  } | null;
  ownershipConfirmation?: {
    confirmed?: boolean;
    settingUpForSomeoneElse?: boolean;
  };
  eligibilitySnapshot?: EligibilityResult | null;
  updatedByStep?: number;
};

/**
 * Gate BCO-3R — minimal generic shape for v2 draft rows at the repository/API layer. The
 * wizard itself reads the same jsonb row through its own richer WizardDraftPayloadV2
 * (onboarding/wizardTypes.ts) — mirrors how V1's richer WizardDraftPayload always related to
 * this minimal BusinessOnboardingDraftPayloadV1: this layer only needs enough shape for
 * generic display (e.g. DraftList.tsx), not the full wizard-local field set.
 */
export type BusinessOnboardingDraftPayloadV2 = {
  schemaVersion: 2;
  setupLanguage?: PrimaryLanguage;
  basics?: { displayName?: string; legalName?: string; publicName?: string };
  updatedByStep?: number;
};

export type BusinessOnboardingDraftPayload = BusinessOnboardingDraftPayloadV1 | BusinessOnboardingDraftPayloadV2;

export type BusinessOnboardingDraft = {
  id: string;
  userId: string;
  intentKey: string;
  businessId: string | null;
  currentStep: number;
  draftPayload: BusinessOnboardingDraftPayload;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type BusinessIdentityFlagRow = {
  flagKey: string;
  enabled: boolean;
  pilotUserIds: readonly string[];
  emergencyDisabled: boolean;
  notes: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

/** Resolved, user-facing feature-access tier — never the raw flag row. */
export type FeatureAccessState =
  | "unavailable"
  | "preview"
  | "ineligible"
  | "ambiguous"
  | "eligible"
  | "existing_business"
  | "resume_draft"
  | "multiple_drafts";

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export type EligibilitySource =
  | "leonix_placement_entitlements"
  | "listings_seller_type"
  | "autos_lane"
  | "restaurantes_package_tier"
  | "servicios"
  | "unsupported_source"
  | "non_production_test_override"
  | "none";

export type EligibilityReasonCode =
  | "placement_entitlement_active_website_business"
  | "seller_type_business"
  | "autos_lane_negocios"
  | "placement_entitlement_expired"
  | "placement_entitlement_ownership_unverified"
  | "restaurantes_package_tier_unconfirmed_value_set"
  | "servicios_no_verified_signal"
  | "non_production_test_override"
  | "unsupported_listing_source"
  | "no_evidence_found"
  | "contradictory_evidence";

export type EligibilityEvidence = {
  source: EligibilitySource;
  listingSource: string | null;
  listingId: string | null;
  entitlementId: string | null;
  reasonCode: EligibilityReasonCode;
};

export type EligibilityStatus = "eligible" | "ineligible" | "ambiguous";

/** Discriminated union — status is the tag; every branch is fully self-describing. */
export type EligibilityResult = {
  status: EligibilityStatus;
  evidence: readonly EligibilityEvidence[];
  contradictions: readonly EligibilityEvidence[];
  requiresManualReview: boolean;
  humanExplanation: string;
  evaluatedAt: string;
};

// ---------------------------------------------------------------------------
// Access resolution (Phase 8)
// ---------------------------------------------------------------------------

export type AccessResolution =
  | { state: "signed_out" }
  | { state: "feature_unavailable" }
  | { state: "preview_only"; eligibility: EligibilityResult | null }
  | { state: "ineligible"; eligibility: EligibilityResult }
  | { state: "ambiguous"; eligibility: EligibilityResult }
  | { state: "eligible_start"; eligibility: EligibilityResult }
  | { state: "resume_single_draft"; draft: BusinessOnboardingDraft; eligibility: EligibilityResult }
  | { state: "choose_draft"; drafts: readonly BusinessOnboardingDraft[]; eligibility: EligibilityResult }
  | { state: "existing_business"; business: Business; membership: BusinessMembership }
  | { state: "error"; reasonCode: string };

// ---------------------------------------------------------------------------
// Duplicate detection (Phase 10)
// ---------------------------------------------------------------------------

export type DuplicateLevel = "exact" | "probable" | "possible" | "none";

export type DuplicateCandidateSummary = {
  /** Privacy-safe only — never a full row, never contact details, never legal_name. */
  businessId: string;
  displayNameMasked: string;
  matchedSignals: readonly ("normalizedName" | "normalizedPhone" | "normalizedEmail" | "normalizedDomain" | "normalizedServiceArea" | "verifiedListingLink")[];
  accessibleToCurrentUser: boolean;
};

export type DuplicateWarningResult = {
  level: DuplicateLevel;
  candidates: readonly DuplicateCandidateSummary[];
};

// ---------------------------------------------------------------------------
// Structured field errors (Phase 4)
// ---------------------------------------------------------------------------

export type FieldErrorCode =
  | "required"
  | "invalid_display_name"
  | "invalid_business_type"
  | "invalid_business_stage"
  | "invalid_language"
  | "invalid_contact_combination"
  | "invalid_area_kind"
  | "missing_contact"
  | "missing_service_area"
  | "ownership_not_confirmed"
  | "feature_access_denied"
  | "listing_ownership_unverified"
  | "unsupported_listing_source"
  | "invalid_country"
  | "invalid_operating_model"
  | "invalid_authorization_role"
  | "invalid_digital_profile"
  | "invalid_contact_capability"
  | "invalid_preferred_response_method"
  | "invalid_custom_link"
  | "invalid_service_coverage";

export type FieldError = {
  field: string;
  code: FieldErrorCode;
  /** Bounded default message — Package 3 UI may override per-locale; this is never the sole copy source. */
  defaultMessage: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: readonly FieldError[] };
