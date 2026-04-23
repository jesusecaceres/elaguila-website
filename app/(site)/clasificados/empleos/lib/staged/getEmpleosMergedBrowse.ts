import type { EmpleosJobRecord } from "../../data/empleosJobTypes";
import { EMPLEOS_JOB_CATALOG } from "../../data/empleosSampleCatalog";

export type EmpleosCatalogMergeOptions = {
  /** When true, only `live` rows are returned (no `EMPLEOS_JOB_CATALOG` merge). */
  omitSeed?: boolean;
};

/** When `EMPLEOS_PUBLIC_LIVE_ONLY=1`, callers may rely on env-only omit without server policy import. */
export function empleosPublicLiveCatalogOnly(): boolean {
  return process.env.EMPLEOS_PUBLIC_LIVE_ONLY === "1";
}

/** @deprecated Browser-local demo layer — live listings load from Supabase via server props. */
export function readStagedPublishedJobRecords(): EmpleosJobRecord[] {
  return [];
}

/** Merge curated seed catalog with live DB-backed jobs (live wins on slug collision by excluding seed slug overlap from live side). */
export function mergeEmpleosSeedWithLiveJobs(live: EmpleosJobRecord[], opts?: EmpleosCatalogMergeOptions): EmpleosJobRecord[] {
  if (opts?.omitSeed === true || empleosPublicLiveCatalogOnly()) {
    return [...live];
  }
  const seed = [...EMPLEOS_JOB_CATALOG];
  const seedSlugs = new Set(seed.map((j) => j.slug));
  const liveFiltered = live.filter((j) => !seedSlugs.has(j.slug));
  return [...liveFiltered, ...seed];
}

/** @deprecated Use server `fetchEmpleosPublishedJobRecords` + `mergeEmpleosSeedWithLiveJobs`. */
export function getEmpleosMergedPublishedJobs(): EmpleosJobRecord[] {
  return [...EMPLEOS_JOB_CATALOG];
}
