/**
 * LEO-22C feedback service — owner_admin only. No Gmail send. No Living Book rewrite.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { aggregateLeoFeedbackQuality } from "@/app/leo/_lib/leoFeedbackMetrics";
import {
  insertLeoFactCorrectionProposal,
  listLeoResponseFeedback,
  upsertLeoResponseFeedback,
} from "@/app/leo/_lib/leoFeedbackRepository";
import { leoCollectRegressionCandidates } from "@/app/leo/_lib/leoFeedbackRegressionCandidates";
import type {
  LeoFactCorrectionProposal,
  LeoFeedbackQualitySnapshot,
  LeoFeedbackRecord,
  LeoFeedbackUpsertInput,
  LeoRegressionCandidate,
} from "@/app/leo/_lib/leoFeedbackTypes";

export async function submitLeoResponseFeedback(
  payload: LeoFeedbackUpsertInput,
): Promise<{
  ok: true;
  record: LeoFeedbackRecord;
  correction: LeoFactCorrectionProposal | null;
} | { ok: false; error: string; persistenceState: "NOT_PERSISTED" }> {
  const access = await requireLeoOwnerAccess();
  const ownerKey = access.admin.authUserId?.trim() || "owner_admin";

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "persistence_unavailable", persistenceState: "NOT_PERSISTED" };
  }

  try {
    const saved = await upsertLeoResponseFeedback({ ownerKey, payload });
    if (!saved.ok) {
      return { ok: false, error: saved.error, persistenceState: "NOT_PERSISTED" };
    }

    let correction: LeoFactCorrectionProposal | null = null;
    // Fact corrections are always PROPOSED. Never auto-ACCEPTED. Never rewrite Living Book.
    if (payload.proposeFactCorrection && payload.ownerNote?.trim()) {
      const proposed = await insertLeoFactCorrectionProposal({
        ownerKey,
        feedbackId: saved.record.id,
        currentStatement: payload.responseSnapshot ?? null,
        proposedStatement: payload.ownerNote.trim(),
        sourceContext: payload.requestSnapshot ?? null,
      });
      if (proposed.ok) correction = proposed.proposal;
    }

    return { ok: true, record: saved.record, correction };
  } catch {
    return { ok: false, error: "persistence_unavailable", persistenceState: "NOT_PERSISTED" };
  }
}

export async function getLeoFeedbackQualitySnapshot(): Promise<LeoFeedbackQualitySnapshot> {
  await requireLeoOwnerAccess();
  if (!isSupabaseAdminConfigured()) {
    return {
      ratedResponses: 0,
      positiveCount: 0,
      negativeCount: 0,
      positiveRate: null,
      negativeByFailureClass: {},
      topNegativeCategory: null,
      navigationErrorCount: 0,
      voiceRecognitionErrorCount: 0,
      dataQualityErrorCount: 0,
      limitation: "Feedback store is not configured in this environment.",
    };
  }
  try {
    const rows = await listLeoResponseFeedback(300);
    return aggregateLeoFeedbackQuality(rows);
  } catch {
    return {
      ratedResponses: 0,
      positiveCount: 0,
      negativeCount: 0,
      positiveRate: null,
      negativeByFailureClass: {},
      topNegativeCategory: null,
      navigationErrorCount: 0,
      voiceRecognitionErrorCount: 0,
      dataQualityErrorCount: 0,
      limitation: "Feedback metrics are temporarily unavailable.",
    };
  }
}

export async function listLeoRegressionCandidates(): Promise<LeoRegressionCandidate[]> {
  await requireLeoOwnerAccess();
  if (!isSupabaseAdminConfigured()) return [];
  const rows = await listLeoResponseFeedback(300);
  return leoCollectRegressionCandidates(rows);
}
