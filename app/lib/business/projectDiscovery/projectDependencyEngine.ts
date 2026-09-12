/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — minimal deterministic dependency model (MD
 * <dependency_engine>). Pure functions only.
 *
 * Two kinds of dependency:
 *  - EXPLICIT: staff deliberately marks "Logo must finish before Website" via a real UI action.
 *  - SYSTEM_SUGGESTED: this file's own suggestSystemDependencies() proposes a dependency for a
 *    KNOWN synergy pair (Logo -> anything that needs an approved brand direction) — a suggestion is
 *    NEVER auto-persisted; staff must explicitly accept it, at which point it becomes a real,
 *    durable row identical in effect to an explicit one (MD: "should not create incorrect hard
 *    blockers casually... do not infer every Logo + Website pair as blocking" — this only ever
 *    proposes, it never writes on its own).
 *
 * A dependent intent is BLOCKED only while the intent it depends on has not yet reached
 * approved_for_build on its own latest blueprint — completing one project's blueprint DRAFT does
 * NOT falsely complete another's dependency (MD: "completing one does not falsely complete
 * another").
 */
import type { ProjectDiscoveryIntent, ProjectType } from "./types";

export type DependencyType = "explicit" | "system_suggested";

export interface ProjectIntentDependency {
  id: string;
  businessId: string;
  discoveryId: string;
  dependentIntentId: string;
  dependsOnIntentId: string;
  dependencyType: DependencyType;
  reasonEs: string;
  reasonEn: string;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
}

export interface CreateIntentDependencyInput {
  businessId: string;
  discoveryId: string;
  dependentIntentId: string;
  dependsOnIntentId: string;
  dependencyType: DependencyType;
  reasonEs: string;
  reasonEn: string;
}

// ---------------------------------------------------------------------------------------------
// System-suggested dependencies — a small, explicit, known-synergy allowlist. Anything not on this
// list is NEVER suggested (MD: "Only add persistence if necessary... do not infer every pair").
// ---------------------------------------------------------------------------------------------
const NEEDS_APPROVED_BRAND: readonly ProjectType[] = [
  "business_cards", "flyer", "banner_signage", "referral_materials", "website", "website_improvement", "landing_page",
];

export interface SuggestedDependency {
  dependentIntentId: string;
  dependentTitle: string;
  dependsOnIntentId: string;
  dependsOnTitle: string;
  dependencyType: "system_suggested";
  reasonEs: string;
  reasonEn: string;
}

/**
 * Proposes (never persists) a dependency for every Logo/Brand Identity intent paired with every
 * OTHER intent in the same discovery whose deliverable genuinely needs an approved brand direction
 * first. Excludes pairs that already have ANY existing dependency row (explicit or previously
 * accepted suggestion) between the same two intents, so accepting/rejecting a suggestion once is
 * durable — it is never re-suggested every time the discovery is viewed.
 */
export function suggestSystemDependencies(
  intents: readonly ProjectDiscoveryIntent[],
  existingDependencies: readonly Pick<ProjectIntentDependency, "dependentIntentId" | "dependsOnIntentId">[] = [],
): SuggestedDependency[] {
  const logoIntents = intents.filter((i) => i.projectType === "logo_brand_identity");
  if (logoIntents.length === 0) return [];

  const hasExisting = (dependentIntentId: string, dependsOnIntentId: string) =>
    existingDependencies.some((d) => d.dependentIntentId === dependentIntentId && d.dependsOnIntentId === dependsOnIntentId);

  const suggestions: SuggestedDependency[] = [];
  for (const logo of logoIntents) {
    for (const other of intents) {
      if (other.id === logo.id) continue;
      if (!NEEDS_APPROVED_BRAND.includes(other.projectType)) continue;
      if (hasExisting(other.id, logo.id)) continue;
      suggestions.push({
        dependentIntentId: other.id,
        dependentTitle: other.title,
        dependsOnIntentId: logo.id,
        dependsOnTitle: logo.title,
        dependencyType: "system_suggested",
        reasonEs: "El logo/marca aprobado generalmente se necesita antes de finalizar el diseño de este proyecto.",
        reasonEn: "The approved logo/brand is typically needed before finalizing this project's design.",
      });
    }
  }
  return suggestions;
}

// ---------------------------------------------------------------------------------------------
// Blocking evaluation — a dependent intent is blocked only while the intent it depends on has not
// reached approved_for_build.
// ---------------------------------------------------------------------------------------------
export interface BlockingDependency {
  dependsOnIntentId: string;
  dependsOnTitle: string;
  reasonEs: string;
  reasonEn: string;
}

export function computeBlockingDependencies(
  intentId: string,
  dependencies: readonly ProjectIntentDependency[],
  intents: readonly ProjectDiscoveryIntent[],
  latestBlueprintStatusByIntentId: ReadonlyMap<string, string | null>,
): BlockingDependency[] {
  const titleFor = (id: string) => intents.find((i) => i.id === id)?.title ?? id;
  return dependencies
    .filter((d) => d.dependentIntentId === intentId)
    .filter((d) => latestBlueprintStatusByIntentId.get(d.dependsOnIntentId) !== "approved_for_build")
    .map((d) => ({ dependsOnIntentId: d.dependsOnIntentId, dependsOnTitle: titleFor(d.dependsOnIntentId), reasonEs: d.reasonEs, reasonEn: d.reasonEn }));
}
