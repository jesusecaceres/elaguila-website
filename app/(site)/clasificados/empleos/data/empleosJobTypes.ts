/**
 * Shared Empleos job shapes — adapter-ready for live listings later.
 */

export type JobModalitySlug =
  | "presencial"
  | "hibrido"
  | "remoto"
  | "campo"
  | "varias-ubicaciones"
  | "otro";

export type JobTypeSlug =
  | "tiempo-completo"
  | "medio-tiempo"
  | "temporal"
  | "por-contrato"
  | "por-temporada"
  | "por-horas"
  | "fin-de-semana"
  | "turno-nocturno"
  | "practicas"
  | "voluntariado"
  | "otro";

export type ExperienceSlug =
  | "entry"
  | "mid"
  | "senior"
  | "sin-experiencia"
  | "supervisor"
  | "gerencia"
  | "certificacion"
  | "licencia";

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
  /** State/province/region for global listings; `state` remains the DB/search compatibility value. */
  stateRegion?: string;
  /** International postal code. Optional for adapter rows without geocoding yet. */
  postalCode?: string;
  country?: string;
  category: string;
  /** When category slug is `otro`, human label from the employer. */
  categoryCustomLabel?: string;
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
  employerAddressLine2?: string;
  /** External video links published by the employer. */
  videoUrls?: readonly string[];
  /** Google JobPosting validThrough (ISO). */
  validThroughIso?: string;
  /** Screener prompts for internal apply — answers stored per id in applications.answers_json */
  screenerQuestions?: readonly EmpleosScreenerQuestion[];
  /** Real apply count from DB when merged on server read paths. */
  applicationCount?: number;
};
