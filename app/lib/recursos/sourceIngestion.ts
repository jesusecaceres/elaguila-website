/**
 * Build 03A — PDF-derived candidate resource inventory contract.
 *
 * A CandidateResourceRecord is discovery-stage data extracted from a source document
 * (e.g. a county-published resource guide PDF). It is NEVER production-verified data.
 * verificationStatus is always "needs_review" and verifiedAt is always null — the
 * conversion helper below refuses anything else. Fields with no equivalent column in
 * `community_resources` (source provenance, search aliases, priority, staleness flags)
 * stay candidate-only and are never written to the DB.
 */
import type {
  AudienceTag,
  CostModel,
  OrganizationType,
  PrimaryCategorySlug,
  ResourceHoursRow,
  SecondaryTag,
  UrgencyLevel,
} from "./types";

export type CandidateAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export type CandidateResourceRecord = {
  candidateId: string;

  // SOURCE IDENTITY
  sourceDocument: "scc-community-resource-guide-2023";
  sourceYear: 2023;
  sourcePages: number[];
  sourceSections: string[];
  sourceRawCategory?: string | null;
  sourceNotes?: string | null;

  // RESOURCE IDENTITY
  organizationName: string;
  programName?: string | null;
  suggestedSlug: string;
  organizationType?: OrganizationType | null;
  aliases?: string[];

  // CONTENT
  sourceDescriptionEn?: string | null;
  suggestedDescriptionEn?: string | null;
  suggestedDescriptionEs: null;
  services: string[];

  // CLASSIFICATION
  suggestedPrimaryCategory: PrimaryCategorySlug;
  suggestedSecondaryTags?: SecondaryTag[];
  suggestedUrgencyLevel: UrgencyLevel;

  // AUDIENCE
  ageMin?: number | null;
  ageMax?: number | null;
  audienceTags?: AudienceTag[];

  // SEARCH (candidate/search-prep only — no DB column)
  needTagsEn?: string[];
  needTagsEs?: string[];
  serviceTags?: string[];
  searchAliases?: string[];

  // CONTACT FROM 2023 SOURCE (unverified)
  phone?: string | null;
  crisisPhone?: string | null;
  sms?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  applicationUrl?: string | null;
  address?: CandidateAddress | null;
  mapsSearchHref?: string | null;
  hoursNoteEn?: string | null;
  weeklyHours?: ResourceHoursRow[] | null;
  is24Hours?: boolean;

  // PROGRAM ATTRIBUTES
  languages?: string[];
  costModel?: CostModel | null;
  eligibilityEn?: string | null;
  serviceArea?: string | null;

  // VERIFICATION (candidate-stage; never auto-verified)
  verificationStatus: "needs_review";
  verifiedAt: null;
  officialSourceUrl?: string | null;
  verificationNotes?: string | null;
  verificationPriority: 1 | 2 | 3;
  likelyStale?: boolean;
  sourceDefect?: boolean;
};

const PRIORITY_1_TAGS = new Set([
  "crisis",
  "suicide",
  "domestic-violence",
  "trafficking",
  "child-abuse",
  "adult-abuse",
  "emergency-shelter",
  "behavioral-health-crisis",
]);

/** Deterministic Gate 9 priority — no per-record judgment calls. */
export function assignVerificationPriority(
  candidate: Pick<CandidateResourceRecord, "suggestedUrgencyLevel" | "suggestedPrimaryCategory" | "needTagsEn" | "serviceTags">,
): 1 | 2 | 3 {
  const tags = new Set([...(candidate.needTagsEn ?? []), ...(candidate.serviceTags ?? [])]);
  const hasPriority1Tag = [...tags].some((t) => PRIORITY_1_TAGS.has(t));
  if (candidate.suggestedUrgencyLevel === "help-now" || candidate.suggestedPrimaryCategory === "urgent-safety" || hasPriority1Tag) {
    return 1;
  }
  const priority2Categories: PrimaryCategorySlug[] = ["food-basic-needs", "housing-rent", "legal-immigration", "babies-kids-parents"];
  if (priority2Categories.includes(candidate.suggestedPrimaryCategory)) return 2;
  if (candidate.suggestedPrimaryCategory === "youth-education" && tags.has("childcare")) return 2;
  if (candidate.suggestedPrimaryCategory === "youth-education" && tags.has("youth")) return 2;
  return 3;
}

export function buildCandidateId(organizationName: string, programName?: string | null): string {
  const raw = programName ? `${organizationName} ${programName}` : organizationName;
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Lossy-safe mapper toward the DB-compatible shape used by
 * `CommunityResourceInput` (app/lib/recursos/server/communityResourcesDb.ts).
 * Refuses anything but a locked "needs_review"/null verification pair —
 * this is the structural enforcement of "never auto-verify a candidate."
 */
export function candidateToResourceDraft(candidate: CandidateResourceRecord) {
  if (candidate.verificationStatus !== "needs_review" || candidate.verifiedAt !== null) {
    throw new Error(
      `candidateToResourceDraft: refusing candidate "${candidate.candidateId}" — verificationStatus must be "needs_review" and verifiedAt must be null, never anything else at this stage.`,
    );
  }

  return {
    organizationName: candidate.organizationName,
    programName: candidate.programName ?? null,
    organizationType: candidate.organizationType ?? "other",
    shortDescriptionEs: "",
    shortDescriptionEn: candidate.suggestedDescriptionEn ?? "",
    detailsEs: null,
    detailsEn: null,
    primaryCategory: candidate.suggestedPrimaryCategory,
    secondaryCategories: candidate.suggestedSecondaryTags ?? [],
    urgencyLevel: candidate.suggestedUrgencyLevel,
    ageMin: candidate.ageMin ?? null,
    ageMax: candidate.ageMax ?? null,
    audienceTags: candidate.audienceTags ?? [],
    serviceTags: candidate.serviceTags ?? [],
    languages: candidate.languages ?? [],
    costModel: candidate.costModel ?? "unknown",
    eligibilityEs: null,
    eligibilityEn: candidate.eligibilityEn ?? null,
    serviceArea: candidate.serviceArea ?? null,
    contact: {
      phone: candidate.phone ?? null,
      crisisPhone: candidate.crisisPhone ?? null,
      sms: candidate.sms ?? null,
      whatsapp: candidate.whatsapp ?? null,
      email: candidate.email ?? null,
      websiteUrl: candidate.websiteUrl ?? null,
      applicationUrl: candidate.applicationUrl ?? null,
      address: candidate.address ?? null,
      mapsSearchHref: candidate.mapsSearchHref ?? null,
      hoursNoteEs: null,
      hoursNoteEn: candidate.hoursNoteEn ?? null,
      weeklyHours: candidate.weeklyHours ?? null,
      is24Hours: candidate.is24Hours ?? false,
    },
    verification: {
      officialSourceUrl: candidate.officialSourceUrl ?? null,
      lastVerifiedAt: null,
      nextVerificationAt: null,
      verificationStatus: "needs_review" as const,
      active: false,
    },
    internal: {
      partnerStatus: "none" as const,
      featured: false,
      printEligible: false,
      internalNotes: candidate.verificationNotes ?? null,
    },
  };
}
