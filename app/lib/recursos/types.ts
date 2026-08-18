/**
 * LEONIX RECURSOS — Foundation Build 01 domain contract.
 *
 * This is the typed shape for a single community-help resource record.
 * It is designed to be Supabase-persistable and admin-editable in a later
 * gate, but no persistence or admin UI is implemented here.
 *
 * Public components must only ever consume `PublicResourceRecord`
 * (via `toPublicResource`) so internal/admin-only fields never leak into
 * public markup.
 */

export type RecursosLang = "es" | "en";

/** Semantic urgency identifiers — never hard-code display text against these. */
export type UrgencyLevel = "help-now" | "i-need-help" | "want-to-connect";

/** The 12 permanent primary categories for the Recursos directory. */
export type PrimaryCategorySlug =
  | "urgent-safety"
  | "food-basic-needs"
  | "housing-rent"
  | "mental-health-recovery"
  | "health-clinics"
  | "legal-immigration"
  | "babies-kids-parents"
  | "youth-education"
  | "jobs-training"
  | "seniors-disability"
  | "transportation-access"
  | "community-support";

/**
 * Secondary need/audience tags. This list intentionally covers the youth /
 * children / parent depth called out in the spec so future search/filtering
 * can rely on a stable vocabulary. Not all tags are surfaced as UI filters
 * in this build.
 */
export type SecondaryTag =
  // Pregnancy / early childhood
  | "pregnancy"
  | "infants"
  | "ages-0-5"
  | "preschool"
  | "childcare"
  | "subsidized-childcare"
  | "head-start-early-learning"
  | "developmental-screening"
  // Parents / family
  | "parents"
  | "single-parents"
  | "teen-parents"
  | "family-support"
  // School age / youth
  | "school-age-children"
  | "after-school"
  | "tutoring"
  | "recreation"
  | "teens"
  | "youth-mental-health"
  | "mentoring"
  | "violence-prevention"
  | "youth-employment"
  | "internships"
  | "education"
  | "vocational-training"
  | "foster-youth"
  | "unhoused-youth"
  | "transitional-age-youth"
  // Disability
  | "special-needs"
  | "developmental-disabilities";

/** Free-form audience descriptors beyond the secondary tag vocabulary. */
export type AudienceTag =
  | "families"
  | "youth"
  | "seniors"
  | "disability"
  | "immigrants"
  | "veterans"
  | "general-public";

export type CostModel = "free" | "low_cost" | "eligibility_based" | "unknown";

export type VerificationStatus = "verified" | "needs_review" | "stale" | "inactive";

export type OrganizationType =
  | "nonprofit"
  | "government"
  | "faith-based"
  | "school-district"
  | "healthcare"
  | "community-clinic"
  | "hotline"
  | "other";

/** Partner tier — editorial/business classification, never a paid ranking boost. */
export type PartnerStatus = "none" | "listed" | "partner" | "founding-partner";

export type ResourceHoursRow = {
  dayLabel: string;
  line: string;
};

export type ResourceAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  /** Set true when the org intentionally does not publish a street address (e.g. DV shelters). */
  addressWithheldForSafety?: boolean;
};

/** Contact / quick-action fields. Only populated fields should ever render a CTA. */
export type ResourceContact = {
  phone?: string | null;
  crisisPhone?: string | null;
  sms?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  applicationUrl?: string | null;
  address?: ResourceAddress | null;
  /** Precomputed maps search string or https maps URL, when a public location is safe to show. */
  mapsSearchHref?: string | null;
  hoursNoteEs?: string | null;
  hoursNoteEn?: string | null;
  weeklyHours?: ResourceHoursRow[] | null;
  is24Hours?: boolean;
};

export type ResourceVerification = {
  officialSourceUrl?: string | null;
  /** ISO date string. Never invent a value — leave undefined when unknown. */
  lastVerifiedAt?: string | null;
  nextVerificationAt?: string | null;
  verificationStatus: VerificationStatus;
  active: boolean;
};

/** Internal/editorial metadata — MUST NOT be exposed to public components. */
export type ResourceInternalMeta = {
  partnerStatus: PartnerStatus;
  featured: boolean;
  printEligible: boolean;
  internalNotes?: string | null;
};

export type ResourceRecord = {
  // IDENTITY
  id: string;
  slug: string;
  organizationName: string;
  programName?: string | null;
  organizationType: OrganizationType;

  // CONTENT
  shortDescriptionEs: string;
  shortDescriptionEn: string;
  detailsEs?: string | null;
  detailsEn?: string | null;

  // CLASSIFICATION
  primaryCategory: PrimaryCategorySlug;
  secondaryCategories?: SecondaryTag[];
  urgencyLevel: UrgencyLevel;

  // AUDIENCE
  ageMin?: number | null;
  ageMax?: number | null;
  audienceTags?: AudienceTag[];

  // SERVICE INFO
  serviceTags?: string[];
  languages?: string[];
  costModel: CostModel;
  eligibilityEs?: string | null;
  eligibilityEn?: string | null;
  serviceArea?: string | null;

  // CONTACT / QUICK ACTION
  contact: ResourceContact;

  // VERIFICATION
  verification: ResourceVerification;

  // PARTNERSHIP / EDITORIAL (internal-only)
  internal: ResourceInternalMeta;
};

/**
 * Public-safe projection of `ResourceRecord`. Strips `internal` entirely so
 * public components/pages can never accidentally render admin-only fields.
 * `featured` is republished as a plain boolean since it is safe to use for
 * public sort/highlight decisions without exposing other editorial data.
 */
export type PublicResourceRecord = Omit<ResourceRecord, "internal"> & {
  featured: boolean;
};

export function toPublicResource(resource: ResourceRecord): PublicResourceRecord {
  const { internal, ...rest } = resource;
  return { ...rest, featured: internal.featured };
}
