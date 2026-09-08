/**
 * Program 7, Gate 7E — Proactive Advisor signal scanner.
 * Server-only. Reads exclusively from existing Program 1–6 truth:
 *   - Promise Keeper commitments (overdue, blocked, stretched)
 *   - Stewardship recommendations (postponed review due)
 *   - Creative Studio jobs (awaiting review)
 *   - Proposals (awaiting owner decision)
 *   - Living Book contradictions (unresolved)
 *   - Living Book facts (stale critical)
 *   - Outcomes (review due)
 *
 * Never auto-sends messages, auto-creates recommendations, auto-charges,
 * or auto-mutates any business state. Signals are reviewable items only.
 */
import "server-only";

import { listCommitmentsForBusiness } from "../promiseKeeper/repository";
import { listRecommendationsForBusiness } from "../stewardship/repository";
import { listJobsForBusiness } from "../creativeStudio/repository";
import { listProposalsForBusiness } from "../proposals/repository";
import { listContradictionsForBusiness, listFactsForBusiness } from "../livingBook/repository";
import { listBusinessOutcomes } from "../outcomes/repository";
import { detectSignals, type DetectedSignal, type SignalDetectionInput } from "./logic";
import type { AdvisorActor, AdvisorSourceType } from "./types";

export type ScannedSignal = DetectedSignal & {
  sourceType: AdvisorSourceType;
  sourceReferenceId: string | null;
  titleEs: string;
  titleEn: string;
  explanationEs: string;
  explanationEn: string;
};

