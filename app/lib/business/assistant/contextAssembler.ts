/**
 * Program 7, Gate 7F — Context assembler for the Business Concierge Assistant.
 * Server-only. Gathers read-only context from existing Program 1–6 truth for a specific
 * business. Never mutates business state. Never exposes cross-business data.
 *
 * The assistant uses this context to READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, SUGGEST —
 * never to autonomously update facts, resolve contradictions, approve recommendations,
 * charge, send messages, or mutate any business state.
 */
import "server-only";

import { listFactsForBusiness, listUnknownsForBusiness, listContradictionsForBusiness } from "../livingBook/repository";
import { getLatestCompletedRun, getDimensionResultsForRun } from "../healthMap/repository";
import { listRecommendationsForBusiness } from "../stewardship/repository";
import { listCommitmentsForBusiness } from "../promiseKeeper/repository";
import { listProposalsForBusiness } from "../proposals/repository";
import { listJobsForBusiness } from "../creativeStudio/repository";
import { listBusinessOutcomes } from "../outcomes/repository";
import { listActiveSignals } from "../advisor/repository";
import type { AssistantContextType } from "./types";

export type AssembledContext = {
  businessId: string;
  contextType: AssistantContextType;
  snapshot: {
    livingBook?: {
      factCount: number;
      unknownCount: number;
      openContradictionCount: number;
      recentFactSummaries: { factKey: string; displayValue: string | null; status: string; confidence: string }[];
    };
    healthMap?: {
      latestRunId: string | null;
      latestRunDate: string | null;
      dimensionStatuses: { dimensionKey: string; status: string; confidence: string }[];
      readinessStatus: string | null;
    };
    stewardship?: {
      recommendationCount: number;
      currentRecommendation: { candidateKey: string; status: string; verifiedNeedEn: string } | null;
    };
    commitments?: {
      activeCount: number;
      blockedCount: number;
      stretchedCount: number;
      nextDueDate: string | null;
    };
    proposals?: {
      ownerReviewCount: number;
      acceptedCount: number;
    };
    creativeStudio?: {
      inReviewCount: number;
      approvedCount: number;
    };
    outcomes?: {
      totalCount: number;
      improvedCount: number;
      pendingReviewCount: number;
    };
    advisor?: {
      activeSignalCount: number;
      prioritySignalCount: number;
      blockedSignalCount: number;
    };
  };
  assembledAt: string;
};

export async function assembleContext(
  businessId: string,
  contextType: AssistantContextType,
): Promise<AssembledContext> {
  const snapshot: AssembledContext["snapshot"] = {};
  const now = new Date().toISOString();

  if (contextType === "living_book" || contextType === "general") {
    const [facts, unknowns, contradictions] = await Promise.all([
      listFactsForBusiness(businessId, false),
      listUnknownsForBusiness(businessId),
      listContradictionsForBusiness(businessId),
    ]);
    snapshot.livingBook = {
      factCount: facts.length,
      unknownCount: unknowns.filter((u) => u.status === "open").length,
      openContradictionCount: contradictions.filter((c) => c.status === "open").length,
      recentFactSummaries: facts.slice(0, 10).map((f) => ({
        factKey: f.factKey,
        displayValue: f.displayValue,
        status: f.status,
        confidence: f.confidence,
      })),
    };
  }

  if (contextType === "health_map" || contextType === "general") {
    const latestRun = await getLatestCompletedRun(businessId);
    if (latestRun) {
      const dims = await getDimensionResultsForRun(latestRun.id);
      snapshot.healthMap = {
        latestRunId: latestRun.id,
        latestRunDate: latestRun.createdAt,
        dimensionStatuses: dims.map((d) => ({
          dimensionKey: d.dimensionKey,
          status: d.status,
          confidence: d.confidence,
        })),
        readinessStatus: null,
      };
    } else {
      snapshot.healthMap = {
        latestRunId: null,
        latestRunDate: null,
        dimensionStatuses: [],
        readinessStatus: null,
      };
    }
  }

  if (contextType === "stewardship" || contextType === "general") {
    const recommendations = await listRecommendationsForBusiness(businessId);
    const current = recommendations.find((r) => r.isCurrent);
    snapshot.stewardship = {
      recommendationCount: recommendations.length,
      currentRecommendation: current
        ? { candidateKey: current.candidateKey, status: current.status, verifiedNeedEn: current.verifiedNeedEn }
        : null,
    };
  }

  if (contextType === "promise_keeper" || contextType === "general") {
    const commitments = await listCommitmentsForBusiness(businessId);
    const active = commitments.filter((c) => c.status === "active");
    snapshot.commitments = {
      activeCount: active.length,
      blockedCount: commitments.filter((c) => c.status === "blocked").length,
      stretchedCount: commitments.filter((c) => c.capacityState === "stretched").length,
      nextDueDate: active
        .filter((c) => c.dueAt)
        .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0]?.dueAt ?? null,
    };
  }

  if (contextType === "proposals" || contextType === "general") {
    const proposals = await listProposalsForBusiness(businessId);
    snapshot.proposals = {
      ownerReviewCount: proposals.filter((p) => p.status === "owner_review").length,
      acceptedCount: proposals.filter((p) => p.status === "accepted").length,
    };
  }

  if (contextType === "creative_studio" || contextType === "general") {
    const jobs = await listJobsForBusiness(businessId);
    snapshot.creativeStudio = {
      inReviewCount: jobs.filter((j) => j.status === "in_review" || j.status === "owner_review").length,
      approvedCount: jobs.filter((j) => j.status === "approved").length,
    };
  }

  if (contextType === "outcomes" || contextType === "general") {
    const outcomes = await listBusinessOutcomes(businessId);
    snapshot.outcomes = {
      totalCount: outcomes.length,
      improvedCount: outcomes.filter((o) => o.result === "improved").length,
      pendingReviewCount: outcomes.filter((o) => o.reviewStatus === "pending").length,
    };
  }

  if (contextType === "advisor" || contextType === "general") {
    const signals = await listActiveSignals(businessId);
    snapshot.advisor = {
      activeSignalCount: signals.length,
      prioritySignalCount: signals.filter((s) => s.severity === "priority").length,
      blockedSignalCount: signals.filter((s) => s.severity === "blocked").length,
    };
  }

  return {
    businessId,
    contextType,
    snapshot,
    assembledAt: now,
  };
}
