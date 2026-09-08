/**
 * Package C Build 2 (C4) — fixed-id Stripe once-coupon for the verified-15% subscription path.
 *
 * A single reusable Stripe coupon (percent_off:15, duration:"once") is safe across unlimited
 * distinct subscriptions — Stripe's `duration:"once"` applies to a subscription's first invoice
 * only, not "one global use." Resolution is fail-closed: a coupon retrieved under this fixed id
 * is validated (percent_off===15 && duration==="once") before being trusted — a coupon that
 * exists with the same id but the wrong configuration (e.g. hand-created in the Stripe
 * dashboard) is never silently used. Concurrent creation is handled by retrieve-and-validate
 * again on a "resource already exists" error, never a lock. See decision 8 in the plan: any
 * unresolved failure here means the checkout route stops entirely for an explicitly-requested
 * discount — it never falls back to a permanent reduced subscription price and never proceeds
 * at full price while claiming the discount was applied.
 */

import "server-only";
import Stripe from "stripe";

export const VERIFIED_INTRO_DISCOUNT_STRIPE_COUPON_ID = "leonix_verified_intro_15_once";

export type EnsureVerifiedIntroDiscountStripeCouponResult =
  | { ok: true; couponId: string }
  | { ok: false; code: "stripe_not_configured" | "coupon_misconfigured" | "stripe_error"; message: string };

function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  return secret ? new Stripe(secret, { typescript: true }) : null;
}

function isValidCoupon(coupon: Stripe.Coupon): boolean {
  return coupon.percent_off === 15 && coupon.duration === "once";
}

function isResourceAlreadyExists(e: unknown): boolean {
  const code = (e as { code?: string; raw?: { code?: string } } | null)?.code
    ?? (e as { raw?: { code?: string } } | null)?.raw?.code;
  return code === "resource_already_exists";
}

export async function ensureVerifiedIntroDiscountStripeCoupon(): Promise<EnsureVerifiedIntroDiscountStripeCouponResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    return { ok: false, code: "stripe_not_configured", message: "Stripe is not configured on this server." };
  }

  try {
    const existing = await stripe.coupons.retrieve(VERIFIED_INTRO_DISCOUNT_STRIPE_COUPON_ID);
    if (!isValidCoupon(existing)) {
      return {
        ok: false,
        code: "coupon_misconfigured",
        message: "The verified intro-discount coupon exists but has an unexpected configuration.",
      };
    }
    return { ok: true, couponId: existing.id };
  } catch {
    // Not found (or a transient retrieve error) — attempt creation.
  }

  try {
    const created = await stripe.coupons.create({
      id: VERIFIED_INTRO_DISCOUNT_STRIPE_COUPON_ID,
      percent_off: 15,
      duration: "once",
      name: "Leonix verified intro 15% (first payment only)",
    });
    return { ok: true, couponId: created.id };
  } catch (createErr) {
    if (isResourceAlreadyExists(createErr)) {
      // Concurrent creation race — safe to retrieve-and-validate again.
      try {
        const retried = await stripe.coupons.retrieve(VERIFIED_INTRO_DISCOUNT_STRIPE_COUPON_ID);
        if (isValidCoupon(retried)) return { ok: true, couponId: retried.id };
        return {
          ok: false,
          code: "coupon_misconfigured",
          message: "The verified intro-discount coupon exists but has an unexpected configuration.",
        };
      } catch {
        return { ok: false, code: "stripe_error", message: "Failed to resolve the intro-discount coupon after a creation race." };
      }
    }
    return { ok: false, code: "stripe_error", message: "Failed to create the verified intro-discount coupon." };
  }
}
