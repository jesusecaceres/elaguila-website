/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — assembles everything the Client Review / QA
 * / Launch / Handoff panel needs to render for ONE blueprint version. Server-only. Keeps page.tsx
 * thin, mirroring releaseReadinessAssembler.ts's own role.
 */
import "server-only";

import type { WebsiteProjectBlueprintPacket } from "./blueprintEngine";
import type { SpecializedProjectBlueprintPacket } from "./specializedBlueprintEngine";
import type { BusinessProjectBlueprint } from "./blueprintRepository";
import { listFeedbackForBlueprint, type BlueprintFeedback } from "./blueprintFeedbackRepository";
import { listCheckItemsForBlueprint, type BlueprintCheckItem } from "./blueprintCheckItemRepository";
import { summarizeCheckItems, type ChecklistSummary, type CheckItemRecord } from "./blueprintChecklistEngine";
import { describeBlueprintReviewState, type BlueprintReviewStateInfo } from "./blueprintReviewEngine";
import { buildClientSafeBlueprintProjection, type ClientSafeBlueprintProjection } from "./clientSafeBlueprintProjection";
import { buildProjectTimeline, type TimelineEvent } from "./projectTimelineEngine";
import { assembleReleaseReadiness } from "./releaseReadinessAssembler";
import type { ReleaseReadinessResult } from "./releaseReadinessEngine";

export interface ClientReviewData {
  blueprintId: string;
  version: number;
  blueprintStatus: string;
  handoffStatus: string;
  releasedAt: string | null;
  handoffCompletedAt: string | null;
  reviewState: BlueprintReviewStateInfo;
  clientSafeProjection: ClientSafeBlueprintProjection;
  feedback: readonly BlueprintFeedback[];
  qaItems: readonly BlueprintCheckItem[];
  launchItems: readonly BlueprintCheckItem[];
  handoffItems: readonly BlueprintCheckItem[];
  qaSummary: ChecklistSummary;
  launchSummary: ChecklistSummary;
  releaseReadiness: ReleaseReadinessResult;
  timeline: readonly TimelineEvent[];
  isLatestVersion: boolean;
}

function toRecord(item: BlueprintCheckItem): CheckItemRecord {
  return { itemKey: item.itemKey, kind: item.kind, status: item.status, releaseBlocking: item.releaseBlocking };
}

export async function buildClientReviewData(
  businessId: string,
  blueprint: BusinessProjectBlueprint<WebsiteProjectBlueprintPacket | SpecializedProjectBlueprintPacket>,
  latestVersionNumber: number,
): Promise<ClientReviewData> {
  const [feedback, qaItems, launchItems, handoffItems] = await Promise.all([
    listFeedbackForBlueprint(businessId, blueprint.id),
    listCheckItemsForBlueprint(businessId, blueprint.id, "qa"),
    listCheckItemsForBlueprint(businessId, blueprint.id, "launch"),
    listCheckItemsForBlueprint(businessId, blueprint.id, "handoff"),
  ]);

  const qaSummary = summarizeCheckItems(qaItems.map(toRecord));
  const launchSummary = summarizeCheckItems(launchItems.map(toRecord));
  const releaseReadiness = await assembleReleaseReadiness(businessId, blueprint);

  const unresolvedClientFeedback = feedback.filter((f) => (f.feedbackType === "change_requested" || f.feedbackType === "needs_clarification") && f.clientApproved !== true).length;
  const reviewState = describeBlueprintReviewState(blueprint.status, unresolvedClientFeedback);
  const clientSafeProjection = buildClientSafeBlueprintProjection(blueprint.packet);

  const qaCheckedTimestamps = qaItems.map((i) => i.checkedAt).filter((t): t is string => Boolean(t));
  const qaPassedAt = qaSummary.readyForRelease && qaCheckedTimestamps.length > 0 ? qaCheckedTimestamps.sort().at(-1)! : null;

  const timeline = buildProjectTimeline({
    blueprintVersions: [{ version: blueprint.version, createdAt: blueprint.createdAt, reviewedAt: blueprint.reviewedAt, approvedAt: blueprint.approvedAt, releasedAt: blueprint.releasedAt, handoffCompletedAt: blueprint.handoffCompletedAt }],
    feedback: feedback.map((f) => ({ feedbackType: f.feedbackType, createdAt: f.createdAt })),
    qaPassedAt,
  });

  return {
    blueprintId: blueprint.id,
    version: blueprint.version,
    blueprintStatus: blueprint.status,
    handoffStatus: blueprint.handoffStatus,
    releasedAt: blueprint.releasedAt,
    handoffCompletedAt: blueprint.handoffCompletedAt,
    reviewState,
    clientSafeProjection,
    feedback,
    qaItems,
    launchItems,
    handoffItems,
    qaSummary,
    launchSummary,
    releaseReadiness,
    timeline,
    isLatestVersion: blueprint.version === latestVersionNumber,
  };
}
