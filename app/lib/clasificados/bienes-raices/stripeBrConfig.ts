/**
 * BR-FINAL-PUBLISH-STRIPE-ROTATION-05 — Stripe Price IDs for Bienes Raíces checkout.
 * Env: STRIPE_PRICE_BIENES_NEGOCIO, STRIPE_PRICE_BIENES_PRIVADO (optional privado lane).
 */

export type BrStripeLane = "negocio" | "privado";

export function getStripePriceIdForBrLane(lane: BrStripeLane): string | null {
  if (lane === "negocio") {
    return process.env.STRIPE_PRICE_BIENES_NEGOCIO?.trim() || null;
  }
  return process.env.STRIPE_PRICE_BIENES_PRIVADO?.trim() || null;
}

export function isStripeBrConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

export function isStripeBrCheckoutReady(lane: BrStripeLane = "negocio"): boolean {
  return isStripeBrConfigured() && !!getStripePriceIdForBrLane(lane);
}

export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

/** Never production — internal QA publish without Stripe (mirrors Autos). */
export function isBrInternalPublishPaymentBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.BR_INTERNAL_PUBLISH_PAYMENT_BYPASS === "1";
}

/** Dev/staging test publish without Stripe (never production). */
export function isBrAllowTestPublishBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.BR_ALLOW_TEST_PUBLISH_BYPASS === "1";
}

export function getBrSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (explicit) {
    const u = explicit.startsWith("http") ? explicit : `https://${explicit}`;
    return u.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
