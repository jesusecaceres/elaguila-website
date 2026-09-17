/**
 * Client Discovery & Project Blueprint Engine, Gate 3.1 <part_8_status_integrity> — server-side
 * readiness guard for the one transition that must never be reachable on hope alone: entering
 * READY_FOR_BLUEPRINT. Gate 1's own bounded transition graph (constants.ts) only checks that the
 * JUMP is structurally legal (e.g. in_progress -> ready_for_blueprint); it has no opinion on
 * whether the underlying Gate 2 readiness computation actually says READY. This file closes that
 * gap WITHOUT touching Gate 1's transition graph or Gate 2's evaluation/priority logic — it only
 * calls their existing, already-tested outputs and refuses the transition when they disagree.
 *
 * Scope: only WEBSITE-type intents have a Gate 2 adaptive engine at all (Gate 3's own disclosed,
 * truthful limitation). A discovery with no website intent has nothing to verify here and is
 * allowed through — there is no engine yet to block on for other project types.
 */
import "server-only";

import { listProjectDiscoveryIntents } from "./repository";
import { buildWebsiteDiscoveryContext } from "./websiteDiscoveryContext";
import { classifyReadinessForBlueprintGuard, evaluateWebsiteReadiness } from "./websiteDiscoveryLogic";

export type DiscoveryReadyForBlueprintDenialReason = "client_blockers_remain" | "leonix_decision_remains" | "context_unavailable";
export type DiscoveryReadyForBlueprintResult = { ok: true } | { ok: false; reason: DiscoveryReadyForBlueprintDenialReason; intentId: string };

export async function assessDiscoveryReadyForBlueprint(businessId: string, discoveryId: string): Promise<DiscoveryReadyForBlueprintResult> {
  const intents = await listProjectDiscoveryIntents(discoveryId, businessId);
  const websiteIntents = intents.filter((i) => i.projectType === "website" && i.status !== "declined");

  for (const intent of websiteIntents) {
    const ctx = await buildWebsiteDiscoveryContext(businessId, discoveryId, intent.id);
    if (!ctx) return { ok: false, reason: "context_unavailable", intentId: intent.id };

    const readiness = evaluateWebsiteReadiness(ctx);
    const verdict = classifyReadinessForBlueprintGuard(readiness.state);
    if (verdict !== "ok") return { ok: false, reason: verdict, intentId: intent.id };
  }

  return { ok: true };
}
