/**
 * Canonical Business Identity domain types (Leonix Business Concierge, Package BCO-2).
 * Mirrors supabase/migrations/20260715120000_business_identity_foundation_bco1.sql exactly.
 * No `any`, no unsafe casts — every row-mapping function in repositories/ must satisfy these.
 */

export type PrimaryLanguage = "es" | "en";
export type BusinessStatus = "active" | "archived" | "suspended";
export type OnboardingStatus = "not_started" | "in_progress" | "complete";
export type CreationSource = "onboarding_wizard" | "staff_assisted" | "system_backfill";

export type Business = {
  id: string;
  displayName: string;
  legalName: string | null;
  publicName: string | null;
  normalizedName: string;
  slug: string;
  broadBusinessType: string;
  businessStage: string;
  primaryLanguage: PrimaryLanguage;
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
};

export type ContactType = "phone" | "email" | "website";
export type ChannelKind = "whatsapp" | "call" | "email";

export type BusinessContact = {
  id: string;
  businessId: string;
  contactType: ContactType;
  value: string;
  normalizedValue: string;
  preferredChannel: boolean;
  channelKind: ChannelKind | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AreaKind = "physical_address" | "service_area_text";

export type BusinessServiceArea = {
  id: string;
  businessId: string;
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

export type BusinessOnboardingDraftPayload = BusinessOnboardingDraftPayloadV1;

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
  | "none";

export type EligibilityReasonCode =
  | "placement_entitlement_active_website_business"
  | "seller_type_business"
  | "autos_lane_negocios"
  | "placement_entitlement_expired"
  | "placement_entitlement_ownership_unverified"
  | "restaurantes_package_tier_unconfirmed_value_set"
  | "servicios_no_verified_signal"
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
  | "unsupported_listing_source";

export type FieldError = {
  field: string;
  code: FieldErrorCode;
  /** Bounded default message — Package 3 UI may override per-locale; this is never the sole copy source. */
  defaultMessage: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: readonly FieldError[] };
