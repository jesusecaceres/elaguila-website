/**
 * Recursos Intake OS — Gate 2 reverification queue. Pure functions only, operating on
 * `ResourceRecord[]` already fetched via the existing `dbListCommunityResources()` — no new
 * DB table, no new column, no change to the 90-day default in `verificationStatus.ts`.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";

/** "Due soon" window — resources whose next_verification_at falls within this many days. */
export const DUE_SOON_WINDOW_DAYS = 14;

export type ReverificationBucket = "overdue" | "due_soon" | "current";

export type ReverificationQueueEntry = {
  record: ResourceRecord;
  bucket: ReverificationBucket;
};

function urgencyRank(record: ResourceRecord): number {
  return record.urgencyLevel === "help-now" ? 0 : record.urgencyLevel === "i-need-help" ? 1 : 2;
}

/**
 * Buckets active resources by reverification urgency and sorts each bucket help-now first,
 * then oldest `nextVerificationAt` first. Inactive resources are excluded — they are already
 * out of public rotation and are not part of the reverification operational queue.
 */
export function buildReverificationQueue(resources: ResourceRecord[], now: Date = new Date()): Record<ReverificationBucket, ReverificationQueueEntry[]> {
  const buckets: Record<ReverificationBucket, ReverificationQueueEntry[]> = { overdue: [], due_soon: [], current: [] };
  const dueSoonThreshold = new Date(now.getTime() + DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  for (const record of resources) {
    if (!record.verification.active) continue;

    const effective = resolveEffectiveVerificationStatus(record.verification, now);
    const nextDue = record.verification.nextVerificationAt ? new Date(record.verification.nextVerificationAt) : null;

    let bucket: ReverificationBucket;
    if (effective === "stale" || (nextDue && nextDue.getTime() < now.getTime())) {
      bucket = "overdue";
    } else if (nextDue && nextDue.getTime() <= dueSoonThreshold.getTime()) {
      bucket = "due_soon";
    } else {
      bucket = "current";
    }
    buckets[bucket].push({ record, bucket });
  }

  for (const key of Object.keys(buckets) as ReverificationBucket[]) {
    buckets[key].sort((a, b) => {
      const urgencyDiff = urgencyRank(a.record) - urgencyRank(b.record);
      if (urgencyDiff !== 0) return urgencyDiff;
      const aDue = a.record.verification.nextVerificationAt ? new Date(a.record.verification.nextVerificationAt).getTime() : Infinity;
      const bDue = b.record.verification.nextVerificationAt ? new Date(b.record.verification.nextVerificationAt).getTime() : Infinity;
      return aDue - bDue;
    });
  }

  return buckets;
}
