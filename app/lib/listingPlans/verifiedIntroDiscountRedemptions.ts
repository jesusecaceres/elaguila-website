/**
 * Package C Build 2 (C4) — verified-intro-15% discount reservation/redemption lifecycle.
 * Mirrors revenuePromoRedemptions.ts's shape for the promo-code system, adapted for an
 * identity-verified (no typed code) benefit with atomic, concurrency-safe reservation.
 *
 * Reservation concurrency (decision 5/7 in the plan): the four partial unique indexes on
 * leonix_verified_intro_discount_redemptions (owner_user_id; verified_email_identity_hash;
 * verified_phone_identity_hash; composite business_identity_type+business_identity_key), each
 * covering BOTH 'reserved' and 'redeemed' states, are the actual concurrency gate — this module
 * never does a SELECT-then-decide check for eligibility; it attempts a plain INSERT and lets the
 * database reject it atomically on conflict.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "leonix_verified_intro_discount_redemptions";
const RESERVATION_TTL_MS = 24 * 60 * 60 * 1000; // matches Stripe Checkout's default session expiry

export type ReserveVerifiedIntroDiscountInput = {
  ownerUserId: string;
  verifiedEmailIdentityHash: string | null;
  verifiedEmailMasked: string | null;
  verifiedPhoneIdentityHash: string | null;
  verifiedPhoneMasked: string | null;
  phoneIdentityId: string | null;
  businessIdentityType: string;
  businessIdentityKey: string;
  businessIdentityFallbackReason: string | null;
  category: string;
  packageKey: string;
  listingId: string | null;
  leonixAdId: string | null;
  checkoutAttemptKey: string;
  verificationMethod: "email" | "sms";
  baseAmountCents: number;
  discountCents: number;
};

export type ReserveVerifiedIntroDiscountResult =
  | { ok: true; redemptionId: string; reused: boolean }
  | { ok: false; code: "already_reserved" | "already_redeemed" | "reservation_failed"; message: string };

async function findReservationByAttemptKey(
  checkoutAttemptKey: string,
): Promise<{ id: string; status: string; reservation_expires_at: string | null } | null> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from(TABLE)
    .select("id, status, reservation_expires_at")
    .eq("checkout_attempt_key", checkoutAttemptKey)
    .eq("status", "reserved")
    .maybeSingle();
  return data ?? null;
}

/**
 * Reserves the verified-15% benefit, or reuses the existing reservation for the same stable
 * `checkoutAttemptKey`. Atomic: the INSERT itself is the concurrency gate (see module header).
 */
export async function reserveOrReuseVerifiedIntroDiscount(
  input: ReserveVerifiedIntroDiscountInput,
): Promise<ReserveVerifiedIntroDiscountResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "reservation_failed", message: "Supabase admin not configured." };
  }
  const supabase = getAdminSupabase();
  const now = Date.now();

  const existing = await findReservationByAttemptKey(input.checkoutAttemptKey);
  if (existing) {
    const expiresAt = existing.reservation_expires_at ? Date.parse(existing.reservation_expires_at) : 0;
    if (expiresAt > now) {
      return { ok: true, redemptionId: existing.id, reused: true };
    }
    // CAS release — only flips this exact row, only if it's still 'reserved' and truly expired.
    await supabase
      .from(TABLE)
      .update({ status: "expired", expired_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("status", "reserved")
      .lt("reservation_expires_at", new Date(now).toISOString());
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      owner_user_id: input.ownerUserId,
      verified_email_identity_hash: input.verifiedEmailIdentityHash,
      verified_email_masked: input.verifiedEmailMasked,
      verified_phone_identity_hash: input.verifiedPhoneIdentityHash,
      verified_phone_masked: input.verifiedPhoneMasked,
      phone_identity_id: input.phoneIdentityId,
      business_identity_type: input.businessIdentityType,
      business_identity_key: input.businessIdentityKey,
      business_identity_fallback_reason: input.businessIdentityFallbackReason,
      category: input.category,
      package_key: input.packageKey,
      listing_id: input.listingId,
      leonix_ad_id: input.leonixAdId,
      checkout_attempt_key: input.checkoutAttemptKey,
      verification_method: input.verificationMethod,
      status: "reserved",
      discount_percent: 15,
      base_amount_cents: Math.max(0, input.baseAmountCents),
      discount_cents: Math.max(0, input.discountCents),
      reserved_at: new Date(now).toISOString(),
      reservation_expires_at: new Date(now + RESERVATION_TTL_MS).toISOString(),
    })
    .select("id")
    .single();

  if (!error && data?.id) {
    return { ok: true, redemptionId: data.id as string, reused: false };
  }

  if (error?.code === "23505") {
    // Diagnostic-only lookup (never gating) to report an accurate, honest reason.
    const orClauses = [
      `owner_user_id.eq.${input.ownerUserId}`,
      ...(input.verifiedEmailIdentityHash ? [`verified_email_identity_hash.eq.${input.verifiedEmailIdentityHash}`] : []),
      ...(input.verifiedPhoneIdentityHash ? [`verified_phone_identity_hash.eq.${input.verifiedPhoneIdentityHash}`] : []),
      `and(business_identity_type.eq.${input.businessIdentityType},business_identity_key.eq.${input.businessIdentityKey})`,
    ].join(",");
    const { data: conflictRows } = await supabase
      .from(TABLE)
      .select("id, status")
      .in("status", ["reserved", "redeemed"])
      .or(orClauses)
      .limit(1);
    const conflict = conflictRows?.[0];
    if (conflict?.status === "redeemed") {
      return { ok: false, code: "already_redeemed", message: "This introductory discount has already been used." };
    }
    return { ok: false, code: "already_reserved", message: "A reservation for this introductory discount is already in progress." };
  }

  return { ok: false, code: "reservation_failed", message: error?.message ?? "Failed to reserve the introductory discount." };
}

