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
};
