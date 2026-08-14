/**
 * Package C Build 2 (C4) — pure rate-limit policy (no server imports; behaviorally testable).
 *
 * Enforcement is atomic, unique-slot-per-time-bucket, NOT COUNT-then-INSERT (the latter has a
 * race window: two concurrent requests both count under the limit, both insert, overshooting
 * it). This module holds the pure, deterministic parts — bucket-boundary computation and the
 * four named limit configs — so they're testable without a database. The impure module
 * (phoneVerificationRateLimit.ts) performs the actual atomic slot-claim loop against Postgres.
 */

export type RateLimitConfig = { maxSlots: number; bucketMs: number };

export const REQUEST_COOLDOWN: RateLimitConfig = { maxSlots: 1, bucketMs: 60_000 }; // 60s resend cooldown
export const REQUEST_HOURLY_PHONE: RateLimitConfig = { maxSlots: 5, bucketMs: 3_600_000 }; // 5 requests/phone/hour
export const REQUEST_HOURLY_IP: RateLimitConfig = { maxSlots: 20, bucketMs: 3_600_000 }; // 20 requests/ip/hour
export const CHECK_TEN_MIN: RateLimitConfig = { maxSlots: 5, bucketMs: 600_000 }; // 5 checks/phone/10min

/** Truncates a timestamp down to the start of its fixed-size bucket (epoch-aligned). */
export function truncateToBucket(nowMs: number, bucketMs: number): number {
  return Math.floor(nowMs / bucketMs) * bucketMs;
}

/** A slot was successfully claimed (1-indexed) within maxSlots, or none were available. */
export function decideRateLimitOutcome(claimedSlot: number | null, config: RateLimitConfig): { allowed: boolean } {
  if (claimedSlot == null) return { allowed: false };
  return { allowed: claimedSlot >= 1 && claimedSlot <= config.maxSlots };
}
