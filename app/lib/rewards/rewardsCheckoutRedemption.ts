/**
 * LEONIX IX REWARDS — applying credits to a real Revenue OS checkout.
 *
 * This is the seam the customer actually spends through, and it is deliberately thin: it owns no
 * pricing rule and no balance arithmetic. `rewardsPolicy.planRedemption()` decides how much may be
 * applied, `rewardsLedgerCore` reserves and settles it, and this module exists only to bind those
 * to the checkout's own identity and lifecycle.
 *
 * THE REFERENCE IS THE CHECKOUT ATTEMPT KEY.
 * `computeCheckoutAttemptKey()` already produces one stable id per purchase attempt, surviving a
 * double click, a second tab and a retried request. Using it as the redemption reference means a
 * retry reuses the SAME hold instead of stacking a second one, and the `deduplicated` flag on the
 * result is what stops a replayed reference being reported to the customer as a fresh discount.
 *
 * THE LIFECYCLE
 *   reserve   at checkout creation, from the SERVER-planned amount, never a browser figure
 *   commit    only after `checkout.session.completed` — the money actually arrived
 *   release   on a failed Stripe call, a released stale attempt, an expired session, or the
 *             30-minute hold running out
 *
 * NO LIVE STRIPE CALL HAPPENS HERE. The reduced amount is handed back to the checkout route,
 * which feeds it through the SAME `finalAmountCents` seam the promo and verified-intro discounts
 * already use — so credits never become a second, parallel pricing path.
 */
import "server-only";

import { writeRevenueAuditLog } from "@/app/lib/listingPlans/revenueAuditLog";
import { buildRewardsStorePort, isRewardsConfigured, resolveWalletOwnerForPayment } from "./rewardsLedger";
import {
  commitReservedCredits,
  releaseReservedCredits,
  reserveCreditsForPurchase,
  reserveIdempotencyKey,
} from "./rewardsLedgerCore";
import {
  DEFAULT_RAIL_MINIMUM_CHARGE_CENTS,
  REDEMPTION_MINIMUM_CENTS,
  checkoutCreditsCopy,
  maxRedeemableForPurchaseCents,
  planRedemption,
} from "./rewardsPolicy";

export type CheckoutCreditApplication =
  | {
      applied: true;
      creditsAppliedCents: number;
      remainingDueCents: number;
      redemptionId: string;
      expiresAtIso: string | null;
      /** True when this call matched a hold that already existed. Nothing new was reserved. */
      deduplicated: boolean;
    }
  | { applied: false; reason: string; maxRedeemableCents: number };

/**
 * The most this customer could apply to this purchase right now.
 *
 * Read-only and safe to call before the customer has chosen anything: the redemption UI asks this
 * so it can show a real ceiling instead of letting someone type a number the server will silently
 * cut down.
 */
export async function quoteCheckoutCredits(input: {
  ownerUserId: string | null;
  amountDueCents: number;
  eligiblePurchaseCents?: number;
  minimumChargeCents?: number;
}): Promise<{
  availableCents: number;
  reservedCents: number;
  maxRedeemableCents: number;
  minimumCents: number;
  eligible: boolean;
  reason?: string;
}> {
  const none = {
    availableCents: 0,
    reservedCents: 0,
    maxRedeemableCents: 0,
    minimumCents: REDEMPTION_MINIMUM_CENTS,
    eligible: false,
  };
  if (!isRewardsConfigured()) return { ...none, reason: "rewards_not_configured" };
  if (!input.ownerUserId) return { ...none, reason: "auth_required" };

  const owner = await resolveWalletOwnerForPayment({ paymentRecordId: "", ownerUserId: input.ownerUserId });
  if (!owner) return { ...none, reason: "no_wallet" };

  const walletRes = await buildRewardsStorePort().resolveWallet(owner);
  if (!walletRes.ok) return { ...none, reason: "wallet_unavailable" };

  const wallet = walletRes.wallet;
  // Asking the real planner for the ceiling, rather than recomputing it here, is what keeps the
  // quoted maximum and the enforced maximum the same number.
  const plan = planRedemption({
    requestedCents: wallet.availableCents,
    availableCents: wallet.availableCents,
    amountDueCents: input.amountDueCents,
    eligiblePurchaseCents: input.eligiblePurchaseCents,
    minimumChargeCents: input.minimumChargeCents,
  });

  const maxRedeemableCents = plan.ok ? plan.redeemCents : plan.maxRedeemableCents;
  return {
    availableCents: wallet.availableCents,
    reservedCents: wallet.reservedCents,
    maxRedeemableCents,
    minimumCents: REDEMPTION_MINIMUM_CENTS,
    eligible: maxRedeemableCents >= REDEMPTION_MINIMUM_CENTS,
    ...(maxRedeemableCents >= REDEMPTION_MINIMUM_CENTS ? {} : { reason: "below_minimum" }),
  };
}

