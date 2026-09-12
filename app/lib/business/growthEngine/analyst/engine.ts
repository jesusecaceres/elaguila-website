/**
 * Business Development Analyst — orchestration engine (MD <assessment_generation>).
 *
 *   AUTHORIZED OPERATOR
 *   -> LOAD CANONICAL INPUT PACKET
 *   -> CHOOSE MODEL ROUTE
 *   -> CALL OPENAI
 *   -> VALIDATE STRUCTURED OUTPUT
 *   -> NORMALIZE
 *   -> PERSIST VERSIONED ASSESSMENT       (Gate A's repository — never bypassed)
 *   -> MARK NEEDS REVIEW                  (never auto-reviewed)
 *   -> RECORD PROVIDER METADATA
 *   -> RECORD GROWTH EVENT                (Gate A's repository does this internally)
 *   -> RETURN STRUCTURED ASSESSMENT
 *
 * Caller (the API route) is responsible for authorization (create_growth_assessment capability)
 * and for constructing a real GrowthEngineActor from the canonical resolver — this module never
 * accepts an arbitrary actor or an arbitrary business-truth packet from the browser; the packet is
 * always built server-side from canonical repositories.
 */
import "server-only";

import { buildGrowthAnalystInputPacket, type GrowthAnalystInputPacket } from "./inputPacket";
import { computeGrowthAnalystInputHash } from "./inputHash";
import { shouldUseCachedAssessment } from "./cacheDecision";
import { classifyGrowthAssessmentTask, type GrowthAnalystTaskClass } from "./modelRouting";
import { generateGrowthAssessmentContent } from "./openaiAnalystProvider";
import {
  createGrowthAssessment,
  getCurrentGrowthAssessment,
  listGrowthAssessmentsForBusiness,
  recordGrowthAssessmentCacheHit,
} from "../repository";
import type { GrowthAssessment, GrowthEngineActor } from "../types";

export type GenerateGrowthAssessmentOptions = { forceReanalysis?: boolean };

export type GenerateGrowthAssessmentResult =
  | { ok: true; assessment: GrowthAssessment; cached: boolean; taskClass: GrowthAnalystTaskClass | null }
  | {
      ok: false;
      reason:
        | "business_not_found"
        | "provider_unavailable"
        | "provider_failed"
        | "invalid_provider_output"
        | "rate_limited"
        | "persistence_failed";
      detail?: string;
    };

/**
 * Cache rule (MD <caching>): if a current (non-superseded) assessment exists, its status is not
 * 'draft' (a draft may be a half-finished/failed prior attempt, never a valid cache target), and
 * its stored input_hash matches the freshly computed hash of the current input packet, return it
 * without a provider call — UNLESS the caller explicitly requests re-analysis. The hash is
 * computed from real compiled content (see inputHash.ts), never from an unstable timestamp alone.
 */
export async function generateOrGetGrowthAssessment(
  businessId: string,
  actor: GrowthEngineActor,
  options: GenerateGrowthAssessmentOptions = {},
): Promise<GenerateGrowthAssessmentResult> {
  const packet = await buildGrowthAnalystInputPacket(businessId);
  if (!packet) return { ok: false, reason: "business_not_found" };

  const inputHash = computeGrowthAnalystInputHash(packet);
  const current = await getCurrentGrowthAssessment(businessId);
  if (current && shouldUseCachedAssessment(current, inputHash, options.forceReanalysis ?? false)) {
    await recordGrowthAssessmentCacheHit(businessId, current.id, actor);
    return { ok: true, assessment: current, cached: true, taskClass: null };
  }

  const taskClass = await resolveTaskClass(businessId, packet);
  const generation = await generateGrowthAssessmentContent(packet, taskClass);

  if (!generation.ok) {
    const knownReasons = ["provider_unavailable", "provider_failed", "invalid_provider_output", "rate_limited"] as const;
    const reason = (knownReasons as readonly string[]).includes(generation.failureCode)
      ? (generation.failureCode as (typeof knownReasons)[number])
      : "provider_failed";
    return { ok: false, reason, detail: generation.failureReason };
  }

  const created = await createGrowthAssessment(
    {
      businessId,
      providerKey: generation.usage.providerKey,
      modelKey: generation.usage.modelKey,
      inputSnapshot: packetToStorableSnapshot(packet),
      inputHash,
      costMetadata: {
        taskClass: generation.usage.taskClass,
        promptTokens: generation.usage.promptTokens,
        completionTokens: generation.usage.completionTokens,
        totalTokens: generation.usage.totalTokens,
        latencyMs: generation.usage.latencyMs,
      },
      status: "needs_review",
      summaryEs: generation.content.summaryEs,
      summaryEn: generation.content.summaryEn,
      whatFound: generation.content.whatFound,
      whatKnown: generation.content.whatKnown,
      whatUnknown: generation.content.whatUnknown,
      needsVerification: generation.content.needsVerification,
      weakOrMissing: generation.content.weakOrMissing,
      clientQuestions: generation.content.clientQuestions,
      risksConstraints: generation.content.risksConstraints,
      growthOpportunities: generation.content.growthOpportunities,
      suggestedSolutions: generation.content.suggestedSolutions,
      recommendedMediaMix: generation.content.recommendedMediaMix,
      priorityOrder: generation.content.priorityOrder,
      measurementPlan: generation.content.measurementPlan,
      nextRightMoveEs: generation.content.nextRightMoveEs,
      nextRightMoveEn: generation.content.nextRightMoveEn,
    },
    actor,
  );

  if (!created) return { ok: false, reason: "persistence_failed" };
  return { ok: true, assessment: created, cached: false, taskClass };
}

async function resolveTaskClass(businessId: string, packet: GrowthAnalystInputPacket): Promise<GrowthAnalystTaskClass> {
  const priorAssessments = await listGrowthAssessmentsForBusiness(businessId);
  const isFirstAssessment = priorAssessments.length === 0;
  const hasUnresolvedContradictions = packet.cockpitBriefing.truthClasses.contradiction.length > 0;
  return classifyGrowthAssessmentTask({ isFirstAssessment, hasUnresolvedContradictions, roadmapType: packet.roadmapType });
}

/**
 * input_snapshot is stored for provenance/reconstruction (matching business_ai_research_runs'
 * doctrine exactly) but must never carry a secret — the packet never contained one in the first
 * place (no API key, no raw env value anywhere in GrowthAnalystInputPacket), so this is a direct
 * pass-through, not a redaction step.
 */
function packetToStorableSnapshot(packet: GrowthAnalystInputPacket): Record<string, unknown> {
  return packet as unknown as Record<string, unknown>;
}
