/**
 * LEO-4 / LEO-14.5 Attention service — owner-only orchestration over current LEO truth.
 *
 * Fetches executive snapshot + Client Care signals → Attention Engine → owner dispositions.
 * ACK filtering happens AFTER canonical generation. Fail-open if ACK DB unavailable.
 * No memory writes. No AI. No outreach.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoExecutiveTruthSnapshot } from "@/app/leo/_lib/leoAdminTruthAdapter";
import {
  buildLeoAttentionBrief,
  LEO_ATTENTION_DEFAULT_TOP_N,
} from "@/app/leo/_lib/leoAttentionEngine";
import { leoListOwnerAttentionAcks } from "@/app/leo/_lib/leoAttentionAckService";
import {
  applyOwnerDispositionsToAttentionBrief,
  type LeoAttentionRuntimeBrief,
} from "@/app/leo/_lib/leoAttentionRuntime";
import { fetchLeoClientCareSourceRecords } from "@/app/leo/_lib/leoClientCareAdapter";
import {
  buildLeoClientCareSignals,
  leoClientCareSignalsToObservations,
} from "@/app/leo/_lib/leoClientCareWatcher";
import { collectLeoExecutiveReportingSnapshot } from "@/app/leo/_lib/leoExecutiveReportingService";
import { mapExecutiveSignalsToAttentionObservations } from "@/app/leo/_lib/leoExecutiveReportingWatchPolicy";

export type LeoAttentionServiceOptions = {
  topN?: number;
  nowMs?: number;
  /** When false, skip Client Care merge (LEO-4-only path). Default true. */
  includeClientCare?: boolean;
  /** When true, include owner-acknowledged/dismissed/snoozed items in visible set. */
  includeAcknowledged?: boolean;
};

/**
 * Owner-admin only. Computed current-state brief — not persisted.
 * Returns runtime brief with visibleItems after disposition application.
 */
export async function getLeoAttentionBrief(
  options: LeoAttentionServiceOptions = {},
): Promise<LeoAttentionRuntimeBrief> {
  await requireLeoOwnerAccess();
  const nowMs = options.nowMs ?? Date.now();
  const snapshot = await getLeoExecutiveTruthSnapshot();
  const observations = [...snapshot.observations];

  if (options.includeClientCare !== false) {
    const bundle = await fetchLeoClientCareSourceRecords();
    const care = buildLeoClientCareSignals({
      leads: bundle.leads,
      supportTickets: bundle.supportTickets,
      nowMs,
      limitations: bundle.limitations,
      leadsAvailability: bundle.leadsAvailability,
      supportAvailability: bundle.supportAvailability,
    });
    observations.push(...leoClientCareSignalsToObservations(care.signals));
  }

  try {
    const reporting = await collectLeoExecutiveReportingSnapshot({ nowMs });
    observations.push(...mapExecutiveSignalsToAttentionObservations(reporting.signals));
  } catch {
    // Fail-soft — company reporting must not take down Attention.
  }

  const brief = buildLeoAttentionBrief(observations, {
    topN: options.topN ?? LEO_ATTENTION_DEFAULT_TOP_N,
    nowMs,
  });

  let listed: Awaited<ReturnType<typeof leoListOwnerAttentionAcks>>;
  try {
    listed = await leoListOwnerAttentionAcks();
  } catch {
    listed = { availability: "UNAVAILABLE", acks: [], errorCode: "ack_unavailable" };
  }
  return applyOwnerDispositionsToAttentionBrief({
    brief,
    acks: listed.acks,
    dispositionAvailability: listed.availability,
    nowMs,
    includeAcknowledged: options.includeAcknowledged === true,
  });
}
