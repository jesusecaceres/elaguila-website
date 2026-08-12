/**
 * Program 7 — Proactive Advisor deterministic logic.
 * Pure functions — no I/O, no "server-only" — matching the repo's testable-logic convention.
 *
 * Signal detection rules:
 * - Deterministic: same inputs always produce same signal type/severity
 * - Never auto-acts, never sends messages, never creates recommendations
 * - Signals are reviewable items for staff/owner attention
 */
import type {
  AdvisorSignalType, AdvisorSignalSeverity, AdvisorSignalStatus,
} from "./types";

export type SignalDetectionInput = {
  hasOverdueCommitment: boolean;
  hasBlockedCommitment: boolean;
  hasPostponedReviewDue: boolean;
  hasCreativeAwaitingReview: boolean;
  hasProposalAwaitingOwner: boolean;
  hasUnresolvedContradiction: boolean;
  hasStaleCriticalFact: boolean;
  hasOutcomeReviewDue: boolean;
  hasCapacityStretched: boolean;
};

export type DetectedSignal = {
  signalType: AdvisorSignalType;
  severity: AdvisorSignalSeverity;
};

export function detectSignals(input: SignalDetectionInput): DetectedSignal[] {
  const signals: DetectedSignal[] = [];

  if (input.hasBlockedCommitment) {
    signals.push({ signalType: "COMMITMENT_BLOCKED", severity: "blocked" });
  }
  if (input.hasOverdueCommitment) {
    signals.push({ signalType: "COMMITMENT_DUE", severity: "priority" });
  }
  if (input.hasPostponedReviewDue) {
    signals.push({ signalType: "POSTPONED_RECOMMENDATION_REVIEW_DUE", severity: "opportunity" });
  }
  if (input.hasCreativeAwaitingReview) {
    signals.push({ signalType: "CREATIVE_AWAITING_REVIEW", severity: "opportunity" });
  }
  if (input.hasProposalAwaitingOwner) {
    signals.push({ signalType: "PROPOSAL_AWAITING_OWNER", severity: "priority" });
  }
  if (input.hasUnresolvedContradiction) {
    signals.push({ signalType: "UNRESOLVED_CONTRADICTION", severity: "priority" });
  }
  if (input.hasStaleCriticalFact) {
    signals.push({ signalType: "STALE_CRITICAL_TRUTH", severity: "information" });
  }
  if (input.hasOutcomeReviewDue) {
    signals.push({ signalType: "OUTCOME_REVIEW_DUE", severity: "opportunity" });
  }
  if (input.hasCapacityStretched) {
    signals.push({ signalType: "CAPACITY_STRETCHED", severity: "information" });
  }

  return signals;
}

export function canAcknowledgeSignal(status: AdvisorSignalStatus): boolean {
  return status === "active";
}

export function canResolveSignal(status: AdvisorSignalStatus): boolean {
  return status === "active" || status === "acknowledged";
}

export function canDismissSignal(status: AdvisorSignalStatus): boolean {
  return status === "active" || status === "acknowledged";
}

export function isSignalExpired(expiresAt: string | null, now: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < new Date(now).getTime();
}

export function shapeSignalForOwner(signal: {
  id: string;
  signalType: AdvisorSignalType;
  severity: AdvisorSignalSeverity;
  status: AdvisorSignalStatus;
  titleEs: string;
  titleEn: string;
  explanationEs: string;
  explanationEn: string;
  detectedAt: string;
}): {
  id: string;
  signalType: AdvisorSignalType;
  severity: AdvisorSignalSeverity;
  status: AdvisorSignalStatus;
  titleEs: string;
  titleEn: string;
  explanationEs: string;
  explanationEn: string;
  detectedAt: string;
} {
  return {
    id: signal.id,
    signalType: signal.signalType,
    severity: signal.severity,
    status: signal.status,
    titleEs: signal.titleEs,
    titleEn: signal.titleEn,
    explanationEs: signal.explanationEs,
    explanationEn: signal.explanationEn,
    detectedAt: signal.detectedAt,
  };
}
