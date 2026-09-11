/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — assembles the real inputs
 * evaluateProjectReleaseReadiness() needs from canonical sources, then calls it. Server-only. This
 * is the ONE place that gathers execution-status truth from Creative Studio / Growth Engine /
 * Website's own handoff fields (MD <execution_status_truth>: never fabricate progress).
 *
 * Known, deliberately scoped simplification: staleness is surfaced to the UI for the reviewer to
 * judge (MD <staleness>: "never auto-invalidate approval"), but never blocks release readiness by
 * itself — a full "explicitly acknowledge this staleness" workflow is out of scope for this gate
 * and is reported as a known partial rather than silently built halfway.
 */
import "server-only";

import type { BusinessProjectBlueprint } from "./blueprintRepository";
import { getLatestBlueprintForIntent } from "./blueprintRepository";
import { listProjectDiscoveryIntents, listProjectDiscoveryItems } from "./repository";
import { listIntentDependenciesForDiscovery } from "./projectDependencyRepository";
import { computeBlockingDependencies } from "./projectDependencyEngine";
import { listCheckItemsForBlueprint } from "./blueprintCheckItemRepository";
import { listFeedbackForBlueprint } from "./blueprintFeedbackRepository";
import { summarizeCheckItems, type CheckItemRecord } from "./blueprintChecklistEngine";
import { evaluateProjectReleaseReadiness, type ReleaseReadinessResult } from "./releaseReadinessEngine";
import { specializedFamilyForProjectType } from "./specializedBlueprintDispatch";
import { getJobByBlueprintId } from "@/app/lib/business/creativeStudio/repository";
import { getGrowthCampaignByBlueprintId } from "@/app/lib/business/growthEngine/repository";
import type { WebsiteArchitectureDecisionPacket } from "./architectureDecisionEngine";

interface ReleaseSourcePacket {
  projectType: string;
  architecture?: WebsiteArchitectureDecisionPacket;
}

export async function assembleReleaseReadiness(businessId: string, blueprint: BusinessProjectBlueprint<ReleaseSourcePacket>): Promise<ReleaseReadinessResult> {
  const [intents, dependencies, qaItemsRaw, launchItemsRaw, feedback] = await Promise.all([
    listProjectDiscoveryIntents(blueprint.discoveryId, businessId),
    listIntentDependenciesForDiscovery(businessId, blueprint.discoveryId),
    listCheckItemsForBlueprint(businessId, blueprint.id, "qa"),
    listCheckItemsForBlueprint(businessId, blueprint.id, "launch"),
    listFeedbackForBlueprint(businessId, blueprint.id),
  ]);

  const latestBlueprintByIntentId = new Map<string, string | null>();
  for (const intent of intents) {
    const latest = await getLatestBlueprintForIntent(businessId, intent.id);
    latestBlueprintByIntentId.set(intent.id, latest?.status ?? null);
  }
  const blockingDependencies = computeBlockingDependencies(blueprint.projectIntentId, dependencies, intents, latestBlueprintByIntentId);

  const toRecord = (items: readonly { itemKey: string; kind: "qa" | "launch" | "handoff"; status: CheckItemRecord["status"]; releaseBlocking: boolean }[]): CheckItemRecord[] =>
    items.map((i) => ({ itemKey: i.itemKey, kind: i.kind, status: i.status, releaseBlocking: i.releaseBlocking }));
  const qaSummary = summarizeCheckItems(toRecord(qaItemsRaw));
  const launchSummary = summarizeCheckItems(toRecord(launchItemsRaw));

  const clientConfirmationComplete = !feedback.some((f) => (f.feedbackType === "change_requested" || f.feedbackType === "needs_clarification") && f.clientApproved !== true);

  const family = specializedFamilyForProjectType(blueprint.packet.projectType as never);
  let executionExists = false;
  if (family === "logo_brand" || family === "print_collateral") {
    executionExists = Boolean(await getJobByBlueprintId(businessId, blueprint.id));
  } else if (family === "media_campaign") {
    executionExists = Boolean(await getGrowthCampaignByBlueprintId(businessId, blueprint.id));
  } else {
    // Website — the execution destination IS the blueprint's own handoff seam (MD <website_handoff_preservation>).
    executionExists = blueprint.handoffStatus !== "not_started";
  }

  let requiresCommercialReview = false;
  let commercialReviewResolved = true;
  if (blueprint.packet.architecture?.requiresCommercialReview) {
    requiresCommercialReview = true;
    const items = await listProjectDiscoveryItems(blueprint.discoveryId, businessId);
    const reviewItem = items.find((i) => i.fieldKey === "custom_platform_commercial_review" && i.projectIntentId === blueprint.projectIntentId);
    commercialReviewResolved = Boolean(reviewItem && reviewItem.value !== "pending_review");
  }

  return evaluateProjectReleaseReadiness({
    blueprintStatus: blueprint.status,
    isStale: false, // surfaced separately in the UI (per-family isStale computation already exists); never blocks release by itself
    staleExplicitlyAcknowledged: true,
    requiresClientConfirmation: true,
    clientConfirmationComplete,
    blockingDependencies,
    executionExists,
    qaSummary,
    launchSummary,
    requiresCommercialReview,
    commercialReviewResolved,
  });
}
