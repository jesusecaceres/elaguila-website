/**
 * Servicios Golden Commercial Closeout ⚠️35 (2026-09-14) — fixed-id Stripe REPEATING coupons for
 * standard finite-term contract promo codes, one per (percent, months) pair.
 *
 * Same fail-closed doctrine as the verified-intro once-coupon (verifiedIntroDiscountStripeCoupon.ts):
 * a coupon retrieved under the fixed id is validated (percent_off, duration:"repeating",
 * duration_in_months) before it is trusted; a same-id coupon with a different configuration is never
 * used; a creation race is resolved by retrieve-and-validate; any unresolved failure stops checkout
 * for the requested promo — it never falls back to a permanently reduced subscription price and never
 * proceeds at full price while claiming the promo was applied.
 */

import "server-only";
import Stripe from "stripe";
import {
  buildContractTermStripeCouponId,
  isValidContractTermCoupon,
  type PromoFiniteTerm,
} from "./promoContractTermBilling";

export type EnsureContractTermStripeCouponResult =
  | { ok: true; couponId: string }
  | { ok: false; code: "stripe_not_configured" | "coupon_misconfigured" | "stripe_error"; message: string };

function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  return secret ? new Stripe(secret, { typescript: true }) : null;
}

function isResourceAlreadyExists(e: unknown): boolean {
  const code = (e as { code?: string; raw?: { code?: string } } | null)?.code
    ?? (e as { raw?: { code?: string } } | null)?.raw?.code;
  return code === "resource_already_exists";
}

export async function ensureContractTermStripeCoupon(
  term: PromoFiniteTerm,
): Promise<EnsureContractTermStripeCouponResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    return { ok: false, code: "stripe_not_configured", message: "Stripe is not configured on this server." };
  }
  const couponId = buildContractTermStripeCouponId(term.percentOff, term.termMonths);
  const misconfigured: EnsureContractTermStripeCouponResult = {
    ok: false,
    code: "coupon_misconfigured",
    message: "The contract-term promo coupon exists but has an unexpected configuration.",
  };

  try {
    const existing = await stripe.coupons.retrieve(couponId);
    return isValidContractTermCoupon(existing, term.percentOff, term.termMonths)
      ? { ok: true, couponId: existing.id }
      : misconfigured;
  } catch {
    // Not found (or a transient retrieve error) — attempt creation.
  }

  try {
    const created = await stripe.coupons.create({
      id: couponId,
      percent_off: term.percentOff,
      duration: "repeating",
      duration_in_months: term.termMonths,
      name: `Leonix contract promo ${term.percentOff}% for ${term.termMonths} months`,
    });
    return { ok: true, couponId: created.id };
  } catch (createErr) {
    if (isResourceAlreadyExists(createErr)) {
      try {
        const retried = await stripe.coupons.retrieve(couponId);
        return isValidContractTermCoupon(retried, term.percentOff, term.termMonths)
          ? { ok: true, couponId: retried.id }
          : misconfigured;
      } catch {
        return { ok: false, code: "stripe_error", message: "Failed to resolve the contract-term coupon after a creation race." };
      }
    }
    return { ok: false, code: "stripe_error", message: "Failed to create the contract-term promo coupon." };
  }
}
