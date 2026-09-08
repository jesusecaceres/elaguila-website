/**
 * Package A — Leonix Creative Doctrine versioning.
 *
 * One canonical doctrine version identifier per rule-set snapshot. CreativeJob.doctrineVersion /
 * CreativeProviderRun already carry a doctrineVersion string (see ../types.ts) — this registry is
 * what makes that string resolvable back to the exact rules that produced a historical job, even
 * after the rule set changes in a later version.
 *
 * Do not mutate the meaning of an existing version's rules in place. To change doctrine meaning,
 * add a new version entry and bump CURRENT_DOCTRINE_VERSION — old jobs keep interpreting under the
 * version they were generated with.
 */
import type { DoctrineRule } from "./types";
import { ALL_DOCTRINE_RULES } from "./rules";

export const LEONIX_CREATIVE_DOCTRINE_V1 = "LEONIX_CREATIVE_DOCTRINE_V1" as const;

const DOCTRINE_VERSIONS: Record<string, readonly DoctrineRule[]> = {
  [LEONIX_CREATIVE_DOCTRINE_V1]: ALL_DOCTRINE_RULES,
};

/** The doctrine version new jobs/provider runs should stamp. */
export const CURRENT_DOCTRINE_VERSION: string = LEONIX_CREATIVE_DOCTRINE_V1;

export function getDoctrineRulesForVersion(version: string): readonly DoctrineRule[] | null {
  return DOCTRINE_VERSIONS[version] ?? null;
}

export function isKnownDoctrineVersion(version: string): boolean {
  return version in DOCTRINE_VERSIONS;
}
