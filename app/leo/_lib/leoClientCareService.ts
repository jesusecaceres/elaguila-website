/**
 * LEO-5 Client Care service — owner-only orchestration.
 *
 * Read-only: fetch → watch → return signals. No writes, outreach, or memory.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { fetchLeoClientCareSourceRecords } from "@/app/leo/_lib/leoClientCareAdapter";
import { buildLeoClientCareSignals } from "@/app/leo/_lib/leoClientCareWatcher";
import type { LeoClientCareWatchResult } from "@/app/leo/_lib/leoTypes";

export type LeoClientCareServiceOptions = {
  /** Injected clock for tests; defaults to Date.now(). */
  nowMs?: number;
};

/**
 * Owner-admin only. Computed current-state care watch — not persisted.
 */
export async function getLeoClientCareWatch(
  options: LeoClientCareServiceOptions = {},
): Promise<LeoClientCareWatchResult> {
  await requireLeoOwnerAccess();
  const bundle = await fetchLeoClientCareSourceRecords();
  return buildLeoClientCareSignals({
    leads: bundle.leads,
    supportTickets: bundle.supportTickets,
    nowMs: options.nowMs ?? Date.now(),
    limitations: bundle.limitations,
    leadsAvailability: bundle.leadsAvailability,
    supportAvailability: bundle.supportAvailability,
  });
}
