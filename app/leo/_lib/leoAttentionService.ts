/**
 * LEO-4 Attention service — owner-only orchestration over current LEO truth.
 *
 * Fetches executive snapshot + Client Care signals → Attention Engine.
 * No memory writes. No AI. No outreach.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoExecutiveTruthSnapshot } from "@/app/leo/_lib/leoAdminTruthAdapter";
import {
  buildLeoAttentionBrief,
  LEO_ATTENTION_DEFAULT_TOP_N,
} from "@/app/leo/_lib/leoAttentionEngine";
import { fetchLeoClientCareSourceRecords } from "@/app/leo/_lib/leoClientCareAdapter";
import {
  buildLeoClientCareSignals,
  leoClientCareSignalsToObservations,
} from "@/app/leo/_lib/leoClientCareWatcher";
import type { LeoAttentionBrief } from "@/app/leo/_lib/leoTypes";

export type LeoAttentionServiceOptions = {
  topN?: number;
  nowMs?: number;
  /** When false, skip Client Care merge (LEO-4-only path). Default true. */
  includeClientCare?: boolean;
};

/**
 * Owner-admin only. Computed current-state brief — not persisted.
 */
export async function getLeoAttentionBrief(
  options: LeoAttentionServiceOptions = {},
): Promise<LeoAttentionBrief> {
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

  return buildLeoAttentionBrief(observations, {
    topN: options.topN ?? LEO_ATTENTION_DEFAULT_TOP_N,
    nowMs,
  });
}
