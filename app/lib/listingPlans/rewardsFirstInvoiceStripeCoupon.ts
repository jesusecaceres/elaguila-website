/**
 * LEONIX IX REWARDS — the first-invoice discount that lets credits reach a SUBSCRIPTION checkout.
 *
 * WHY A COUPON AT ALL, AND WHY THIS SHAPE
 * ---------------------------------------
 * On a one-time checkout, credits reduce the line item and there is nothing more to do. On a
 * subscription they cannot: the line item's `unit_amount` IS the recurring price, so taking $50 of
 * credits off it would bill $199 every month for ever. Stripe's answer is a `duration: "once"`
 * coupon, which discounts the FIRST invoice and leaves the subscription's own price alone — the
 * same mechanism the verified-15% introductory discount already uses.
 *
 * ONE SLOT, SO ONE COUPON.
 *
 * A Checkout Session takes a single `discounts` entry, and Stripe rejects `allow_promotion_codes`
 * and `discounts` together. A verified-intro customer spending credits therefore cannot have two
 * coupons — so this carries BOTH: `amountOffCents` is the whole first-invoice reduction, intro plus
 * credits, computed server-side. That is also what makes "apply the intro discount first, then take
 * credits from what remains" true rather than a claim: the caller subtracts the intro discount
 * before sizing the credits, and the two are added back together exactly once here.
 *
 * FIXED-ID COUPONS ARE NOT AN OPTION HERE.
 *
 * The intro coupon can be one reusable fixed id because 15%-off-once is the same object for every
 * customer. An amount is not: every redemption is a different number of cents. So the id is derived
 * from the payment record and the exact amount, which makes it deterministic (a retry re-derives
 * the same id and re-uses the same coupon) while making it impossible for a coupon created for a
 * different amount to be silently reused — the amount is IN the id, and is validated again on
 * retrieve.
 *
 * FAIL CLOSED, LIKE ITS NEIGHBOURS.
 *
 * A coupon that exists under this id with the wrong `amount_off`, currency, or duration is never
 * used. An unresolved Stripe failure stops the checkout for the requested redemption; it never
 * falls back to full price while telling the customer their credits were applied, and it never
 * reduces the recurring price.
 */

import "server-only";
import Stripe from "stripe";

export type EnsureRewardsFirstInvoiceCouponResult =
  | { ok: true; couponId: string }
  | {
      ok: false;
      code: "stripe_not_configured" | "coupon_misconfigured" | "stripe_error" | "invalid_amount";
      message: string;
    };

function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  return secret ? new Stripe(secret, { typescript: true }) : null;
}

function isResourceAlreadyExists(e: unknown): boolean {
  const code =
    (e as { code?: string; raw?: { code?: string } } | null)?.code ??
    (e as { raw?: { code?: string } } | null)?.raw?.code;
  return code === "resource_already_exists";
}

/**
 * The coupon id for one first-invoice reduction.
 *
 * Deterministic in the two things that define it — WHICH purchase and HOW MUCH — so a retry of the
 * same checkout attempt re-uses the same coupon, and a different amount can never land on it.
 * Stripe coupon ids are limited to 200 characters; a uuid plus the amount is far inside that.
 */
export function buildRewardsFirstInvoiceCouponId(input: {
  paymentRecordId: string;
  amountOffCents: number;
  currency: string;
}): string {
  const safeRecord = input.paymentRecordId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const cents = Math.max(0, Math.floor(input.amountOffCents));
  return `leonix_rw1_${safeRecord}_${input.currency.toLowerCase()}_${cents}`;
}

export function isValidRewardsFirstInvoiceCoupon(
  coupon: Pick<Stripe.Coupon, "amount_off" | "currency" | "duration">,
  amountOffCents: number,
  currency: string,
): boolean {
  return (
    coupon.amount_off === Math.floor(amountOffCents) &&
    (coupon.currency ?? "").toLowerCase() === currency.toLowerCase() &&
    coupon.duration === "once"
  );
}

export async function ensureRewardsFirstInvoiceCoupon(input: {
  paymentRecordId: string;
  /** The WHOLE first-invoice reduction: the verified-intro discount plus the approved credits. */
  amountOffCents: number;
  currency: string;
}): Promise<EnsureRewardsFirstInvoiceCouponResult> {
  const amountOffCents = Math.floor(input.amountOffCents);
  if (!Number.isFinite(amountOffCents) || amountOffCents <= 0) {
    // A zero-amount coupon would be a no-op the customer was told was a discount.
    return { ok: false, code: "invalid_amount", message: "A first-invoice discount must be a positive amount." };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return { ok: false, code: "stripe_not_configured", message: "Stripe is not configured on this server." };
  }

  const currency = input.currency.toLowerCase();
  const couponId = buildRewardsFirstInvoiceCouponId({
    paymentRecordId: input.paymentRecordId,
    amountOffCents,
    currency,
  });
  const misconfigured: EnsureRewardsFirstInvoiceCouponResult = {
    ok: false,
    code: "coupon_misconfigured",
    message: "The first-invoice discount coupon exists with an unexpected configuration.",
  };

  try {
    const existing = await stripe.coupons.retrieve(couponId);
    return isValidRewardsFirstInvoiceCoupon(existing, amountOffCents, currency)
      ? { ok: true, couponId: existing.id }
      : misconfigured;
  } catch {
    // Not found, or a transient retrieve error — attempt creation below.
  }

  try {
    const created = await stripe.coupons.create(
      {
        id: couponId,
        amount_off: amountOffCents,
        currency,
        duration: "once",
        name: "Leonix credits (first invoice)",
        metadata: {
          leonix_kind: "rewards_first_invoice",
          leonix_payment_record_id: input.paymentRecordId,
          leonix_amount_off_cents: String(amountOffCents),
        },
      },
      // The SAME key for the same (record, amount), so a retried checkout attempt cannot mint a
      // second coupon for one redemption.
      { idempotencyKey: `coupon:${couponId}` },
    );
    return isValidRewardsFirstInvoiceCoupon(created, amountOffCents, currency)
      ? { ok: true, couponId: created.id }
      : misconfigured;
  } catch (e) {
    if (isResourceAlreadyExists(e)) {
      // A concurrent attempt created it first. Retrieve and validate rather than trust the race.
      try {
        const raced = await stripe.coupons.retrieve(couponId);
        return isValidRewardsFirstInvoiceCoupon(raced, amountOffCents, currency)
          ? { ok: true, couponId: raced.id }
          : misconfigured;
      } catch {
        return { ok: false, code: "stripe_error", message: "Could not resolve the first-invoice discount." };
      }
    }
    return { ok: false, code: "stripe_error", message: "Could not create the first-invoice discount." };
  }
}
