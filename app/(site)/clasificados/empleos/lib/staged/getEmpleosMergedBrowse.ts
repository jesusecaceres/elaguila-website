import type { EmpleosJobRecord } from "../../data/empleosJobTypes";
import { EMPLEOS_JOB_CATALOG } from "../../data/empleosSampleCatalog";

/** @deprecated Browser-local demo layer — live listings load from Supabase via server props. */
export function readStagedPublishedJobRecords(): EmpleosJobRecord[] {
  return [];
}

/** Merge curated seed catalog with live DB-backed jobs (live wins on slug collision by excluding seed slug overlap from live side). */
export function mergeEmpleosSeedWithLiveJobs(live: EmpleosJobRecord[]): EmpleosJobRecord[] {
  const seed = [...EMPLEOS_JOB_CATALOG];
  const seedSlugs = new Set(seed.map((j) => j.slug));
  const liveFiltered = live.filter((j) => !seedSlugs.has(j.slug));
  return [...seed, ...liveFiltered];
}

/** @deprecated Use server `fetchEmpleosPublishedJobRecords` + `mergeEmpleosSeedWithLiveJobs`. */
export function getEmpleosMergedPublishedJobs(): EmpleosJobRecord[] {
  return [...EMPLEOS_JOB_CATALOG];
}
