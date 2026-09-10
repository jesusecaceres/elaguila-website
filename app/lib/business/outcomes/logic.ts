/**
 * Program 7 — Business Outcomes deterministic logic.
 * Pure functions — no I/O, no "server-only" — matching the repo's testable-logic convention.
 *
 * Measurement rules:
 * - No reliable baseline or measurement → inconclusive
 * - Measured change with adequate source → improved / unchanged / declined
 * - Causation defaults to none; only moves to possible/supported when evidence justifies it
 * - Never produces guaranteed/proven causation
 */
import type {
  OutcomeResult, OutcomeConfidence, OutcomeCausationClaim, OutcomeReviewStatus,
} from "./types";

export function computeResult(
  baselineValue: string | null,
  measuredValue: string | null,
  measurementSource: string | null,
): OutcomeResult {
  if (!baselineValue || !measuredValue || !measurementSource) {
    return "inconclusive";
  }

  const baseline = parseFloat(baselineValue);
  const measured = parseFloat(measuredValue);

  if (isNaN(baseline) || isNaN(measured)) {
    return "inconclusive";
  }

  if (measured > baseline) return "improved";
  if (measured < baseline) return "declined";
  return "unchanged";
}

export function computeConfidence(
  hasBaseline: boolean,
  hasMeasurement: boolean,
  hasEvidence: boolean,
  measurementSource: string | null,
): OutcomeConfidence {
  if (!hasBaseline || !hasMeasurement || !measurementSource) {
    return "insufficient_evidence";
  }
  if (!hasEvidence) {
    return "low";
  }
  if (measurementSource === "manual_entry" || measurementSource === "owner_reported") {
    return "medium";
  }
  if (measurementSource === "system_derived" || measurementSource === "external_source") {
    return "high";
  }
  return "medium";
}

export function computeCausation(
  hasEvidence: boolean,
  evidenceCount: number,
  hasRelatedRecommendation: boolean,
  hasRelatedCommitment: boolean,
): OutcomeCausationClaim {
  if (!hasEvidence || evidenceCount === 0) {
    return "none";
  }
  if (evidenceCount >= 2 && (hasRelatedRecommendation || hasRelatedCommitment)) {
    return "supported";
  }
  if (evidenceCount >= 1) {
    return "possible";
  }
  return "none";
}

export function canMarkReviewed(
  reviewStatus: OutcomeReviewStatus,
  result: OutcomeResult,
  confidence: OutcomeConfidence,
): boolean {
  if (reviewStatus === "reviewed") return false;
  if (result === "inconclusive" && confidence === "insufficient_evidence") return true;
  return true;
}

export function isOwnerSafeOutcome(outcome: {
  reviewStatus: OutcomeReviewStatus;
  result: OutcomeResult;
  confidence: OutcomeConfidence;
}): boolean {
  return outcome.reviewStatus === "reviewed" || outcome.result !== "inconclusive";
}

export function shapeOutcomeForOwner(outcome: {
  id: string;
  metricKey: string;
  metricLabelEs: string;
  metricLabelEn: string;
  baselineValue: string | null;
  baselineUnit: string | null;
  measuredValue: string | null;
  measuredUnit: string | null;
  result: OutcomeResult;
  confidence: OutcomeConfidence;
  causationClaim: OutcomeCausationClaim;
  reviewStatus: OutcomeReviewStatus;
  nextReviewAt: string | null;
}): {
  id: string;
  metricKey: string;
  metricLabelEs: string;
  metricLabelEn: string;
  baselineValue: string | null;
  baselineUnit: string | null;
  measuredValue: string | null;
  measuredUnit: string | null;
  result: OutcomeResult;
  confidence: OutcomeConfidence;
  causationClaim: OutcomeCausationClaim;
  reviewStatus: OutcomeReviewStatus;
  nextReviewAt: string | null;
} {
  return {
    id: outcome.id,
    metricKey: outcome.metricKey,
    metricLabelEs: outcome.metricLabelEs,
    metricLabelEn: outcome.metricLabelEn,
    baselineValue: outcome.baselineValue,
    baselineUnit: outcome.baselineUnit,
    measuredValue: outcome.measuredValue,
    measuredUnit: outcome.measuredUnit,
    result: outcome.result,
    confidence: outcome.confidence,
    causationClaim: outcome.causationClaim,
    reviewStatus: outcome.reviewStatus,
    nextReviewAt: outcome.nextReviewAt,
  };
}
