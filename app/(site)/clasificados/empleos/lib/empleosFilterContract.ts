/**
 * Empleos public browse — explicit filter contract (URL ↔ `EmpleosJobRecord`).
 * Sample catalog today; swap `EMPLEOS_JOB_CATALOG` for API projections without renaming keys.
 *
 * ## URL query keys (stable)
 * - q → keyword across title, company, summary, description
 * - city → substring match on `city` + `state` (and optional ZIP in same blob for legacy text)
 * - state → exact match on `state` (US 2-letter)
 * - zip → 5-digit match on `postalCode` when present on listing
 * - category, jobType, modality, experience, companyType → exact slug match on record fields
 * - salaryMin / salaryMax → numeric band overlap with job salary range
 * - featured=1 → only boosted inventory (`listingTier` !== standard)
 * - recent=1 → published within 7 days (`publishedAt`)
 * - quickApply=1 → `quickApply === true`
 * - verified=1 → `verifiedEmployer === true`
 * - premium=1 → `premiumEmployer === true`
 * - sort → relevance | date_desc | salary_desc
 * - radiusKm → **staged**: parsed but not applied until lat/lng + backend/geo index exist (no fake proximity)
 *
 * ## Policy hooks (see `empleosVisibilityRules.ts`)
 * - Landing “featured strip”: editorial/paid subset via `showOnLandingFeatured`
 * - “Recent” strip: `showOnLandingRecent` + chronological
 * - Results boosted block: non-standard tiers after filters
 * - Relevance sort: tier weight then recency (does not hide unpaid listings arbitrarily)
 */

export const EMPLEOS_URL_PARAM_KEYS = [
  "q",
  "city",
  "state",
  "zip",
  "category",
  "jobType",
  "modality",
  "salaryMin",
  "salaryMax",
  "experience",
  "companyType",
  "featured",
  "recent",
  "quickApply",
  "verified",
  "premium",
  "sort",
  "radiusKm",
] as const;

export type EmpleosUrlParamKey = (typeof EMPLEOS_URL_PARAM_KEYS)[number];