/**
 * Plan and hold credits for a checkout that is about to be created.
 *
 * `requestedCents` is the customer's WISH. What actually gets held is whatever `planRedemption`
 * allows against the live balance, the 50% ceiling, the amount owed and the rail's floor. A
 * browser-supplied number is never applied as given, which is why the return value carries the
 * server's figures rather than echoing the request.
 */
export async function reserveCheckoutCredits(input: {
  ownerUserId: string | null;
  requestedCents: number;
  amountDueCents: number;
  eligiblePurchaseCents?: number;
  minimumChargeCents?: number;
  checkoutAttemptKey: string;
  paymentRecordId?: string | null;
}): Promise<CheckoutCreditApplication> {
  const refused = (reason: string, maxRedeemableCents = 0): CheckoutCreditApplication => ({
    applied: false,
    reason,
    maxRedeemableCents,
  });

  if (!isRewardsConfigured()) return refused("rewards_not_configured");
  if (!input.ownerUserId) return refused("auth_required");
  if (!input.checkoutAttemptKey) return refused("no_redemption_reference");

  const requested = Math.floor(input.requestedCents);
  if (!Number.isFinite(requested) || requested <= 0) return refused("nothing_requested");

  try {
    const owner = await resolveWalletOwnerForPayment({ paymentRecordId: "", ownerUserId: input.ownerUserId });
    if (!owner) return refused("no_wallet");

    const res = await reserveCreditsForPurchase({
      owner,
      requestedCents: requested,
      amountDueCents: input.amountDueCents,
      eligiblePurchaseCents: input.eligiblePurchaseCents,
      minimumChargeCents: input.minimumChargeCents ?? DEFAULT_RAIL_MINIMUM_CHARGE_CENTS,
      redemptionRef: input.checkoutAttemptKey,
      contextKind: "stripe_checkout",
      paymentRecordId: input.paymentRecordId ?? null,
      actorAuthUserId: input.ownerUserId,
      ports: buildRewardsStorePort(),
    });

    if (!res.ok) {
      return refused(res.reason, res.maxRedeemableCents ?? 0);
    }
    // A reused reference whose hold was already released or expired holds nothing. Treating that
    // as an applied discount is the phantom-discount failure: the customer would be shown a price
    // cut backed by no reservation at all.
    if (res.redeemCents <= 0) {
      return refused("hold_no_longer_active", 0);
    }

    await writeRevenueAuditLog({
      action: "revenue_payment_completed",
      targetType: "leonix_rewards_ledger",
      targetId: input.paymentRecordId ?? null,
      meta: {
        rewards_action: "rewards_redemption",
        rewards_outcome: res.deduplicated ? "reserve_deduplicated" : "reserved",
        rewards_amount_cents: res.redeemCents,
        checkout_attempt_key: input.checkoutAttemptKey,
        redemption_id: res.redemptionId,
        expires_at: res.expiresAtIso,
      },
    }).catch(() => undefined);

    return {
      applied: true,
      creditsAppliedCents: res.redeemCents,
      remainingDueCents: res.remainingDueCents,
      redemptionId: res.redemptionId,
      expiresAtIso: res.expiresAtIso,
      deduplicated: res.deduplicated,
    };
  } catch (e) {
    // A rewards failure must never block a purchase. The customer pays full price and keeps
    // their credits — the honest outcome — rather than seeing the checkout fail.
    return refused(e instanceof Error ? e.message.slice(0, 200) : "reserve_failed");
  }
}

