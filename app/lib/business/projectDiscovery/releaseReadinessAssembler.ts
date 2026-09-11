/**
 * Client Discovery & Project Blueprint Engine, Gate 7/8 — assembles the real inputs
 * evaluateProjectReleaseReadiness() needs from canonical sources, then calls it. Server-only. This
 * is the ONE place that gathers execution-status truth from Creative Studio / Growth Engine /
 * Website's own handoff fields (MD <execution_status_truth>: never fabricate progress).
 *
 * Gate 8 closes two Gate 7 simplifications (MD <staleness_decision>, <client_confirmation_precision>):
 *   - isStale/staleExplicitlyAcknowledged are now real: the caller passes the LIVE-recomputed
 *     input fingerprint (the same computeBlueprintInputFingerprint/computeSpecializedBlueprintInputFingerprint
 *     call page.tsx already makes for on-screen staleness display), and the acknowledgement is only
 *     honored while it was recorded against that exact fingerprint.
 *   - requiresClientConfirmation now reads the blueprint's own persisted client_confirmation_required
 *     column instead of a hardcoded literal, and clientConfirmationComplete now requires affirmative
 *     evidence (a whole-blueprint 'approved' feedback row with client_approved=true), never merely
 *     the absence of open change-request/needs-clarification feedback.
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
import { buildWebsiteDiscoveryContext } from "./websiteDiscoveryContext";
import { buildSpecializedDiscoveryContext } from "./specializedDiscoveryContext";
import { computeBlueprintInputFingerprint } from "./blueprintEngine";
import { computeSpecializedBlueprintInputFingerprint } from "./specializedBlueprintEngine";
import type { WebsiteArchitectureDecisionPacket } from "./architectureDecisionEngine";

interface ReleaseSourcePacket {
  projectType: string;
  architecture?: WebsiteArchitectureDecisionPacket;
}

/**
 * Gate 8 — the ONE place that recomputes the LIVE input fingerprint for a blueprint's current
 * project type, mirroring exactly what page.tsx already computes for on-screen staleness display
 * (computeBlueprintInputFingerprint for Website, computeSpecializedBlueprintInputFingerprint for
 * Logo/Print/Campaign). Returns null when staleness cannot be determined (e.g. Website has no
 * approved architecture decision yet) — callers then treat the blueprint as not-stale, matching
 * page.tsx's own fallback.
 */
export async function computeCurrentBlueprintFingerprint(
  businessId: string,
  blueprint: BusinessProjectBlueprint<ReleaseSourcePacket>,
  items: readonly { fieldKey: string; projectIntentId: string | null; truthClass: string; value: unknown }[],
): Promise<string | null> {
  const family = specializedFamilyForProjectType(blueprint.packet.projectType as never);
  if (!family) {
    const ctx = await buildWebsiteDiscoveryContext(businessId, blueprint.discoveryId, blueprint.projectIntentId);
    if (!ctx) return null;
    const approvedItem = items.find((i) => i.fieldKey === "website_architecture_decision" && i.truthClass === "technical_decision" && i.projectIntentId === blueprint.projectIntentId);
    const approvedArchitecture = approvedItem ? (approvedItem.value as unknown as WebsiteArchitectureDecisionPacket) : null;
    if (!approvedArchitecture) return null;
    return computeBlueprintInputFingerprint(ctx, approvedArchitecture);
  }
  const ctx = await buildSpecializedDiscoveryContext(businessId, blueprint.discoveryId, blueprint.projectIntentId);
  if (!ctx) return null;
  return computeSpecializedBlueprintInputFingerprint(ctx);
}

export async function assembleReleaseReadiness(businessId: string, blueprint: BusinessProjectBlueprint<ReleaseSourcePacket>): Promise<ReleaseReadinessResult> {
  const [intents, dependencies, qaItemsRaw, launchItemsRaw, feedback, allItems] = await Promise.all([
    listProjectDiscoveryIntents(blueprint.discoveryId, businessId),
    listIntentDependenciesForDiscovery(businessId, blueprint.discoveryId),
    listCheckItemsForBlueprint(businessId, blueprint.id, "qa"),
    listCheckItemsForBlueprint(businessId, blueprint.id, "launch"),
    listFeedbackForBlueprint(businessId, blueprint.id),
    listProjectDiscoveryItems(blueprint.discoveryId, businessId),
  ]);

  const currentFingerprint = await computeCurrentBlueprintFingerprint(businessId, blueprint, allItems);

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

  // Gate 8 <client_confirmation_precision> — affirmative evidence required, not merely the absence
  // of open change-request/needs-clarification feedback. A whole-blueprint approval is a feedback
  // row with no fieldKey (fieldKey null means "about the blueprint as a whole", not one field).
  const requiresClientConfirmation = blueprint.clientConfirmationRequired;
  const clientConfirmationComplete = requiresClientConfirmation
    ? feedback.some((f) => f.feedbackType === "approved" && f.clientApproved === true && f.fieldKey === null)
    : true;

  // Gate 8 <staleness_decision> — real staleness + acknowledgement, scoped to the exact fingerprint.
  const isStale = currentFingerprint !== null && currentFingerprint !== blueprint.inputFingerprint;
  const staleExplicitlyAcknowledged =
    blueprint.staleAcknowledgedAt !== null &&
    blueprint.staleAcknowledgedFingerprint !== null &&
    blueprint.staleAcknowledgedFingerprint === currentFingerprint;

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
    const reviewItem = allItems.find((i) => i.fieldKey === "custom_platform_commercial_review" && i.projectIntentId === blueprint.projectIntentId);
    commercialReviewResolved = Boolean(reviewItem && reviewItem.value !== "pending_review");
  }

  return evaluateProjectReleaseReadiness({
    blueprintStatus: blueprint.status,
    isStale,
    staleExplicitlyAcknowledged,
    requiresClientConfirmation,
    clientConfirmationComplete,
    blockingDependencies,
    executionExists,
    qaSummary,
    launchSummary,
    requiresCommercialReview,
    commercialReviewResolved,
  });
}
