/**
 * BR-FINAL-PUBLISH-STRIPE-ROTATION-05 — when Bienes publish requires Stripe vs bypass.
 */

import {
  isBrAllowTestPublishBypassEnabled,
  isBrInternalPublishPaymentBypassEnabled,
  isStripeBrCheckoutReady,
  type BrStripeLane,
} from "./stripeBrConfig";

export function brPublishPaymentRequired(lane: BrStripeLane = "negocio"): boolean {
  if (isBrInternalPublishPaymentBypassEnabled()) return false;
  if (isBrAllowTestPublishBypassEnabled()) return false;
  if (process.env.NODE_ENV === "production") return true;
  return isStripeBrCheckoutReady(lane);
}

/** Production launch: block free publish when payment is required but Stripe is not configured. */
export function brPublishBlockedMissingStripe(lane: BrStripeLane = "negocio"): boolean {
  if (!brPublishPaymentRequired(lane)) return false;
  return !isStripeBrCheckoutReady(lane);
}

export function brPublishPaymentBlockedMessage(lang: "es" | "en"): string {
  return lang === "es"
    ? "El pago con Stripe no está configurado todavía. Configura STRIPE_SECRET_KEY y STRIPE_PRICE_BIENES_NEGOCIO en el entorno de producción."
    : "Stripe payment is not configured yet. Set STRIPE_SECRET_KEY and STRIPE_PRICE_BIENES_NEGOCIO in production.";
}
