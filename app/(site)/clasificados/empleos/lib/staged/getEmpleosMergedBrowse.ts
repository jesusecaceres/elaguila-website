import type { EmpleosJobRecord } from "../../data/empleosJobTypes";
import { EMPLEOS_JOB_CATALOG } from "../../data/empleosSampleCatalog";

import { readAllEmpleosCanonical } from "./empleosStagedStorage";

/** Published staged listings only (draft/paused/etc. excluded from public merge). */
export function readStagedPublishedJobRecords(): EmpleosJobRecord[] {
  if (typeof window === "undefined") return [];
  return readAllEmpleosCanonical()
    .filter((r) => r.status === "published")
    .map((r) => r.jobRecord);
}

/** Sample catalog + staged published jobs (no slug collisions with seed). */
export function getEmpleosMergedPublishedJobs(): EmpleosJobRecord[] {
  const seed = [...EMPLEOS_JOB_CATALOG];
  const seedSlugs = new Set(seed.map((j) => j.slug));
  const staged = readStagedPublishedJobRecords().filter((j) => !seedSlugs.has(j.slug));
  return [...seed, ...staged];
}