/** The hold currently attached to a checkout attempt, if any is still live. */
export async function readCheckoutCreditHold(
  checkoutAttemptKey: string,
): Promise<{ creditsAppliedCents: number; status: string; expiresAtIso: string | null } | null> {
  if (!isRewardsConfigured() || !checkoutAttemptKey) return null;
  try {
    const hold = await buildRewardsStorePort().findRedemption(reserveIdempotencyKey(checkoutAttemptKey));
    if (!hold) return null;
    return {
      // A released or expired hold funds nothing, and must not be reported as money off.
      creditsAppliedCents: hold.status === "reserved" || hold.status === "committed" ? hold.amountCents : 0,
      status: hold.status,
      expiresAtIso: hold.expiresAtIso ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Spend the held credits. Called ONLY from the webhook, after the payment is marked paid.
 *
 * Idempotent through `commit:<ref>`, so a redelivered `checkout.session.completed` commits once.
 */
export async function commitCheckoutCredits(input: {
  checkoutAttemptKey: string;
  paymentRecordId: string;
}): Promise<{ committed: boolean; amountCents: number; reason?: string }> {
  if (!isRewardsConfigured() || !input.checkoutAttemptKey) {
    return { committed: false, amountCents: 0, reason: "not_applicable" };
  }
  try {
    const res = await commitReservedCredits({
      redemptionRef: input.checkoutAttemptKey,
      paymentRecordId: input.paymentRecordId,
      ports: buildRewardsStorePort(),
    });
    if (!res.ok) {
      // "No reservation" is the ordinary case for a checkout that applied no credits at all.
      if (res.error === "reservation_not_found") return { committed: false, amountCents: 0, reason: "no_hold" };
      await writeRevenueAuditLog({
        action: "revenue_payment_completed",
        targetType: "leonix_rewards_ledger",
        targetId: input.paymentRecordId,
        meta: {
          rewards_action: "rewards_redemption",
          rewards_outcome: "commit_failed",
          rewards_reason: res.error,
          retryable: true,
          checkout_attempt_key: input.checkoutAttemptKey,
        },
      }).catch(() => undefined);
      return { committed: false, amountCents: 0, reason: res.error };
    }

    await writeRevenueAuditLog({
      action: "revenue_payment_completed",
      targetType: "leonix_rewards_ledger",
      targetId: input.paymentRecordId,
      meta: {
        rewards_action: "rewards_redemption",
        rewards_outcome: res.outcome === "committed" ? "committed" : "already_final",
        rewards_amount_cents: res.outcome === "committed" ? res.amountCents : 0,
        checkout_attempt_key: input.checkoutAttemptKey,
      },
    }).catch(() => undefined);

    return { committed: res.outcome === "committed", amountCents: res.amountCents };
  } catch (e) {
    return { committed: false, amountCents: 0, reason: e instanceof Error ? e.message.slice(0, 200) : "commit_failed" };
  }
}

/**
 * Give the credits back. Called when a checkout will not complete: a Stripe session that failed
 * to create, a stale attempt being released, or an expired session.
 *
 * Best-effort and never throws — but it is NOT the only safety net. The 30-minute expiry sweep
 * releases anything this misses, so a crashed request cannot strand a customer's balance.
 */
export async function releaseCheckoutCredits(input: {
  checkoutAttemptKey: string;
  reason: string;
  paymentRecordId?: string | null;
}): Promise<{ released: boolean; amountCents: number }> {
  if (!isRewardsConfigured() || !input.checkoutAttemptKey) return { released: false, amountCents: 0 };
  try {
    const res = await releaseReservedCredits({
      redemptionRef: input.checkoutAttemptKey,
      ports: buildRewardsStorePort(),
    });
    if (!res.ok) return { released: false, amountCents: 0 };

    if (res.outcome === "released") {
      await writeRevenueAuditLog({
        action: "revenue_payment_completed",
        targetType: "leonix_rewards_ledger",
        targetId: input.paymentRecordId ?? null,
        meta: {
          rewards_action: "rewards_redemption",
          rewards_outcome: "released",
          rewards_reason: input.reason,
          rewards_amount_cents: res.amountCents,
          checkout_attempt_key: input.checkoutAttemptKey,
        },
      }).catch(() => undefined);
    }
    return { released: res.outcome === "released", amountCents: res.amountCents };
  } catch {
    return { released: false, amountCents: 0 };
  }
}

// The customer-facing copy for these figures lives in `rewardsPolicy.ts` (pure, `checkoutCreditsCopy`)
// rather than here, because this module is `server-only` and the copy has to be reachable from a
// client component and from the behavioural verifier alike.
export { checkoutCreditsCopy, maxRedeemableForPurchaseCents };
