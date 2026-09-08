/**
 * Program 7, Gate 7I — Notifications/Messaging Truth.
 *
 * Doctrine:
 * - The system NEVER auto-sends messages (email, SMS, WhatsApp, push) without explicit
 *   human initiation. No "auto-notify owner when X" logic.
 * - Notifications are IN-APP ONLY — they surface reviewable items to staff/owner.
 * - Notifications never claim outcomes, never attribute revenue, never guarantee results.
 * - A notification is a pointer to existing truth, not a new source of truth.
 * - No notification creates a payment, charge, entitlement, or fulfillment.
 *
 * This module is a pure, server-only read layer that builds in-app notification items
 * from existing Program 1–7 data. It does NOT send anything anywhere.
 */
import "server-only";

import { listActiveSignals } from "../advisor/repository";
import { listBusinessOutcomes } from "../outcomes/repository";
import { listCommitmentsForBusiness } from "../promiseKeeper/repository";
import { listProposalsForBusiness } from "../proposals/repository";
import { listJobsForBusiness } from "../creativeStudio/repository";

export type NotificationKind =
  | "advisor_signal"
  | "outcome_review_due"
  | "commitment_overdue"
  | "proposal_awaiting_decision"
  | "creative_awaiting_review";

export type InAppNotification = {
  id: string;
  kind: NotificationKind;
  businessId: string;
  titleEs: string;
  titleEn: string;
  bodyEs: string;
  bodyEn: string;
  sourceReferenceId: string | null;
  createdAt: string;
};

export async function buildInAppNotifications(businessId: string): Promise<InAppNotification[]> {
  const now = new Date();
  const notifications: InAppNotification[] = [];

  const [signals, outcomes, commitments, proposals, creativeJobs] = await Promise.all([
    listActiveSignals(businessId),
    listBusinessOutcomes(businessId),
    listCommitmentsForBusiness(businessId),
    listProposalsForBusiness(businessId),
    listJobsForBusiness(businessId),
  ]);

  for (const signal of signals) {
    notifications.push({
      id: `advisor:${signal.id}`,
      kind: "advisor_signal",
      businessId,
      titleEs: signal.titleEs,
      titleEn: signal.titleEn,
      bodyEs: signal.explanationEs,
      bodyEn: signal.explanationEn,
      sourceReferenceId: signal.id,
      createdAt: signal.detectedAt,
    });
  }

  for (const outcome of outcomes.filter((o) => o.reviewStatus === "pending" && o.nextReviewAt && new Date(o.nextReviewAt) <= now)) {
    notifications.push({
      id: `outcome:${outcome.id}`,
      kind: "outcome_review_due",
      businessId,
      titleEs: `Revisión de resultado vencida: ${outcome.metricLabelEs}`,
      titleEn: `Outcome review due: ${outcome.metricLabelEn}`,
      bodyEs: "Este resultado tiene una revisión pendiente vencida.",
      bodyEn: "This outcome has an overdue review pending.",
      sourceReferenceId: outcome.id,
      createdAt: outcome.nextReviewAt!,
    });
  }

  for (const commitment of commitments.filter((c) => c.status === "active" && c.dueAt && new Date(c.dueAt) < now)) {
    notifications.push({
      id: `commitment:${commitment.id}`,
      kind: "commitment_overdue",
      businessId,
      titleEs: `Compromiso vencido: ${commitment.titleEs}`,
      titleEn: `Overdue commitment: ${commitment.titleEn}`,
      bodyEs: "Este compromiso tiene una fecha de vencimiento pasada.",
      bodyEn: "This commitment has a past due date.",
      sourceReferenceId: commitment.id,
      createdAt: commitment.dueAt!,
    });
  }

  for (const proposal of proposals.filter((p) => p.status === "owner_review")) {
    notifications.push({
      id: `proposal:${proposal.id}`,
      kind: "proposal_awaiting_decision",
      businessId,
      titleEs: "Propuesta esperando decisión del dueño",
      titleEn: "Proposal awaiting owner decision",
      bodyEs: "Hay una propuesta esperando la decisión del dueño del negocio.",
      bodyEn: "There is a proposal awaiting the business owner's decision.",
      sourceReferenceId: proposal.id,
      createdAt: proposal.createdAt,
    });
  }

  for (const job of creativeJobs.filter((j) => j.status === "in_review" || j.status === "owner_review")) {
    notifications.push({
      id: `creative:${job.id}`,
      kind: "creative_awaiting_review",
      businessId,
      titleEs: "Trabajo creativo esperando revisión",
      titleEn: "Creative job awaiting review",
      bodyEs: "Hay un trabajo creativo esperando revisión.",
      bodyEn: "There is a creative job awaiting review.",
      sourceReferenceId: job.id,
      createdAt: job.createdAt,
    });
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return notifications;
}

export function shapeNotificationsForOwner(notifications: InAppNotification[]): InAppNotification[] {
  return notifications.map((n) => ({
    id: n.id,
    kind: n.kind,
    businessId: n.businessId,
    titleEs: n.titleEs,
    titleEn: n.titleEn,
    bodyEs: n.bodyEs,
    bodyEn: n.bodyEn,
    sourceReferenceId: n.sourceReferenceId,
    createdAt: n.createdAt,
  }));
}
