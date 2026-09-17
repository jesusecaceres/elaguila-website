/**
 * Gate 1 — bounded Advisor refresh for the Staff Command Center.
 *
 * scanBusinessSignals() (signalScanner.ts) and createSignal() (repository.ts) have existed since
 * Program 7 but had no production caller — business_advisor_signals was permanently empty. This
 * module is that caller.
 *
 * Design:
 * - Scoped, not global: scans only a small, bounded set of businesses per call
 *   (ADVISOR_REFRESH_SCAN_LIMIT), reusing whatever business scope the caller already loaded for
 *   the current page — never an unbounded scan of the whole workspace.
 * - Idempotent: a signal type already active for a business is never re-created. Repeated
 *   refreshes converge, they do not accumulate duplicate rows.
 * - Staff-only write: the caller must pass a real staff AdvisorActor. owner_bootstrap has no
 *   roster identity to attribute a write to (see businessWorkspaceAccess.ts doctrine) — callers
 *   must not construct this actor for a bootstrap session; there is no bootstrap branch here to
 *   misuse.
 */
import "server-only";

import { scanBusinessSignals } from "./signalScanner";
import { createSignal, listActiveSignals } from "./repository";
import type { AdvisorActor } from "./types";

export const ADVISOR_REFRESH_SCAN_LIMIT = 15;

async function refreshOneBusiness(businessId: string, actor: AdvisorActor): Promise<void> {
  const [existingActive, detected] = await Promise.all([
    listActiveSignals(businessId),
    scanBusinessSignals(businessId),
  ]);
  const alreadyActiveTypes = new Set(existingActive.map((signal) => signal.signalType));

  for (const signal of detected) {
    if (alreadyActiveTypes.has(signal.signalType)) continue; // idempotent — never duplicate an active signal
    await createSignal(
      businessId,
      {
        signalType: signal.signalType,
        severity: signal.severity,
        sourceType: signal.sourceType,
        sourceReferenceId: signal.sourceReferenceId,
        titleEs: signal.titleEs,
        titleEn: signal.titleEn,
        explanationEs: signal.explanationEs,
        explanationEn: signal.explanationEn,
      },
      actor,
    );
  }
}

/**
 * Refreshes Advisor signals for a small, bounded set of businesses — pass the same scope already
 * loaded for the current staff-home read (e.g. the workspace list slice), not a fresh listing
 * query. Each business's scan runs in parallel with the others; within one business, the scan
 * itself already parallelizes its own seven domain reads (signalScanner.ts).
 */
export async function refreshAdvisorSignalsForWorkspaceScope(
  businessIds: readonly string[],
  actor: AdvisorActor,
): Promise<void> {
  const scoped = [...new Set(businessIds)].slice(0, ADVISOR_REFRESH_SCAN_LIMIT);
  await Promise.all(scoped.map((businessId) => refreshOneBusiness(businessId, actor)));
}
