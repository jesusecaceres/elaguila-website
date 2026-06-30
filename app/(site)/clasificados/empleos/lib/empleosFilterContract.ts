/**
 * Empleos public browse — explicit filter contract (URL ↔ `EmpleosJobRecord`).
 * Inventory is `EmpleosJobRecord[]`: merged marketing seed + Supabase rows in dev; **live-only** paths omit seed
 * (see `empleosPublicCatalogPolicy.ts` + `mergeEmpleosSeedWithLiveJobs`). URL keys stay stable.
 *
 * ## URL query keys (stable)
 * - q → keyword across title, company, summary, description
 * - city → substring match on city/state/region/postal/country/address/venue text
 * - state → substring match on open state/province/region and country text
 * - zip → international postal-code match on `postalCode` when present on listing
 * - category, jobType, modality, experience, companyType → exact slug match on record fields
 * - salaryMin / salaryMax → numeric band overlap with job salary range
 * - featured=1 → only promoted/featured inventory (`listingTier` !== standard)
 * - recent=1 → published within 7 days (`publishedAt`)
 * - quickApply=1 → `quickApply === true`
 * - verified=1 → `verifiedEmployer === true`
 * - premium=1 → `premiumEmployer === true`
 * - sort → relevance | date_desc | salary_desc
 * - lane → quick | premium | feria (matches `publicationLane` on live rows; seed rows omit lane and are excluded when set)
 * - industry → substring match on `industryFocus`
 * - bilingual=1 → only rows with `bilingual === true` (Feria / explicit flags)
 * - radiusKm → removed from public URL contract until geo index exists (no fake proximity filter)
 *
 * ## Policy hooks (see `empleosVisibilityRules.ts`)
 * - Landing “featured strip”: editorial/paid subset via `showOnLandingFeatured`
 * - “Recent” strip: `showOnLandingRecent` + chronological
 * - Results featured strip + main list: see `empleosPublicRankingPolicy.ts` (strip capped; overflow stays in main list)
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
  "lane",
  "industry",
  "bilingual",
  "sort",
] as const;

export type EmpleosUrlParamKey = (typeof EMPLEOS_URL_PARAM_KEYS)[number];
