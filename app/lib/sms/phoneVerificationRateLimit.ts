/**
 * Package C Build 2 (C4) — atomic unique-slot rate-limit claiming (impure, server-only).
 *
 * Each claim attempt is a single-row INSERT against the partial unique index
 * `(rate_subject, rate_window_kind, rate_window_start, rate_slot)` on
 * leonix_phone_verification_challenges. The app tries `rate_slot` 1..maxSlots via sequential
 * single-row INSERTs, stopping at the first success; exhausting all slots (every attempt hits a
 * real 23505) IS the rate-limit rejection — there is no separate COUNT-then-decide step, so
 * concurrent requests cannot race past the limit.
 */

import "server-only";
import { createHash } from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  type RateLimitConfig,
  truncateToBucket,
  decideRateLimitOutcome,
} from "./phoneVerificationRateLimitPolicy";

const TABLE = "leonix_phone_verification_challenges";

export function hashIp(ip: string): string {
  return createHash("sha256").update(String(ip ?? "").trim(), "utf8").digest("hex");
}

export type ClaimRateLimitSlotInput = {
  rateSubject: string;
  rateWindowKind: "request_cooldown" | "request_hourly" | "check_ten_min";
  config: RateLimitConfig;
  attemptKind: "request" | "check";
  phoneE164: string;
  ownerUserId: string | null;
};

/**
 * Attempts to claim one slot within the current time bucket. Returns `{allowed:false}` only
 * after every slot 1..maxSlots has been tried and genuinely rejected by the database — never
 * from a pre-check count.
 */
export async function claimRateLimitSlot(
  input: ClaimRateLimitSlotInput,
): Promise<{ allowed: boolean; claimedSlot: number | null }> {
  if (!isSupabaseAdminConfigured()) return { allowed: false, claimedSlot: null };
  const supabase = getAdminSupabase();
  const windowStartMs = truncateToBucket(Date.now(), input.config.bucketMs);
  const windowStart = new Date(windowStartMs).toISOString();

  for (let slot = 1; slot <= input.config.maxSlots; slot += 1) {
    const { error } = await supabase.from(TABLE).insert({
      owner_user_id: input.ownerUserId,
      phone_e164: input.phoneE164,
      attempt_kind: input.attemptKind,
      outcome: "pending",
      rate_subject: input.rateSubject,
      rate_window_kind: input.rateWindowKind,
      rate_window_start: windowStart,
      rate_slot: slot,
    });
    if (!error) {
      return { allowed: decideRateLimitOutcome(slot, input.config).allowed, claimedSlot: slot };
    }
    if (error.code !== "23505") {
      // Unexpected DB error — fail closed rather than silently allowing.
      return { allowed: false, claimedSlot: null };
    }
    // 23505 on this slot — try the next one.
  }
  return { allowed: false, claimedSlot: null };
}