/** Companion to Build 1's releaseStaleCheckoutAttempt — called from the same code path. */
export async function releaseVerifiedIntroDiscountReservation(checkoutAttemptKey: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from(TABLE)
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("checkout_attempt_key", checkoutAttemptKey)
    .eq("status", "reserved")
    .select("id");
  return Boolean(data?.length);
}

export async function attachStripeSessionToVerifiedIntroDiscountRedemption(input: {
  redemptionId: string;
  stripeCheckoutSessionId: string;
  stripeCouponId?: string | null;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      ...(input.stripeCouponId ? { stripe_coupon_id: input.stripeCouponId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.redemptionId);
  return !error;
}

export async function attachVerifiedIntroDiscountRedemptionToPaymentRecord(input: {
  paymentRecordId: string;
  redemptionId: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leonix_payment_records")
    .update({
      verified_intro_discount_redemption_id: input.redemptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.paymentRecordId);
  return !error;
}

/** Webhook fulfillment — conditional, replay-safe: 'reserved' -> 'redeemed' only. */
export async function markVerifiedIntroDiscountRedemptionRedeemed(
  redemptionId: string,
): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: "redeemed", redeemed_at: now, updated_at: now })
    .eq("id", redemptionId)
    .eq("status", "reserved")
    .select("id");

  if (error) {
    return { ok: false, code: "redemption_update_failed", message: error.message };
  }
  if (data?.length) return { ok: true };

  const { data: row } = await supabase.from(TABLE).select("status").eq("id", redemptionId).maybeSingle();
  if (row?.status === "redeemed") return { ok: true, idempotent: true };
  return { ok: false, code: "unexpected_redemption_state", message: `Redemption ${redemptionId} was not in 'reserved' state.` };
}

/** Webhook fulfillment — mirrors markPromoRedemptionExpiredOrCancelled. */
export async function markVerifiedIntroDiscountRedemptionExpiredOrCancelled(
  redemptionId: string,
): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const supabase = getAdminSupabase();
  const { data: row } = await supabase.from(TABLE).select("status").eq("id", redemptionId).maybeSingle();
  if (!row) return { ok: false, code: "redemption_not_found", message: "Redemption not found." };
  if (row.status === "expired" || row.status === "released" || row.status === "rejected") {
    return { ok: true, idempotent: true };
  }
  if (row.status === "redeemed") {
    return { ok: false, code: "already_redeemed", message: "Cannot expire an already-redeemed redemption." };
  }
  const { error } = await supabase
    .from(TABLE)
    .update({ status: "expired", expired_at: new Date().toISOString() })
    .eq("id", redemptionId)
    .eq("status", "reserved");
  if (error) return { ok: false, code: "redemption_update_failed", message: error.message };
  return { ok: true };
}
