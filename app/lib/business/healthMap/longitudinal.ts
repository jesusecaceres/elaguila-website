/**
 * Program 7, Gate 7D — Longitudinal Health Map view layer.
 * Reads exclusively from existing immutable business_health_assessment_runs and
 * business_health_dimension_results. Never creates a new Health Map system, never
 * computes numeric ratings, never collapses dimensions into a vanity number.
 *
 * This is a READ-ONLY extension — no new tables, no mutation, no Health Map V2.
 * It compares dimension statuses across runs over time to show trends.
 * Never claims an outcome caused a Health Map change without evidence.
 */
import "server-only";

import { listRunsForBusiness, getDimensionResultsForRun } from "./repository";
import { HEALTH_DIMENSION_KEYS } from "./constants";
import type {
  BusinessHealthAssessmentRun, HealthDimensionKey, HealthDimensionStatus,
} from "./types";

export type DimensionStatusTrend = {
  dimensionKey: HealthDimensionKey;
  statuses: { runId: string; runCreatedAt: string; status: HealthDimensionStatus }[];
};

export type LongitudinalHealthView = {
  businessId: string;
  runs: BusinessHealthAssessmentRun[];
  dimensionTrends: DimensionStatusTrend[];
  totalRuns: number;
};

export type DimensionStatusTransition = {
  dimensionKey: HealthDimensionKey;
  fromStatus: HealthDimensionStatus;
  toStatus: HealthDimensionStatus;
  direction: "improved" | "declined" | "unchanged" | "changed";
  fromRunId: string;
  toRunId: string;
  fromRunCreatedAt: string;
  toRunCreatedAt: string;
};

const STATUS_ORDER: Record<HealthDimensionStatus, number> = {
  strong: 5,
  stable: 4,
  needs_attention: 3,
  insufficient_information: 2,
  blocked_by_contradiction: 1,
};

export function computeTransitionDirection(
  from: HealthDimensionStatus,
  to: HealthDimensionStatus,
): "improved" | "declined" | "unchanged" | "changed" {
  if (from === to) return "unchanged";
  const fromOrder = STATUS_ORDER[from] ?? 0;
  const toOrder = STATUS_ORDER[to] ?? 0;
  if (toOrder > fromOrder) return "improved";
  if (toOrder < fromOrder) return "declined";
  return "changed";
}

export async function buildLongitudinalView(
  businessId: string,
  maxRuns = 10,
): Promise<LongitudinalHealthView> {
  const runs = await listRunsForBusiness(businessId, maxRuns);
  const completedRuns = runs.filter((r) => r.status === "completed");

  if (completedRuns.length === 0) {
    return {
      businessId,
      runs: [],
      dimensionTrends: HEALTH_DIMENSION_KEYS.map((key) => ({
        dimensionKey: key,
        statuses: [],
      })),
      totalRuns: 0,
    };
  }

  const chronologicalRuns = [...completedRuns].reverse();

  const dimensionTrends: DimensionStatusTrend[] = [];
  for (const key of HEALTH_DIMENSION_KEYS) {
    const statuses: { runId: string; runCreatedAt: string; status: HealthDimensionStatus }[] = [];
    for (const run of chronologicalRuns) {
      const dims = await getDimensionResultsForRun(run.id);
      const dim = dims.find((d) => d.dimensionKey === key);
      if (dim) {
        statuses.push({
          runId: run.id,
          runCreatedAt: run.createdAt,
          status: dim.status,
        });
      }
    }
    dimensionTrends.push({ dimensionKey: key, statuses });
  }

  return {
    businessId,
    runs: chronologicalRuns,
    dimensionTrends,
    totalRuns: chronologicalRuns.length,
  };
}

export async function computeTransitionsBetweenRuns(
  businessId: string,
  fromRunId: string,
  toRunId: string,
): Promise<DimensionStatusTransition[]> {
  const [fromDims, toDims] = await Promise.all([
    getDimensionResultsForRun(fromRunId),
    getDimensionResultsForRun(toRunId),
  ]);

  const transitions: DimensionStatusTransition[] = [];
  for (const key of HEALTH_DIMENSION_KEYS) {
    const fromDim = fromDims.find((d) => d.dimensionKey === key);
    const toDim = toDims.find((d) => d.dimensionKey === key);
    if (fromDim && toDim) {
      const direction = computeTransitionDirection(fromDim.status, toDim.status);
      if (direction !== "unchanged") {
        transitions.push({
          dimensionKey: key,
          fromStatus: fromDim.status,
          toStatus: toDim.status,
          direction,
          fromRunId,
          toRunId,
          fromRunCreatedAt: fromDim.createdAt,
          toRunCreatedAt: toDim.createdAt,
        });
      }
    }
  }
  return transitions;
}

export function shapeLongitudinalForOwner(view: LongitudinalHealthView): {
  businessId: string;
  totalRuns: number;
  runs: { id: string; createdAt: string; strongCount: number; needsAttentionCount: number; insufficientInformationCount: number; contradictionBlockedCount: number }[];
  dimensionTrends: { dimensionKey: HealthDimensionKey; statuses: { runId: string; runCreatedAt: string; status: HealthDimensionStatus }[] }[];
} {
  return {
    businessId: view.businessId,
    totalRuns: view.totalRuns,
    runs: view.runs.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      strongCount: r.strongCount,
      needsAttentionCount: r.needsAttentionCount,
      insufficientInformationCount: r.insufficientInformationCount,
      contradictionBlockedCount: r.contradictionBlockedCount,
    })),
    dimensionTrends: view.dimensionTrends,
  };
}
