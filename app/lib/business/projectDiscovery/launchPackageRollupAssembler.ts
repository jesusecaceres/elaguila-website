/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — assembles the real inputs
 * buildLaunchPackageRollup() needs from canonical sources (the EXISTING intents/blueprint
 * repositories — never a second status/dependency system). Server-only, mirrors
 * releaseReadinessAssembler.ts's own assembler/pure-engine split exactly.
 */
import "server-only";

import { listProjectDiscoveryIntents } from "./repository";
import { getLatestBlueprintForIntent } from "./blueprintRepository";
import { buildLaunchPackageRollup, type LaunchPackageChildState, type LaunchPackageChildSummary, type LaunchPackageRollup } from "./launchPackageRollup";

function stateFor(blueprint: { status: string; handoffStatus: string | null; releasedAt: string | null; handoffCompletedAt: string | null } | null): LaunchPackageChildState {
  if (!blueprint) return "no_intent_yet";
  if (blueprint.handoffCompletedAt) return "handoff_complete";
  if (blueprint.releasedAt) return "released";
  if (blueprint.status === "approved_for_build") return "approved_for_build";
  if (blueprint.status === "draft" || blueprint.status === "internal_review" || blueprint.status === "client_confirmation_needed" || blueprint.status === "superseded") return "blueprint_in_review";
  return "discovery_in_progress";
}

/**
 * Real sibling state, gathered live every call — never cached/frozen into a Blueprint packet (MD
 * Gate 10.2 <phase_10>: "no duplicate mega-Blueprint pretending to replace component Blueprints").
 */
export async function assembleLaunchPackageRollup(businessId: string, discoveryId: string, launchPackageIntentId: string): Promise<LaunchPackageRollup> {
  const intents = await listProjectDiscoveryIntents(discoveryId, businessId);
  const siblingIntents = intents.filter((i) => i.id !== launchPackageIntentId && i.projectType !== "launch_package_multi_project");

  const children: LaunchPackageChildSummary[] = await Promise.all(
    siblingIntents.map(async (intent) => {
      const blueprint = await getLatestBlueprintForIntent(businessId, intent.id);
      const state = stateFor(blueprint);
      const blocked = state === "no_intent_yet" || state === "discovery_in_progress";
      return {
        intentId: intent.id,
        projectType: intent.projectType,
        title: intent.title,
        state,
        blockingReasonEs: blocked ? "Descubrimiento/plan de este componente aún no está listo." : null,
        blockingReasonEn: blocked ? "This component's discovery/blueprint is not ready yet." : null,
      };
    }),
  );

  return buildLaunchPackageRollup(children);
}
