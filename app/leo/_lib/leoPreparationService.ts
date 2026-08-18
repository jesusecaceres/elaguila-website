/**
 * LEO-8 Preparation Service — owner-only on-demand watch + YELLOW prepare.
 * No persistence. No external execution. No AI.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { assessLeoGovernance } from "@/app/leo/_lib/leoGovernanceEngine";
import { leoListRecentMemory } from "@/app/leo/_lib/leoLivingBookService";
import {
  buildLeoPreparedAction,
  type LeoPreparationEngineResult,
} from "@/app/leo/_lib/leoPreparationEngine";
import { evaluateLeoWatcherRequest } from "@/app/leo/_lib/leoWatcherEngine";
import { isLeoWatcherKind } from "@/app/leo/_lib/leoWatcherRegistry";
import type {
  LeoPreparationKind,
  LeoPreparationRequest,
  LeoWatcherFinding,
  LeoWatcherRunResult,
} from "@/app/leo/_lib/leoTypes";

const VALID_PREP: readonly LeoPreparationKind[] = [
  "FOLLOW_UP_DRAFT",
  "MEETING_BRIEF",
  "DECISION_BRIEF",
  "REVIEW_PLAN",
  "CLIENT_CARE_PLAN",
  "INTERNAL_TASK_DRAFT",
];

export function isLeoPreparationKind(v: unknown): v is LeoPreparationKind {
  return typeof v === "string" && (VALID_PREP as readonly string[]).includes(v);
}

export type LeoPreparationServiceResult = {
  watcherResult: LeoWatcherRunResult | null;
  preparation: LeoPreparationEngineResult;
};

/**
 * Owner-admin: optional watcher → governance → YELLOW prepared artifact (or blocked).
 */
export async function runLeoPreparation(
  request: LeoPreparationRequest,
): Promise<LeoPreparationServiceResult> {
  await requireLeoOwnerAccess();
  const nowMs = request.nowMs ?? Date.now();

  let watcherResult: LeoWatcherRunResult | null = null;
  let findings: LeoWatcherFinding[] = [];

  if (request.watcherKind) {
    if (!isLeoWatcherKind(request.watcherKind)) {
      return {
        watcherResult: null,
        preparation: {
          ok: false,
          error: "unsupported_preparation",
          message: `Unsupported watcherKind '${request.watcherKind}'.`,
          governance: assessLeoGovernance({ actionKind: "PREPARE_DRAFT", nowMs }),
          prepared: null,
        },
      };
    }

    const clientCare =
      request.watcherKind === "CLIENT_CARE" || request.watcherKind === "FOLLOW_UP"
        ? await getLeoClientCareWatch({ nowMs })
        : null;
    const attentionBrief =
      request.watcherKind === "ATTENTION" ? await getLeoAttentionBrief({ nowMs }) : null;
    const memoryRecords =
      request.watcherKind === "MEMORY_CONTRADICTION" ? await leoListRecentMemory(20) : null;

    const evaluated = evaluateLeoWatcherRequest(
      {
        watcherKind: request.watcherKind,
        maxFindings: request.maxFindings ?? 20,
        nowMs,
        decisionContext: request.decisionContext,
        memoryRecords,
      },
      {
        clientCare,
        attentionBrief,
        memoryRecords: memoryRecords ?? undefined,
      },
    );

    if ("ok" in evaluated && evaluated.ok === false) {
      return {
        watcherResult: null,
        preparation: {
          ok: false,
          error: "unsupported_preparation",
          message: evaluated.message,
          governance: assessLeoGovernance({ actionKind: "PREPARE_DRAFT", nowMs }),
          prepared: null,
        },
      };
    }

    watcherResult = evaluated as LeoWatcherRunResult;
    findings = [...watcherResult.findings];
  }

  const entityId = request.entityId?.trim() || null;
  const scoped = entityId
    ? findings.filter(
        (f) =>
          f.key.includes(entityId) ||
          f.evidenceRefs.some((r) => r.includes(entityId)) ||
          f.summary.includes(entityId),
      )
    : findings;

  const preparation = buildLeoPreparedAction({
    request: { ...request, nowMs },
    findings: scoped.length ? scoped : findings,
    watcherResult,
  });

  return { watcherResult, preparation };
}