export async function scanBusinessSignals(businessId: string): Promise<ScannedSignal[]> {
  const now = new Date();

  const [commitments, recommendations, creativeJobs, proposals, contradictions, facts, outcomes] = await Promise.all([
    listCommitmentsForBusiness(businessId),
    listRecommendationsForBusiness(businessId),
    listJobsForBusiness(businessId),
    listProposalsForBusiness(businessId),
    listContradictionsForBusiness(businessId),
    listFactsForBusiness(businessId, false),
    listBusinessOutcomes(businessId),
  ]);

  const hasOverdueCommitment = commitments.some(
    (c) => c.status === "active" && c.dueAt && new Date(c.dueAt) < now,
  );
  const hasBlockedCommitment = commitments.some((c) => c.status === "blocked");
  const hasPostponedReviewDue = recommendations.some(
    (r) => r.status === "postponed" && r.ownerDecisionReviewDate && new Date(r.ownerDecisionReviewDate) <= now,
  );
  const hasCreativeAwaitingReview = creativeJobs.some(
    (j) => j.status === "in_review" || j.status === "owner_review",
  );
  const hasProposalAwaitingOwner = proposals.some((p) => p.status === "owner_review");
  const hasUnresolvedContradiction = contradictions.some((c) => c.status === "open");
  const hasStaleCriticalFact = facts.some(
    (f) => f.status === "active" && f.lastVerifiedAt && (now.getTime() - new Date(f.lastVerifiedAt).getTime()) > 90 * 24 * 60 * 60 * 1000,
  );
  const hasOutcomeReviewDue = outcomes.some(
    (o) => o.reviewStatus === "pending" && o.nextReviewAt && new Date(o.nextReviewAt) <= now,
  );
  const hasCapacityStretched = commitments.some((c) => c.capacityState === "stretched");

  const input: SignalDetectionInput = {
    hasOverdueCommitment,
    hasBlockedCommitment,
    hasPostponedReviewDue,
    hasCreativeAwaitingReview,
    hasProposalAwaitingOwner,
    hasUnresolvedContradiction,
    hasStaleCriticalFact,
    hasOutcomeReviewDue,
    hasCapacityStretched,
  };

  const detected = detectSignals(input);

  const scanned: ScannedSignal[] = detected.map((signal) => {
    let sourceType: AdvisorSourceType = "commitment";
    let sourceReferenceId: string | null = null;
    let titleEs = "";
    let titleEn = "";
    let explanationEs = "";
    let explanationEn = "";

    switch (signal.signalType) {
      case "COMMITMENT_DUE": {
        sourceType = "commitment";
        const overdue = commitments.find((c) => c.status === "active" && c.dueAt && new Date(c.dueAt) < now);
        sourceReferenceId = overdue?.id ?? null;
        titleEs = "Compromiso vencido";
        titleEn = "Overdue commitment";
        explanationEs = overdue ? `El compromiso "${overdue.titleEs}" tiene una fecha de vencimiento pasada.` : "Hay al menos un compromiso vencido.";
        explanationEn = overdue ? `The commitment "${overdue.titleEn}" has a past due date.` : "There is at least one overdue commitment.";
        break;
      }
      case "COMMITMENT_BLOCKED": {
        sourceType = "commitment";
        const blocked = commitments.find((c) => c.status === "blocked");
        sourceReferenceId = blocked?.id ?? null;
        titleEs = "Compromiso bloqueado";
        titleEn = "Blocked commitment";
        explanationEs = blocked ? `El compromiso "${blocked.titleEs}" está bloqueado.${blocked.blocker ? ` Motivo: ${blocked.blocker}` : ""}` : "Hay al menos un compromiso bloqueado.";
        explanationEn = blocked ? `The commitment "${blocked.titleEn}" is blocked.${blocked.blocker ? ` Reason: ${blocked.blocker}` : ""}` : "There is at least one blocked commitment.";
        break;
      }
      case "POSTPONED_RECOMMENDATION_REVIEW_DUE": {
        sourceType = "recommendation";
        const postponed = recommendations.find(
          (r) => r.status === "postponed" && r.ownerDecisionReviewDate && new Date(r.ownerDecisionReviewDate) <= now,
        );
        sourceReferenceId = postponed?.id ?? null;
        titleEs = "Revisión de recomendación pospuesta vencida";
        titleEn = "Postponed recommendation review due";
        explanationEs = "Una recomendación pospuesta tiene una fecha de revisión vencida.";
        explanationEn = "A postponed recommendation has a review date that is due.";
        break;
      }
      case "CREATIVE_AWAITING_REVIEW": {
        sourceType = "creative_job";
        const awaiting = creativeJobs.find((j) => j.status === "in_review" || j.status === "owner_review");
        sourceReferenceId = awaiting?.id ?? null;
        titleEs = "Trabajo creativo esperando revisión";
        titleEn = "Creative job awaiting review";
        explanationEs = "Hay al menos un trabajo creativo esperando revisión.";
        explanationEn = "There is at least one creative job awaiting review.";
        break;
      }
      case "PROPOSAL_AWAITING_OWNER": {
        sourceType = "proposal";
        const awaiting = proposals.find((p) => p.status === "owner_review");
        sourceReferenceId = awaiting?.id ?? null;
        titleEs = "Propuesta esperando decisión del dueño";
        titleEn = "Proposal awaiting owner decision";
        explanationEs = "Hay una propuesta esperando la decisión del dueño del negocio.";
        explanationEn = "There is a proposal awaiting the business owner's decision.";
        break;
      }
      case "UNRESOLVED_CONTRADICTION": {
        sourceType = "contradiction";
        const unresolved = contradictions.find((c) => c.status === "open");
        sourceReferenceId = unresolved?.id ?? null;
        titleEs = "Contradicción sin resolver";
        titleEn = "Unresolved contradiction";
        explanationEs = "Hay al menos una contradicción sin resolver en el Living Business Book.";
        explanationEn = "There is at least one unresolved contradiction in the Living Business Book.";
        break;
      }
      case "STALE_CRITICAL_TRUTH": {
        sourceType = "fact";
        const stale = facts.find(
          (f) => f.status === "active" && f.lastVerifiedAt && (now.getTime() - new Date(f.lastVerifiedAt).getTime()) > 90 * 24 * 60 * 60 * 1000,
        );
        sourceReferenceId = stale?.id ?? null;
        titleEs = "Hecho crítico desactualizado";
        titleEn = "Stale critical fact";
        explanationEs = "Hay al menos un hecho activo que no ha sido verificado en más de 90 días.";
        explanationEn = "There is at least one active fact that has not been verified in over 90 days.";
        break;
      }
      case "OUTCOME_REVIEW_DUE": {
        sourceType = "outcome";
        const due = outcomes.find(
          (o) => o.reviewStatus === "pending" && o.nextReviewAt && new Date(o.nextReviewAt) <= now,
        );
        sourceReferenceId = due?.id ?? null;
        titleEs = "Revisión de resultado pendiente";
        titleEn = "Outcome review due";
        explanationEs = "Hay al menos un resultado con revisión pendiente vencida.";
        explanationEn = "There is at least one outcome with an overdue review.";
        break;
      }
      case "CAPACITY_STRETCHED": {
        sourceType = "capacity";
        sourceReferenceId = null;
        titleEs = "Capacidad extendida";
        titleEn = "Capacity stretched";
        explanationEs = "Hay al menos un compromiso con capacidad extendida.";
        explanationEn = "There is at least one commitment with stretched capacity.";
        break;
      }
    }

    return {
      ...signal,
      sourceType,
      sourceReferenceId,
      titleEs,
      titleEn,
      explanationEs,
      explanationEn,
    };
  });

  return scanned;
}

export type { AdvisorActor };
