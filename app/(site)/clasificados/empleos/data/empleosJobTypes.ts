/**
 * Shared Empleos job shapes — adapter-ready for live listings later.
 */

export type JobModalitySlug = "presencial" | "hibrido" | "remoto";

export type JobTypeSlug =
  | "tiempo-completo"
  | "medio-tiempo"
  | "temporal"
  | "por-contrato";

export type ExperienceSlug = "entry" | "mid" | "senior";

export type CompanyTypeSlug = "small" | "mid" | "enterprise";

/** Promotional / inventory tier for UX (maps to future paid/featured flags). */
export type EmpleosListingTier = "standard" | "featured" | "promoted";

export type EmpleosLaneSlug = "quick" | "premium" | "feria";

/** Optional screener prompts shown on the internal apply form (max enforced in publish). */
export type EmpleosScreenerQuestion = { id: string; prompt: string };

export type EmpleosJobRecord = {
  id: string;
  slug: string;
  title: string;
  company: string;
  city: string;
  state: string;
  /** US ZIP (5 digits). Optional for adapter rows without geocoding yet. */
  postalCode?: string;
  category: string;
  modality: JobModalitySlug;
  jobType: JobTypeSlug;
  salaryMin: number;
  salaryMax: number;
  salaryLabel: string;
  experience: ExperienceSlug;
  companyType: CompanyTypeSlug;
  quickApply: boolean;
  /** ISO 8601 — used for “recent” ordering. */
  publishedAt: string;
  listingTier: EmpleosListingTier;
  verifiedEmployer: boolean;
  premiumEmployer: boolean;
  companyInitials: string;
  imageSrc: string;
  imageAlt: string;
  summary: string;
  description: string;
  requirements: readonly string[];
  benefits: readonly string[];
  benefitChips: readonly string[];
  /** Landing page featured strip (subset). */
  showOnLandingFeatured: boolean;
  /** Landing page recent strip (subset). */
  showOnLandingRecent: boolean;

  /** Publish lane — set for live DB-backed rows; omitted on curated seed cards. */
  publicationLane?: EmpleosLaneSlug;
  /** Human schedule / shift line from employer (Quick schedule text or Premium schedule label). */
  scheduleLabel?: string;
  /** Industry focus (Feria) or employer-stated industry line. */
  industryFocus?: string;
  /** Event is promoted as bilingual (Feria). */
  bilingual?: boolean;
  /** Comma-separated language tags for discovery (e.g. "es, en"). */
  languagesSpoken?: string;
  /** Feria / event lines when lane is feria. */
  feriaDateLine?: string;
  feriaTimeLine?: string;
  feriaVenue?: string;
  organizerUrl?: string;
  freeEntry?: boolean;
  /** External apply URL when employer chose website CTA. */
  externalApplyUrl?: string;
  /** Primary employer contacts surfaced on detail (not for spam harvest on cards). */
  employerPhone?: string;
  employerWhatsapp?: string;
  employerEmail?: string;
  employerWebsite?: string;
  employerAddressLine?: string;
  /** Google JobPosting validThrough (ISO). */
  validThroughIso?: string;
  /** Screener prompts for internal apply — answers stored per id in applications.answers_json */
  screenerQuestions?: readonly EmpleosScreenerQuestion[];
  /** Real apply count from DB when merged on server read paths. */
  applicationCount?: number;
};
